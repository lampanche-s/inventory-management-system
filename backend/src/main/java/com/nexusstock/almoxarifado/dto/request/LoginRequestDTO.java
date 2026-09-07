package com.nexusstock.almoxarifado.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequestDTO {

    @NotBlank(message = "The username is required.")
    private String usuario;

    @NotBlank(message = "The password is required.")
    private String senha;
}
