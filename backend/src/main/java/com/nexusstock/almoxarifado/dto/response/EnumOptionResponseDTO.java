package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EnumOptionResponseDTO {

    private String value;
    private String label;
}