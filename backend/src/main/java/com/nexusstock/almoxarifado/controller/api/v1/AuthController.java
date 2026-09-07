package com.nexusstock.almoxarifado.controller.api.v1;

import com.nexusstock.almoxarifado.dto.request.LoginRequestDTO;
import com.nexusstock.almoxarifado.dto.response.LoginResponseDTO;
import com.nexusstock.almoxarifado.dto.response.UsuarioResponseDTO;
import com.nexusstock.almoxarifado.exception.LoginRateLimitException;
import com.nexusstock.almoxarifado.security.LoginRateLimitService;
import com.nexusstock.almoxarifado.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final LoginRateLimitService loginRateLimitService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = httpRequest.getRemoteAddr();
        String username = request.getUsuario();

        if (loginRateLimitService.isBlocked(ipAddress, username)) {
            throw new LoginRateLimitException();
        }

        try {
            LoginResponseDTO response = authService.login(request);
            loginRateLimitService.registerSuccess(username);
            return ResponseEntity.ok(response);
        } catch (AuthenticationException exception) {
            loginRateLimitService.registerFailure(ipAddress, username);
            throw exception;
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> me() {
        return ResponseEntity.ok(authService.me());
    }
}
