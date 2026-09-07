package com.nexusstock.almoxarifado.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetOperacionalRequestDTO {

    @NotBlank(message = "The confirmation phrase is required.")
    @Size(max = 40, message = "The confirmation phrase is invalid.")
    private String confirmacao;

    @NotBlank(message = "The current password is required.")
    @Size(max = 200, message = "The current password is invalid.")
    private String senhaAtual;
}
