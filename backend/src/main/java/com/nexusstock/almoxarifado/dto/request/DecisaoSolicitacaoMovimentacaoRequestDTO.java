package com.nexusstock.almoxarifado.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DecisaoSolicitacaoMovimentacaoRequestDTO {

    @Size(max = 500, message = "The rationale must not exceed 500 characters.")
    private String justificativa;
}
