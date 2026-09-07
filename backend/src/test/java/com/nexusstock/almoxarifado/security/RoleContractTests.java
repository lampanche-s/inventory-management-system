package com.nexusstock.almoxarifado.security;

import com.nexusstock.almoxarifado.dto.mapper.UsuarioMapper;
import com.nexusstock.almoxarifado.dto.response.UsuarioResponseDTO;
import com.nexusstock.almoxarifado.entity.Perfil;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.RoleName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RoleContractTests {

    @Test
    void rolesSuportadasMantemAuthorityEFrontendRoleAlinhados() {
        Map<RoleName, String> frontendRoles = Map.of(
                RoleName.SUPER_ADMINISTRADOR, "SUPER_ADMIN",
                RoleName.ADMINISTRADOR, "ADMIN",
                RoleName.USUARIO, "FUNCIONARIO",
                RoleName.SOLICITANTE, "SOLICITANTE"
        );

        assertThat(RoleName.values()).containsExactlyInAnyOrderElementsOf(frontendRoles.keySet());

        frontendRoles.forEach((role, frontendRole) -> {
            Usuario usuario = usuarioComPerfil(role);
            SecurityUser securityUser = new SecurityUser(usuario);
            UsuarioResponseDTO response = UsuarioMapper.toResponse(usuario);

            assertThat(securityUser.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .toList())
                    .containsExactly("ROLE_" + role.name());
            assertThat(response.getPerfil()).isEqualTo(role);
            assertThat(response.getFrontendRole()).isEqualTo(frontendRole);
        });
    }

    private Usuario usuarioComPerfil(RoleName role) {
        Perfil perfil = new Perfil(role, "Test role");
        Usuario usuario = new Usuario();
        usuario.setNome("Test user");
        usuario.setUsuario("test-user-" + role.name().toLowerCase());
        usuario.setSenhaHash("unused-hash");
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        usuario.setExcluido(false);
        return usuario;
    }
}
