package com.nexusstock.almoxarifado.controller.api.v1;

import com.nexusstock.almoxarifado.dto.response.EnumOptionResponseDTO;
import com.nexusstock.almoxarifado.enums.UnidadeMedida;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/unidades")
public class UnidadeController {

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<List<EnumOptionResponseDTO>> listar() {
        List<EnumOptionResponseDTO> unidades = Arrays.stream(UnidadeMedida.values())
                .map(unidade -> EnumOptionResponseDTO.builder()
                        .value(unidade.name())
                        .label(unidade.getLabel())
                        .build())
                .toList();

        return ResponseEntity.ok(unidades);
    }
}