package com.nexusstock.almoxarifado.security;

import com.nexusstock.almoxarifado.entity.Usuario;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class SecurityUser implements UserDetails {

    private final Usuario usuario;

    public SecurityUser(Usuario usuario) {
        this.usuario = usuario;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String role = "ROLE_" + usuario.getPerfil().getNome().name();
        return List.of(new SimpleGrantedAuthority(role));
    }

    @Override
    public String getPassword() {
        return usuario.getSenhaHash();
    }

    @Override
    public String getUsername() {
        return usuario.getUsuario();
    }

    @Override
    public boolean isAccountNonExpired() {
        return Boolean.TRUE.equals(usuario.getAtivo());
    }

    @Override
    public boolean isAccountNonLocked() {
        return Boolean.TRUE.equals(usuario.getAtivo());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return Boolean.TRUE.equals(usuario.getAtivo());
    }

    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(usuario.getAtivo());
    }
}