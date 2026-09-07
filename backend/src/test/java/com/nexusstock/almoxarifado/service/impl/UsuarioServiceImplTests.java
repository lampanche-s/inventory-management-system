package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.repository.PerfilRepository;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import com.nexusstock.almoxarifado.security.SecurityUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceImplTests {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PerfilRepository perfilRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @AfterEach
    void limparContextoDeSeguranca() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void recusaNovaSenhaAcimaDoLimiteDoBcryptAntesDeUsarOEncoder() {
        Usuario usuario = new Usuario();
        usuario.setSenhaHash("hash-atual");

        SecurityUser principal = new SecurityUser(usuario);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, java.util.List.of())
        );

        UsuarioServiceImpl service = new UsuarioServiceImpl(
                usuarioRepository,
                perfilRepository,
                passwordEncoder
        );

        assertThatThrownBy(() -> service.alterarMinhaSenha("senha atual", "a".repeat(73)))
                .isInstanceOf(BusinessException.class)
                .hasMessage("The password must not exceed 72 bytes in UTF-8.");

        verifyNoInteractions(passwordEncoder);
        verify(usuarioRepository, never()).save(usuario);
    }
}
