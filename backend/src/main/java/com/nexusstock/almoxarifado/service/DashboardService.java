package com.nexusstock.almoxarifado.service;

import com.nexusstock.almoxarifado.dto.response.DashboardGraficoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.DashboardResponseDTO;

public interface DashboardService {

    DashboardResponseDTO obterDashboard();

    DashboardGraficoResponseDTO obterGrafico(String periodo);
}