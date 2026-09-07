package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FieldErrorResponseDTO {

    private String field;
    private String message;
}