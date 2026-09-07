package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponseDTO {

    private String token;
    private String tipoToken;
    private Long expiresIn;
    private UsuarioResponseDTO usuario;
}