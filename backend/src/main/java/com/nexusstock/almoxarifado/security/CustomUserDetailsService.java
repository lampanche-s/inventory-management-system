package com.nexusstock.almoxarifado.security;

import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usuarioLogin) throws UsernameNotFoundException {
        String login = usuarioLogin == null ? "" : usuarioLogin.trim();

        Usuario usuario = usuarioRepository.findByUsuarioIgnoreCase(login)
                .orElseThrow(() -> new UsernameNotFoundException("User not found."));

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new DisabledException("This account is inactive. Contact a system administrator.");
        }

        return new SecurityUser(usuario);
    }
}
