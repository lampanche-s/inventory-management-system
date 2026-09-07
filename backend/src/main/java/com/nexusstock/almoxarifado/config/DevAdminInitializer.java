package com.nexusstock.almoxarifado.config;

import com.nexusstock.almoxarifado.entity.Perfil;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.RoleName;
import com.nexusstock.almoxarifado.repository.PerfilRepository;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import com.nexusstock.almoxarifado.util.PasswordPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Component
@Profile("dev")
public class DevAdminInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevAdminInitializer.class);

    private final UsuarioRepository usuarioRepository;
    private final PerfilRepository perfilRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;
    private final String name;
    private final String email;

    public DevAdminInitializer(
            UsuarioRepository usuarioRepository,
            PerfilRepository perfilRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.dev-bootstrap.username:}") String username,
            @Value("${app.dev-bootstrap.password:}") String password,
            @Value("${app.dev-bootstrap.name:Local Administrator}") String name,
            @Value("${app.dev-bootstrap.email:}") String email
    ) {
        this.usuarioRepository = usuarioRepository;
        this.perfilRepository = perfilRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
        this.name = name;
        this.email = email;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean usernameInformado = username != null && !username.isBlank();
        boolean passwordInformado = password != null && !password.isBlank();

        if (!usernameInformado && !passwordInformado) {
            return;
        }

        if (!usernameInformado || !passwordInformado) {
            throw new IllegalStateException("DEV_ADMIN_USERNAME and DEV_ADMIN_PASSWORD must be provided together.");
        }

        if (password.length() < 12) {
            throw new IllegalStateException("DEV_ADMIN_PASSWORD must contain at least 12 characters.");
        }

        if (PasswordPolicy.exceedsBcryptLimit(password)) {
            throw new IllegalStateException("DEV_ADMIN_PASSWORD must not exceed 72 bytes in UTF-8.");
        }

        String usernameNormalizado = username.trim().toLowerCase(Locale.ROOT);

        if (!usernameNormalizado.matches("^[a-z0-9._-]{3,80}$")) {
            throw new IllegalStateException("DEV_ADMIN_USERNAME has an invalid format.");
        }

        if (usuarioRepository.findByUsuarioIgnoreCase(usernameNormalizado).isPresent()) {
            log.info("Local bootstrap skipped: user '{}' already exists.", usernameNormalizado);
            return;
        }

        String emailNormalizado = normalizarEmail();

        if (emailNormalizado != null && usuarioRepository.existsByEmail(emailNormalizado)) {
            throw new IllegalStateException("DEV_ADMIN_EMAIL already belongs to another user.");
        }

        Perfil perfil = perfilRepository.findByNome(RoleName.SUPER_ADMINISTRADOR)
                .orElseThrow(() -> new IllegalStateException("Role SUPER_ADMINISTRADOR was not found after database migration."));

        Usuario usuario = new Usuario();
        usuario.setNome(name == null || name.isBlank() ? "Local Administrator" : name.trim());
        usuario.setUsuario(usernameNormalizado);
        usuario.setEmail(emailNormalizado);
        usuario.setSenhaHash(passwordEncoder.encode(password));
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        usuario.setExcluido(false);

        usuarioRepository.save(usuario);
        log.warn("Local super administrator '{}' created by the development bootstrap.", usernameNormalizado);
    }

    private String normalizarEmail() {
        if (email == null || email.isBlank()) {
            return null;
        }

        String emailNormalizado = email.trim().toLowerCase(Locale.ROOT);

        if (!emailNormalizado.contains("@")) {
            throw new IllegalStateException("DEV_ADMIN_EMAIL has an invalid format.");
        }

        return emailNormalizado;
    }
}
