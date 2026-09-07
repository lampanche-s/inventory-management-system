package com.nexusstock.almoxarifado.dto.response;

import com.nexusstock.almoxarifado.enums.RoleName;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class UsuarioResponseDTO {

    private Long id;
    private String nome;
    private String usuario;
    private String email;
    private RoleName perfil;
    private String perfilLabel;
    private String frontendRole;
    private String frontendRoleLabel;
    private Boolean ativo;
    private List<String> permissoes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastSeenAt;
    private Boolean online;
    private String statusOnlineLabel;
    private String ultimaVezOnlineLabel;
}