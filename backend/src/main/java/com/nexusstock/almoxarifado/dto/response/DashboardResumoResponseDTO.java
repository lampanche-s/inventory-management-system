package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class DashboardResumoResponseDTO {

    private Long totalItens;
    private BigDecimal valorTotalEstoque;
    private Long itensAbaixoMinimo;
    private Long itensZerados;
    private Long movimentacoesHoje;
    private Long totalEntradasHoje;
    private Long totalSaidasHoje;
}