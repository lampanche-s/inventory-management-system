package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.request.FornecedorRequestDTO;
import com.nexusstock.almoxarifado.entity.Fornecedor;
import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.repository.FornecedorRepository;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.service.EstoqueCalculoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FornecedorServiceImplTests {

    @Mock
    private FornecedorRepository fornecedorRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private EstoqueCalculoService estoqueCalculoService;

    private FornecedorServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new FornecedorServiceImpl(
                fornecedorRepository,
                itemRepository,
                estoqueCalculoService
        );
    }

    @Test
    void aceitaFornecedorSomenteComNomeEAtivaPorPadrao() {
        FornecedorRequestDTO request = request("Acme Local Services");
        when(fornecedorRepository.save(any(Fornecedor.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.criar(request);

        ArgumentCaptor<Fornecedor> captor = ArgumentCaptor.forClass(Fornecedor.class);
        verify(fornecedorRepository).save(captor.capture());

        Fornecedor salvo = captor.getValue();
        assertThat(salvo.getNome()).isEqualTo("Acme Local Services");
        assertThat(salvo.getCnpj()).isNull();
        assertThat(salvo.getTelefone()).isNull();
        assertThat(salvo.getCep()).isNull();
        assertThat(salvo.getLogradouro()).isNull();
        assertThat(salvo.getCidade()).isNull();
        assertThat(salvo.getUf()).isNull();
        assertThat(salvo.getAtivo()).isTrue();
        assertThat(response.getAtivo()).isTrue();
    }

    @Test
    void permiteCriarFornecedorInativoQuandoStatusForInformado() {
        FornecedorRequestDTO request = request("Inactive supplier");
        request.setAtivo(false);
        when(fornecedorRepository.save(any(Fornecedor.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.criar(request);

        ArgumentCaptor<Fornecedor> captor = ArgumentCaptor.forClass(Fornecedor.class);
        verify(fornecedorRepository).save(captor.capture());
        assertThat(captor.getValue().getAtivo()).isFalse();
    }

    @Test
    void normalizaCpfAntesDeCompararEPersistir() {
        FornecedorRequestDTO request = request("Acme");
        request.setCnpj("123.456.789-01");
        when(fornecedorRepository.countByDocumentoNormalizado("12345678901")).thenReturn(0L);
        when(fornecedorRepository.save(any(Fornecedor.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.criar(request);

        ArgumentCaptor<Fornecedor> captor = ArgumentCaptor.forClass(Fornecedor.class);
        verify(fornecedorRepository).countByDocumentoNormalizado("12345678901");
        verify(fornecedorRepository).save(captor.capture());
        assertThat(captor.getValue().getCnpj()).isEqualTo("12345678901");
    }

    @Test
    void rejeitaDocumentoComQuantidadeDeDigitosInvalida() {
        FornecedorRequestDTO dozeDigitos = request("Acme 12");
        dozeDigitos.setCnpj("123456789012");

        FornecedorRequestDTO trezeDigitos = request("Acme 13");
        trezeDigitos.setCnpj("1234567890123");

        assertThatThrownBy(() -> service.criar(dozeDigitos))
                .isInstanceOf(BusinessException.class)
                .hasMessage("The CPF/CNPJ must contain exactly 11 or 14 digits.");

        assertThatThrownBy(() -> service.criar(trezeDigitos))
                .isInstanceOf(BusinessException.class)
                .hasMessage("The CPF/CNPJ must contain exactly 11 or 14 digits.");

        verify(fornecedorRepository, never()).save(any(Fornecedor.class));
    }

    @Test
    void rejeitaCaracteresQueNaoSaoPontuacaoPadraoNoDocumento() {
        FornecedorRequestDTO request = request("Acme");
        request.setCnpj("ABC12345678901");

        assertThatThrownBy(() -> service.criar(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("The CPF/CNPJ must contain only digits and standard punctuation.");

        verify(fornecedorRepository, never()).save(any(Fornecedor.class));
    }

    @Test
    void rejeitaDocumentoDuplicadoUsandoComparacaoNormalizada() {
        FornecedorRequestDTO request = request("Duplicate");
        request.setCnpj("12.345.678/0001-90");
        when(fornecedorRepository.countByDocumentoNormalizado("12345678000190")).thenReturn(1L);

        assertThatThrownBy(() -> service.criar(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("A supplier with this CPF/CNPJ already exists.");

        verify(fornecedorRepository, never()).save(any(Fornecedor.class));
    }

    @Test
    void rejeitaDocumentoDuplicadoNaAtualizacaoIgnorandoOProprioId() {
        Fornecedor existente = fornecedor(2L, "Regular supplier");
        FornecedorRequestDTO request = request("Regular supplier");
        request.setCnpj("12.345.678/0001-90");
        when(fornecedorRepository.findById(2L)).thenReturn(Optional.of(existente));
        when(fornecedorRepository.countByDocumentoNormalizadoAndIdNot("12345678000190", 2L))
                .thenReturn(1L);

        assertThatThrownBy(() -> service.atualizar(2L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Another supplier with this CPF/CNPJ already exists.");

        verify(fornecedorRepository, never()).save(existente);
    }

    @Test
    void preservaBuscaFormatadaENormalizaDocumentoParaComparacao() {
        when(fornecedorRepository.buscarComFiltros(
                eq("12.345.678/0001-90"),
                eq("12345678000190"),
                eq(true),
                any(Pageable.class)
        )).thenReturn(Page.empty());

        service.listar("12.345.678/0001-90", true, 0, 10, "nome,asc");

        verify(fornecedorRepository).buscarComFiltros(
                eq("12.345.678/0001-90"),
                eq("12345678000190"),
                eq(true),
                any(Pageable.class)
        );
    }

    @Test
    void usaStringsVaziasParaFiltrosAusentes() {
        when(fornecedorRepository.buscarComFiltros(
                eq(""),
                eq(""),
                eq(null),
                any(Pageable.class)
        )).thenReturn(Page.empty());

        service.listar(null, null, 0, 10, "nome,asc");

        verify(fornecedorRepository).buscarComFiltros(
                eq(""),
                eq(""),
                eq(null),
                any(Pageable.class)
        );
    }

    @Test
    void atualizaStatusParaInativoQuandoInformado() {
        Fornecedor existente = fornecedor(2L, "Regular supplier");
        FornecedorRequestDTO request = request("Regular supplier");
        request.setAtivo(false);
        when(fornecedorRepository.findById(2L)).thenReturn(Optional.of(existente));
        when(fornecedorRepository.save(existente)).thenReturn(existente);

        service.atualizar(2L, request);

        assertThat(existente.getAtivo()).isFalse();
        verify(fornecedorRepository).save(existente);
    }

    @Test
    void preservaStatusAtualQuandoClienteAntigoNaoEnviaAtivo() {
        Fornecedor existente = fornecedor(2L, "Regular supplier");
        existente.setAtivo(false);
        FornecedorRequestDTO request = request("Renamed supplier");
        when(fornecedorRepository.findById(2L)).thenReturn(Optional.of(existente));
        when(fornecedorRepository.save(existente)).thenReturn(existente);

        service.atualizar(2L, request);

        assertThat(existente.getAtivo()).isFalse();
        assertThat(existente.getNome()).isEqualTo("Renamed supplier");
    }

    @Test
    void impedeDesativarFornecedorNeutroDoSistema() {
        Fornecedor neutro = fornecedor(1L, "Not specified");
        FornecedorRequestDTO request = request("Not specified");
        request.setAtivo(false);
        when(fornecedorRepository.findById(1L)).thenReturn(Optional.of(neutro));

        assertThatThrownBy(() -> service.atualizar(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("The system's default supplier cannot be deactivated.");

        verify(fornecedorRepository, never()).save(neutro);
    }

    @Test
    void protegeFornecedorNeutroCriadoPelaMigracaoOriginal() {
        Fornecedor neutro = fornecedor(1L, "Not specified");
        when(fornecedorRepository.findById(1L)).thenReturn(Optional.of(neutro));

        assertThatThrownBy(() -> service.excluirDefinitivamente(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("The system's default supplier cannot be deleted.");

        verify(fornecedorRepository, never()).delete(neutro);
    }

    @Test
    void reutilizaFornecedorNeutroOriginalAoExcluirFornecedorComItens() {
        Fornecedor fornecedorExcluido = fornecedor(2L, "Regular supplier");
        Fornecedor neutroOriginal = fornecedor(1L, "Sem fornecedor");
        Item item = new Item();
        item.setId(10L);
        item.setFornecedor(fornecedorExcluido);

        when(fornecedorRepository.findById(2L)).thenReturn(Optional.of(fornecedorExcluido));
        when(fornecedorRepository.findByNomeIgnoreCase("Not specified")).thenReturn(Optional.empty());
        when(fornecedorRepository.findByNomeIgnoreCase("Sem fornecedor")).thenReturn(Optional.of(neutroOriginal));
        when(itemRepository.findByFornecedorId(2L)).thenReturn(List.of(item));

        service.excluirDefinitivamente(2L);

        assertThat(item.getFornecedor()).isSameAs(neutroOriginal);
        verify(itemRepository).saveAll(List.of(item));
        verify(fornecedorRepository).delete(fornecedorExcluido);
        verify(fornecedorRepository, never()).save(any());
    }

    private FornecedorRequestDTO request(String nome) {
        FornecedorRequestDTO request = new FornecedorRequestDTO();
        request.setNome(nome);
        return request;
    }

    private Fornecedor fornecedor(Long id, String nome) {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setId(id);
        fornecedor.setNome(nome);
        fornecedor.setAtivo(true);
        return fornecedor;
    }
}
