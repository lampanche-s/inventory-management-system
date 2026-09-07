package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class RelatorioResumoResponseDTO {

    private BigDecimal valorTotalEstoque;
    private Long totalItens;
    private Long itensCriticos;
    private BigDecimal totalEntradas;
    private BigDecimal totalSaidas;
    private Long quantidadeMovimentacoes;
}