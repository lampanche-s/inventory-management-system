package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class DashboardGraficoResponseDTO {

    private String periodo;
    private LocalDate dataInicio;
    private LocalDate dataFim;
    private List<DashboardGraficoPontoResponseDTO> pontos;
}