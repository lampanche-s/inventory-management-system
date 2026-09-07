package com.nexusstock.almoxarifado.dto.request;

import com.nexusstock.almoxarifado.enums.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UsuarioUpdateRequestDTO {

    @NotBlank(message = "The name is required.")
    @Size(max = 150, message = "The name must not exceed 150 characters.")
    private String nome;

    @NotBlank(message = "The username is required.")
    @Size(min = 3, max = 80, message = "The username must be between 3 and 80 characters.")
    private String usuario;

    @Email(message = "Enter a valid email address.")
    @Size(max = 150, message = "The email address must not exceed 150 characters.")
    private String email;

    @Size(min = 6, message = "The password must contain at least 6 characters.")
    private String senha;

    @NotNull(message = "The role is required.")
    private RoleName perfil;

    @NotNull(message = "The status is required.")
    private Boolean ativo;
}
