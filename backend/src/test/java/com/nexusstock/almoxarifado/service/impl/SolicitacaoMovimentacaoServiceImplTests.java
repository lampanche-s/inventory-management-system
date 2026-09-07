package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.entity.MovimentacaoEstoque;
import com.nexusstock.almoxarifado.entity.SolicitacaoMovimentacao;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.MotivoMovimentacao;
import com.nexusstock.almoxarifado.enums.StatusSolicitacaoMovimentacao;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.exception.EstoqueInsuficienteException;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.repository.MovimentacaoEstoqueRepository;
import com.nexusstock.almoxarifado.repository.SolicitacaoMovimentacaoRepository;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import com.nexusstock.almoxarifado.service.EstoqueValorHistoricoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SolicitacaoMovimentacaoServiceImplTests {

    @Mock
    private SolicitacaoMovimentacaoRepository solicitacaoRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MovimentacaoEstoqueRepository movimentacaoRepository;

    @Mock
    private EstoqueValorHistoricoService estoqueValorHistoricoService;

    private SolicitacaoMovimentacaoServiceImpl service;
    private Item item;
    private SolicitacaoMovimentacao solicitacao;
    private Usuario aprovador;

    @BeforeEach
    void setUp() {
        service = new SolicitacaoMovimentacaoServiceImpl(
                solicitacaoRepository,
                itemRepository,
                usuarioRepository,
                movimentacaoRepository,
                estoqueValorHistoricoService
        );

        item = new Item();
        item.setId(20L);
        item.setNome("Papel A4");
        item.setSku("PAP-A4");
        item.setQuantidadeAtual(new BigDecimal("10.000"));
        item.setAtivo(true);

        Usuario solicitante = new Usuario();
        solicitante.setId(30L);
        solicitante.setNome("Requester");
        solicitante.setUsuario("requester");

        solicitacao = new SolicitacaoMovimentacao();
        solicitacao.setId(10L);
        solicitacao.setItem(item);
        solicitacao.setSolicitante(solicitante);
        solicitacao.setTipo(TipoMovimentacao.SAIDA);
        solicitacao.setQuantidade(new BigDecimal("3.000"));
        solicitacao.setMotivo(MotivoMovimentacao.USO_INTERNO);
        solicitacao.setStatus(StatusSolicitacaoMovimentacao.PENDENTE);
        solicitacao.setDataSolicitacao(LocalDateTime.now());

        aprovador = new Usuario();
        aprovador.setId(40L);
        aprovador.setNome("Gestor");
        aprovador.setUsuario("manager");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("manager", null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void aprovaSolicitacaoBloqueadaERegistraUmaUnicaMovimentacao() {
        when(solicitacaoRepository.buscarPorIdComLock(10L)).thenReturn(Optional.of(solicitacao));
        when(usuarioRepository.findByUsuario("manager")).thenReturn(Optional.of(aprovador));
        when(itemRepository.buscarPorIdComLock(20L)).thenReturn(Optional.of(item));
        when(movimentacaoRepository.save(any(MovimentacaoEstoque.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(solicitacaoRepository.save(any(SolicitacaoMovimentacao.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.aprovar(10L, null);

        ArgumentCaptor<MovimentacaoEstoque> movimentacaoCaptor = ArgumentCaptor.forClass(MovimentacaoEstoque.class);
        verify(movimentacaoRepository).save(movimentacaoCaptor.capture());

        MovimentacaoEstoque movimentacao = movimentacaoCaptor.getValue();
        assertThat(item.getQuantidadeAtual()).isEqualByComparingTo("7.000");
        assertThat(movimentacao.getSaldoAnterior()).isEqualByComparingTo("10.000");
        assertThat(movimentacao.getSaldoPosterior()).isEqualByComparingTo("7.000");
        assertThat(solicitacao.getStatus()).isEqualTo(StatusSolicitacaoMovimentacao.APROVADA);
        assertThat(solicitacao.getMovimentacaoGerada()).isSameAs(movimentacao);

        verify(solicitacaoRepository).buscarPorIdComLock(10L);
        verify(itemRepository).buscarPorIdComLock(20L);
        verify(itemRepository).save(item);
        verify(solicitacaoRepository).save(solicitacao);
        verify(estoqueValorHistoricoService).registrarSnapshot("SOLICITACAO_APROVADA");
    }

    @Test
    void recusaNovaDecisaoQuandoSolicitacaoBloqueadaJaFoiAnalisada() {
        solicitacao.setStatus(StatusSolicitacaoMovimentacao.REJEITADA);
        when(solicitacaoRepository.buscarPorIdComLock(10L)).thenReturn(Optional.of(solicitacao));

        assertThatThrownBy(() -> service.aprovar(10L, null))
                .isInstanceOf(BusinessException.class)
                .hasMessage("This request has already been reviewed.");

        verify(itemRepository, never()).buscarPorIdComLock(any());
        verify(movimentacaoRepository, never()).save(any());
        verify(solicitacaoRepository, never()).save(any());
    }

    @Test
    void recusaAprovacaoQuandoItemFoiDesativadoAposSolicitacao() {
        item.setAtivo(false);
        when(solicitacaoRepository.buscarPorIdComLock(10L)).thenReturn(Optional.of(solicitacao));
        when(usuarioRepository.findByUsuario("manager")).thenReturn(Optional.of(aprovador));
        when(itemRepository.buscarPorIdComLock(20L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> service.aprovar(10L, null))
                .isInstanceOf(BusinessException.class)
                .hasMessage("An inactive item cannot have requests approved.");

        assertThat(item.getQuantidadeAtual()).isEqualByComparingTo("10.000");
        assertThat(solicitacao.getStatus()).isEqualTo(StatusSolicitacaoMovimentacao.PENDENTE);
        verify(itemRepository, never()).save(any());
        verify(movimentacaoRepository, never()).save(any());
        verify(solicitacaoRepository, never()).save(any());
        verify(estoqueValorHistoricoService, never()).registrarSnapshot(any());
    }

    @Test
    void mantemEstoqueIntactoQuandoSaldoEInsuficiente() {
        item.setQuantidadeAtual(new BigDecimal("2.000"));
        when(solicitacaoRepository.buscarPorIdComLock(10L)).thenReturn(Optional.of(solicitacao));
        when(usuarioRepository.findByUsuario("manager")).thenReturn(Optional.of(aprovador));
        when(itemRepository.buscarPorIdComLock(20L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> service.aprovar(10L, null))
                .isInstanceOf(EstoqueInsuficienteException.class);

        assertThat(item.getQuantidadeAtual()).isEqualByComparingTo("2.000");
        verify(itemRepository, never()).save(any());
        verify(movimentacaoRepository, never()).save(any());
        verify(solicitacaoRepository, never()).save(any());
        verify(estoqueValorHistoricoService, never()).registrarSnapshot(any());
    }

    @Test
    void respeitaLimiteSolicitadoAoListarSolicitacoesPendentes() {
        when(solicitacaoRepository.findByStatusOrderByDataSolicitacaoDesc(
                eq(StatusSolicitacaoMovimentacao.PENDENTE),
                any(Pageable.class)
        )).thenAnswer(invocation -> {
            Pageable pageable = invocation.getArgument(1);
            return Collections.nCopies(pageable.getPageSize(), solicitacao);
        });

        assertThat(service.listarPendentes(null)).hasSize(10);
        assertThat(service.listarPendentes(0)).hasSize(1);
        assertThat(service.listarPendentes(1)).hasSize(1);
        assertThat(service.listarPendentes(10)).hasSize(10);
        assertThat(service.listarPendentes(11)).hasSize(11);
        assertThat(service.listarPendentes(50)).hasSize(50);
        assertThat(service.listarPendentes(100)).hasSize(50);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(solicitacaoRepository, times(7)).findByStatusOrderByDataSolicitacaoDesc(
                eq(StatusSolicitacaoMovimentacao.PENDENTE),
                pageableCaptor.capture()
        );
        assertThat(pageableCaptor.getAllValues())
                .extracting(Pageable::getPageSize)
                .containsExactly(10, 1, 1, 10, 11, 50, 50);
    }

}
