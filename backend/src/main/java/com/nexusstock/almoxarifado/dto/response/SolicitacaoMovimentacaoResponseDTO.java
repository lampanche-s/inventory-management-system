package com.nexusstock.almoxarifado.dto.response;

import com.nexusstock.almoxarifado.enums.MotivoMovimentacao;
import com.nexusstock.almoxarifado.enums.StatusSolicitacaoMovimentacao;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class SolicitacaoMovimentacaoResponseDTO {

    private Long id;

    private Long itemId;
    private String itemNome;
    private String itemSku;

    private Long solicitanteId;
    private String solicitanteNome;
    private String solicitanteUsuario;

    private Long aprovadorId;
    private String aprovadorNome;
    private String aprovadorUsuario;

    private Long movimentacaoId;

    private TipoMovimentacao tipo;
    private String tipoLabel;

    private BigDecimal quantidade;

    private MotivoMovimentacao motivo;
    private String motivoLabel;

    private String observacao;

    private String codigoPedido;
    private Integer ordemNoPedido;

    private StatusSolicitacaoMovimentacao status;
    private String statusLabel;

    private String justificativaDecisao;

    private LocalDateTime dataSolicitacao;
    private LocalDateTime dataDecisao;
}
