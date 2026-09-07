package com.nexusstock.almoxarifado.dto.response;

import com.nexusstock.almoxarifado.enums.MotivoMovimentacao;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class MovimentacaoResponseDTO {

    private Long id;

    private Long itemId;
    private String itemNome;
    private String itemSku;

    private TipoMovimentacao tipo;
    private String tipoLabel;

    private BigDecimal quantidade;

    private MotivoMovimentacao motivo;
    private String motivoLabel;

    private String observacao;

    private Long usuarioId;
    private String usuarioNome;

    private LocalDateTime dataHora;

    private BigDecimal saldoAnterior;
    private BigDecimal saldoPosterior;
}