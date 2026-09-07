package com.nexusstock.almoxarifado.dto.response;

import com.nexusstock.almoxarifado.enums.RoleName;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PerfilResponseDTO {

    private Long id;
    private RoleName nome;
    private String label;
}