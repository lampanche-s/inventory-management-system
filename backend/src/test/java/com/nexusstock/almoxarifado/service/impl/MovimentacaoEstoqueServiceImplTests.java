package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.request.MovimentacaoRequestDTO;
import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.entity.MovimentacaoEstoque;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.MotivoMovimentacao;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import com.nexusstock.almoxarifado.exception.EstoqueInsuficienteException;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.repository.MovimentacaoEstoqueRepository;
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
import java.util.List;
import java.util.stream.IntStream;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MovimentacaoEstoqueServiceImplTests {

    @Mock
    private MovimentacaoEstoqueRepository movimentacaoRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private EstoqueValorHistoricoService estoqueValorHistoricoService;

    private MovimentacaoEstoqueServiceImpl service;
    private Item item;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        service = new MovimentacaoEstoqueServiceImpl(
                movimentacaoRepository,
                itemRepository,
                usuarioRepository,
                estoqueValorHistoricoService
        );

        item = new Item();
        item.setId(20L);
        item.setNome("Papel A4");
        item.setSku("PAP-A4");
        item.setAtivo(true);
        item.setQuantidadeAtual(new BigDecimal("10.000"));

        usuario = new Usuario();
        usuario.setId(40L);
        usuario.setNome("Gestor");
        usuario.setUsuario("manager");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("manager", null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void registraSaidaEAtualizaHistoricoDeValorDoEstoque() {
        when(usuarioRepository.findByUsuario("manager")).thenReturn(Optional.of(usuario));
        when(itemRepository.buscarPorIdComLock(20L)).thenReturn(Optional.of(item));
        when(movimentacaoRepository.save(any(MovimentacaoEstoque.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.registrar(request(TipoMovimentacao.SAIDA, new BigDecimal("3.000")));

        assertThat(item.getQuantidadeAtual()).isEqualByComparingTo("7.000");
        verify(estoqueValorHistoricoService).registrarSnapshot("MOVIMENTACAO_SAIDA");
    }

    @Test
    void naoRegistraHistoricoQuandoSaldoEInsuficiente() {
        when(usuarioRepository.findByUsuario("manager")).thenReturn(Optional.of(usuario));
        when(itemRepository.buscarPorIdComLock(20L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> service.registrar(request(TipoMovimentacao.SAIDA, new BigDecimal("11.000"))))
                .isInstanceOf(EstoqueInsuficienteException.class);

        assertThat(item.getQuantidadeAtual()).isEqualByComparingTo("10.000");
        verify(itemRepository, never()).save(any());
        verify(movimentacaoRepository, never()).save(any());
        verify(estoqueValorHistoricoService, never()).registrarSnapshot(any());
    }

    @Test
    void respeitaLimiteSolicitadoAoListarMovimentacoesRecentes() {
        when(movimentacaoRepository.findAllByOrderByDataHoraDesc(any(Pageable.class)))
                .thenAnswer(invocation -> {
                    Pageable pageable = invocation.getArgument(0);
                    return movimentacoes(pageable.getPageSize());
                });

        assertThat(service.listarRecentes(null)).hasSize(10);
        assertThat(service.listarRecentes(0)).hasSize(1);
        assertThat(service.listarRecentes(1)).hasSize(1);
        assertThat(service.listarRecentes(10)).hasSize(10);
        assertThat(service.listarRecentes(11)).hasSize(11);
        assertThat(service.listarRecentes(50)).hasSize(50);
        assertThat(service.listarRecentes(100)).hasSize(50);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(movimentacaoRepository, times(7)).findAllByOrderByDataHoraDesc(pageableCaptor.capture());
        assertThat(pageableCaptor.getAllValues())
                .extracting(Pageable::getPageSize)
                .containsExactly(10, 1, 1, 10, 11, 50, 50);
    }

    private List<MovimentacaoEstoque> movimentacoes(int quantidade) {
        return IntStream.range(0, quantidade)
                .mapToObj(indice -> {
                    MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
                    movimentacao.setId((long) indice + 1);
                    movimentacao.setItem(item);
                    movimentacao.setUsuario(usuario);
                    movimentacao.setTipo(TipoMovimentacao.ENTRADA);
                    movimentacao.setQuantidade(BigDecimal.ONE);
                    movimentacao.setMotivo(MotivoMovimentacao.USO_INTERNO);
                    movimentacao.setDataHora(LocalDateTime.now().minusMinutes(indice));
                    movimentacao.setSaldoAnterior(BigDecimal.ZERO);
                    movimentacao.setSaldoPosterior(BigDecimal.ONE);
                    return movimentacao;
                })
                .toList();
    }

    private MovimentacaoRequestDTO request(TipoMovimentacao tipo, BigDecimal quantidade) {
        MovimentacaoRequestDTO request = new MovimentacaoRequestDTO();
        request.setItemId(20L);
        request.setTipo(tipo);
        request.setQuantidade(quantidade);
        request.setMotivo(MotivoMovimentacao.USO_INTERNO);
        return request;
    }
}
