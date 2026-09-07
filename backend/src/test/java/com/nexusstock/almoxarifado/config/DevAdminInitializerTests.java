package com.nexusstock.almoxarifado.config;

import com.nexusstock.almoxarifado.entity.Perfil;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.RoleName;
import com.nexusstock.almoxarifado.repository.PerfilRepository;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DevAdminInitializerTests {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PerfilRepository perfilRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void doesNothingWhenBootstrapCredentialsAreAbsent() {
        DevAdminInitializer initializer = initializer("", "", "", "");

        initializer.run(null);

        verifyNoInteractions(usuarioRepository, perfilRepository, passwordEncoder);
    }

    @Test
    void rejectsPartialOrWeakCredentials() {
        assertThatThrownBy(() -> initializer("admin.local", "", "", "").run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("must be provided together");

        assertThatThrownBy(() -> initializer("admin.local", "weak-pass", "", "").run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 12 characters");
    }

    @Test
    void rejectsPasswordThatExceedsBcryptByteLimit() {
        String password = "a".repeat(73);

        assertThatThrownBy(() -> initializer("admin.local", password, "", "").run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("72 bytes");

        verifyNoInteractions(usuarioRepository, perfilRepository, passwordEncoder);
    }

    @Test
    void createsSuperAdministratorOnlyFromExplicitDevConfiguration() {
        Perfil perfil = new Perfil(RoleName.SUPER_ADMINISTRADOR, "Super administrator");
        when(usuarioRepository.findByUsuarioIgnoreCase("admin.local")).thenReturn(Optional.empty());
        when(usuarioRepository.existsByEmail("admin@example.test")).thenReturn(false);
        when(perfilRepository.findByNome(RoleName.SUPER_ADMINISTRADOR)).thenReturn(Optional.of(perfil));
        when(passwordEncoder.encode("secure-local-password")).thenReturn("secure-hash");

        initializer(" Admin.Local ", "secure-local-password", " Test administrator ", " ADMIN@EXAMPLE.TEST ")
                .run(null);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());

        Usuario criado = captor.getValue();
        assertThat(criado.getUsuario()).isEqualTo("admin.local");
        assertThat(criado.getNome()).isEqualTo("Test administrator");
        assertThat(criado.getEmail()).isEqualTo("admin@example.test");
        assertThat(criado.getSenhaHash()).isEqualTo("secure-hash");
        assertThat(criado.getPerfil()).isSameAs(perfil);
        assertThat(criado.getAtivo()).isTrue();
        assertThat(criado.getExcluido()).isFalse();
    }

    private DevAdminInitializer initializer(String username, String password, String name, String email) {
        return new DevAdminInitializer(
                usuarioRepository,
                perfilRepository,
                passwordEncoder,
                username,
                password,
                name,
                email
        );
    }
}
