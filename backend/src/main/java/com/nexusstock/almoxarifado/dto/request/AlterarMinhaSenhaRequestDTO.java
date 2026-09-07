package com.nexusstock.almoxarifado.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AlterarMinhaSenhaRequestDTO {

    @NotBlank(message = "The current password is required.")
    private String senhaAtual;

    @NotBlank(message = "The new password is required.")
    @Size(min = 6, message = "The new password must contain at least 6 characters.")
    private String novaSenha;
}
