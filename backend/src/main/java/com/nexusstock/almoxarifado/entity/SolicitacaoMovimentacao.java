package com.nexusstock.almoxarifado.entity;

import com.nexusstock.almoxarifado.enums.MotivoMovimentacao;
import com.nexusstock.almoxarifado.enums.StatusSolicitacaoMovimentacao;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "solicitacoes_movimentacao")
public class SolicitacaoMovimentacao extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitante_id", nullable = false)
    private Usuario solicitante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aprovador_id")
    private Usuario aprovador;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimentacao_id")
    private MovimentacaoEstoque movimentacaoGerada;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30)
    private TipoMovimentacao tipo;

    @Column(name = "quantidade", nullable = false, precision = 15, scale = 3)
    private BigDecimal quantidade;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo", nullable = false, length = 50)
    private MotivoMovimentacao motivo;

    @Column(name = "observacao", length = 500)
    private String observacao;

    @Column(name = "codigo_pedido", length = 40)
    private String codigoPedido;

    @Column(name = "ordem_no_pedido")
    private Integer ordemNoPedido;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private StatusSolicitacaoMovimentacao status = StatusSolicitacaoMovimentacao.PENDENTE;

    @Column(name = "justificativa_decisao", length = 500)
    private String justificativaDecisao;

    @Column(name = "data_solicitacao", nullable = false)
    private LocalDateTime dataSolicitacao;

    @Column(name = "data_decisao")
    private LocalDateTime dataDecisao;
}
