package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class DashboardGraficoPontoResponseDTO {

    private LocalDate data;
    private BigDecimal entradas;
    private BigDecimal saidas;
    private BigDecimal valorTotalEstoque;
}