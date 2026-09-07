package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.mapper.UsuarioMapper;
import com.nexusstock.almoxarifado.dto.request.LoginRequestDTO;
import com.nexusstock.almoxarifado.dto.response.LoginResponseDTO;
import com.nexusstock.almoxarifado.dto.response.UsuarioResponseDTO;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import com.nexusstock.almoxarifado.security.JwtService;
import com.nexusstock.almoxarifado.security.SecurityUser;
import com.nexusstock.almoxarifado.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String MENSAGEM_CREDENCIAIS_INVALIDAS = "Invalid username or password.";

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        String usuarioLogin = request.getUsuario() == null ? "" : request.getUsuario().trim();

        Usuario usuarioPreLogin = buscarUsuarioParaLogin(usuarioLogin);

        String usuarioAutenticacao = usuarioPreLogin == null
                ? usuarioLogin
                : usuarioPreLogin.getUsuario();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            usuarioAutenticacao,
                            request.getSenha()
                    )
            );

            SecurityUser securityUser = (SecurityUser) authentication.getPrincipal();
            Usuario usuario = securityUser.getUsuario();

            if (!Boolean.TRUE.equals(usuario.getAtivo())) {
                throw new BadCredentialsException(MENSAGEM_CREDENCIAIS_INVALIDAS);
            }

            usuario.setLastSeenAt(LocalDateTime.now());
            usuarioRepository.save(usuario);

            String token = jwtService.gerarToken(securityUser);

            return LoginResponseDTO.builder()
                    .token(token)
                    .tipoToken("Bearer")
                    .expiresIn(jwtService.getExpirationSeconds())
                    .usuario(UsuarioMapper.toResponse(usuario))
                    .build();

        } catch (DisabledException exception) {
            throw new BadCredentialsException(MENSAGEM_CREDENCIAIS_INVALIDAS);
        } catch (InternalAuthenticationServiceException exception) {
            throw new BadCredentialsException(MENSAGEM_CREDENCIAIS_INVALIDAS);
        } catch (BadCredentialsException exception) {
            throw new BadCredentialsException(MENSAGEM_CREDENCIAIS_INVALIDAS);
        } catch (AuthenticationException exception) {
            throw new BadCredentialsException(MENSAGEM_CREDENCIAIS_INVALIDAS);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponseDTO me() {
        Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication();

        String usuarioLogin = authentication.getName();

        Usuario usuario = usuarioRepository.findByUsuarioIgnoreCase(usuarioLogin)
                .orElseThrow(() -> new BadCredentialsException("Authenticated user not found."));

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new BadCredentialsException("Invalid or expired session.");
        }

        return UsuarioMapper.toResponse(usuario);
    }

    private Usuario buscarUsuarioParaLogin(String login) {
        if (login == null || login.isBlank()) {
            return null;
        }

        String normalizado = login.trim().toLowerCase();

        return usuarioRepository.findByUsuarioIgnoreCase(normalizado)
                .or(() -> usuarioRepository.findByEmail(normalizado))
                .orElse(null);
    }
}
