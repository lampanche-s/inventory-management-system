package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.request.LoginRequestDTO;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import com.nexusstock.almoxarifado.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTests {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    void returnsSamePublicErrorForUnknownAndInactiveUsers() {
        LoginRequestDTO unknownRequest = loginRequest("unknown-user");
        when(usuarioRepository.findByUsuarioIgnoreCase("unknown-user")).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmail("unknown-user")).thenReturn(Optional.empty());
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("internal unknown-user detail"));

        assertThatThrownBy(() -> authService.login(unknownRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid username or password.");

        Usuario inactiveUser = new Usuario();
        inactiveUser.setUsuario("inactive-user");
        inactiveUser.setAtivo(false);

        LoginRequestDTO inactiveRequest = loginRequest("inactive-user");
        when(usuarioRepository.findByUsuarioIgnoreCase("inactive-user")).thenReturn(Optional.of(inactiveUser));
        reset(authenticationManager);
        when(authenticationManager.authenticate(any()))
                .thenThrow(new LockedException("internal inactive-user detail"));

        assertThatThrownBy(() -> authService.login(inactiveRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid username or password.");
    }

    private LoginRequestDTO loginRequest(String username) {
        LoginRequestDTO request = new LoginRequestDTO();
        request.setUsuario(username);
        request.setSenha("wrong-password");
        return request;
    }
}
