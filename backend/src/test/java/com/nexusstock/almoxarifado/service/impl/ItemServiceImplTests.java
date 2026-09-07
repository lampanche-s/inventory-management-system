package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.request.ItemCreateRequestDTO;
import com.nexusstock.almoxarifado.dto.request.ItemUpdateRequestDTO;
import com.nexusstock.almoxarifado.entity.CategoriaProduto;
import com.nexusstock.almoxarifado.entity.Fornecedor;
import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.StatusEstoque;
import com.nexusstock.almoxarifado.enums.UnidadeMedida;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.repository.CategoriaProdutoRepository;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.repository.MovimentacaoEstoqueRepository;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import com.nexusstock.almoxarifado.service.EstoqueCalculoService;
import com.nexusstock.almoxarifado.service.EstoqueValorHistoricoService;
import com.nexusstock.almoxarifado.service.FornecedorService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ItemServiceImplTests {

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private CategoriaProdutoRepository categoriaProdutoRepository;

    @Mock
    private FornecedorService fornecedorService;

    @Mock
    private EstoqueCalculoService estoqueCalculoService;

    @Mock
    private MovimentacaoEstoqueRepository movimentacaoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private EstoqueValorHistoricoService estoqueValorHistoricoService;

    private ItemServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ItemServiceImpl(
                itemRepository,
                categoriaProdutoRepository,
                fornecedorService,
                estoqueCalculoService,
                movimentacaoRepository,
                usuarioRepository,
                estoqueValorHistoricoService
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void criarRecusaCategoriaInexistenteSemPersistirItem() {
        ItemCreateRequestDTO request = novoCreateRequest("Category that does not exist");
        Fornecedor fornecedor = novoFornecedorAtivo();
        Usuario usuario = new Usuario();
        usuario.setId(7L);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin", "ignored")
        );

        when(itemRepository.existsBySku("ITEM-001")).thenReturn(false);
        when(usuarioRepository.findByUsuario("admin")).thenReturn(Optional.of(usuario));
        when(fornecedorService.buscarEntidadePorId(3L)).thenReturn(fornecedor);
        when(categoriaProdutoRepository.findByNomeIgnoreCase("Category that does not exist"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.criar(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("The selected category does not exist.");

        verify(itemRepository, never()).save(any(Item.class));
        verifyNoInteractions(movimentacaoRepository, estoqueValorHistoricoService);
    }

    @Test
    void atualizarRecusaCategoriaInativaSemPersistirItem() {
        Item item = novoItemCompleto();
        Fornecedor fornecedor = novoFornecedorAtivo();
        CategoriaProduto categoria = novaCategoria("Cleaning", false);
        ItemUpdateRequestDTO request = novoUpdateRequest("Cleaning");

        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(fornecedorService.buscarEntidadePorId(3L)).thenReturn(fornecedor);
        when(categoriaProdutoRepository.findByNomeIgnoreCase("Cleaning"))
                .thenReturn(Optional.of(categoria));

        assertThatThrownBy(() -> service.atualizar(10L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("An inactive category cannot be linked to an item.");

        verify(itemRepository, never()).save(any(Item.class));
    }

    @Test
    void atualizarPersisteNomeCanonicoDaCategoria() {
        Item item = novoItemCompleto();
        Fornecedor fornecedor = novoFornecedorAtivo();
        CategoriaProduto categoria = novaCategoria("Cleaning", true);
        ItemUpdateRequestDTO request = novoUpdateRequest("cLeAnInG");

        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(fornecedorService.buscarEntidadePorId(3L)).thenReturn(fornecedor);
        when(categoriaProdutoRepository.findByNomeIgnoreCase("cLeAnInG"))
                .thenReturn(Optional.of(categoria));
        when(itemRepository.save(item)).thenReturn(item);
        when(estoqueCalculoService.calcularStatus(any(BigDecimal.class), any(BigDecimal.class)))
                .thenReturn(StatusEstoque.SAUDAVEL);
        when(estoqueCalculoService.calcularValorEmEstoque(any(BigDecimal.class), any(BigDecimal.class)))
                .thenReturn(BigDecimal.ZERO);

        service.atualizar(10L, request);

        assertThat(item.getCategoria()).isEqualTo("Cleaning");
        verify(itemRepository).save(item);
    }

    @Test
    void exclusaoDesativaItemSemApagarCadastroOuHistorico() {
        Item item = new Item();
        item.setId(10L);
        item.setAtivo(true);
        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));

        service.excluir(10L);

        assertThat(item.getAtivo()).isFalse();
        verify(itemRepository).save(item);
        verify(itemRepository, never()).delete(item);
        verify(estoqueValorHistoricoService).registrarSnapshot("ITEM_DESATIVADO");
        verifyNoInteractions(movimentacaoRepository);
    }

    @Test
    void exclusaoDeItemJaInativoEIdempotente() {
        Item item = new Item();
        item.setId(10L);
        item.setAtivo(false);
        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));

        service.excluir(10L);

        verify(itemRepository, never()).save(item);
        verify(itemRepository, never()).delete(item);
        verifyNoInteractions(movimentacaoRepository, estoqueValorHistoricoService);
    }

    @Test
    void reativacaoAtualizaHistoricoDeValorSemCriarMovimentacao() {
        Item item = new Item();
        item.setId(10L);
        item.setAtivo(false);
        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));

        service.reativar(10L);

        assertThat(item.getAtivo()).isTrue();
        verify(itemRepository).save(item);
        verify(estoqueValorHistoricoService).registrarSnapshot("ITEM_REATIVADO");
        verifyNoInteractions(movimentacaoRepository);
    }

    private ItemCreateRequestDTO novoCreateRequest(String categoria) {
        ItemCreateRequestDTO request = new ItemCreateRequestDTO();
        request.setNome("Printer paper");
        request.setSku("ITEM-001");
        request.setCategoria(categoria);
        request.setUnidade(UnidadeMedida.CAIXA);
        request.setFornecedorId(3L);
        request.setLocalizacao("Storage room A");
        request.setQuantidadeInicial(BigDecimal.ZERO);
        request.setEstoqueMinimo(BigDecimal.ONE);
        request.setPrecoMedio(new BigDecimal("25.00"));
        return request;
    }

    private ItemUpdateRequestDTO novoUpdateRequest(String categoria) {
        ItemUpdateRequestDTO request = new ItemUpdateRequestDTO();
        request.setNome("Printer paper");
        request.setCategoria(categoria);
        request.setUnidade(UnidadeMedida.CAIXA);
        request.setFornecedorId(3L);
        request.setLocalizacao("Storage room A");
        request.setEstoqueMinimo(BigDecimal.ONE);
        request.setPrecoMedio(new BigDecimal("25.00"));
        return request;
    }

    private Item novoItemCompleto() {
        Item item = new Item();
        item.setId(10L);
        item.setNome("Printer paper");
        item.setSku("ITEM-001");
        item.setCategoria("Maintenance");
        item.setUnidade(UnidadeMedida.CAIXA);
        item.setFornecedor(novoFornecedorAtivo());
        item.setCorredor("-");
        item.setPrateleira("-");
        item.setLocalizacao("Storage room A");
        item.setQuantidadeAtual(BigDecimal.TEN);
        item.setEstoqueMinimo(BigDecimal.ONE);
        item.setPrecoMedio(new BigDecimal("25.00"));
        item.setAtivo(true);
        return item;
    }

    private Fornecedor novoFornecedorAtivo() {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setId(3L);
        fornecedor.setNome("Supplier");
        fornecedor.setAtivo(true);
        return fornecedor;
    }

    private CategoriaProduto novaCategoria(String nome, boolean ativo) {
        CategoriaProduto categoria = new CategoriaProduto();
        categoria.setId(5L);
        categoria.setNome(nome);
        categoria.setAtivo(ativo);
        return categoria;
    }
}
