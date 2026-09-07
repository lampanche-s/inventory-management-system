package com.nexusstock.almoxarifado.controller.api.v1;

import com.nexusstock.almoxarifado.dto.response.DashboardGraficoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.DashboardResponseDTO;
import com.nexusstock.almoxarifado.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<DashboardResponseDTO> obterDashboard() {
        return ResponseEntity.ok(dashboardService.obterDashboard());
    }

    @GetMapping("/grafico")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<DashboardGraficoResponseDTO> obterGrafico(
            @RequestParam(required = false, defaultValue = "1M") String periodo
    ) {
        return ResponseEntity.ok(dashboardService.obterGrafico(periodo));
    }
}