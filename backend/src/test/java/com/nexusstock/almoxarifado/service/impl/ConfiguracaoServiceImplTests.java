package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConfiguracaoServiceImplTests {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private ConfiguracaoServiceImpl configuracaoService;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        configuracaoService = new ConfiguracaoServiceImpl(
                jdbcTemplate,
                usuarioRepository,
                passwordEncoder
        );

        usuario = new Usuario();
        usuario.setId(42L);
        usuario.setUsuario("superadmin");
        usuario.setSenhaHash("stored-hash");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("superadmin", null, List.of())
        );
        when(usuarioRepository.findByUsuarioIgnoreCase("superadmin")).thenReturn(Optional.of(usuario));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsResetWhenCurrentPasswordDoesNotMatch() {
        when(passwordEncoder.matches("wrong-password", "stored-hash")).thenReturn(false);

        assertThatThrownBy(() -> configuracaoService.resetarDadosOperacionais("wrong-password"))
                .isInstanceOf(BadCredentialsException.class);

        verifyNoInteractions(jdbcTemplate);
    }

    @Test
    void resetsDataAndRegistersAuditWhenPasswordMatches() {
        when(passwordEncoder.matches("correct-password", "stored-hash")).thenReturn(true);

        configuracaoService.resetarDadosOperacionais("correct-password");

        verify(jdbcTemplate).execute(contains("TRUNCATE TABLE"));
        verify(jdbcTemplate).update(
                contains("INSERT INTO auditoria_administrativa"),
                eq("RESET_OPERACIONAL"),
                eq(42L),
                eq("superadmin"),
                eq("Operational data removed; users and roles preserved.")
        );
        verify(jdbcTemplate, never()).execute(contains("usuarios"));
    }

    @Test
    void rejectsDatabaseBackupBeforeGenerationWhenCurrentPasswordDoesNotMatch() {
        ConfiguracaoServiceImpl service = spy(configuracaoService);
        when(passwordEncoder.matches("wrong-password", "stored-hash")).thenReturn(false);

        assertThatThrownBy(() -> service.exportarBackupBancoPostgres("wrong-password"))
                .isInstanceOf(BadCredentialsException.class);

        verify(service, never()).gerarBackupBancoPostgres();
        verifyNoInteractions(jdbcTemplate);
    }

    @Test
    void rejectsDatabaseBackupBeforeGenerationWhenCurrentPasswordIsMissing() {
        ConfiguracaoServiceImpl service = spy(configuracaoService);

        assertThatThrownBy(() -> service.exportarBackupBancoPostgres(null))
                .isInstanceOf(BadCredentialsException.class);

        verifyNoInteractions(passwordEncoder);
        verify(service, never()).gerarBackupBancoPostgres();
        verifyNoInteractions(jdbcTemplate);
    }

    @Test
    void doesNotRegisterSuccessfulBackupAuditWhenGenerationFails() {
        ConfiguracaoServiceImpl service = spy(configuracaoService);
        when(passwordEncoder.matches("correct-password", "stored-hash")).thenReturn(true);
        org.mockito.Mockito.doThrow(new BusinessException("The PostgreSQL backup could not be generated."))
                .when(service)
                .gerarBackupBancoPostgres();

        assertThatThrownBy(() -> service.exportarBackupBancoPostgres("correct-password"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("The PostgreSQL backup could not be generated.");

        verifyNoInteractions(jdbcTemplate);
    }

    @Test
    void exportsDatabaseBackupWithExactPasswordAndRegistersAudit() {
        ConfiguracaoServiceImpl service = spy(configuracaoService);
        byte[] backup = new byte[]{1, 2, 3, 4};
        when(passwordEncoder.matches(" current password ", "stored-hash")).thenReturn(true);
        doReturn(backup).when(service).gerarBackupBancoPostgres();

        byte[] result = service.exportarBackupBancoPostgres(" current password ");

        assertThat(result).isEqualTo(backup);
        verify(passwordEncoder).matches(" current password ", "stored-hash");
        verify(service).gerarBackupBancoPostgres();
        verify(jdbcTemplate).update(
                contains("INSERT INTO auditoria_administrativa"),
                eq("BACKUP_BANCO_POSTGRES"),
                eq(42L),
                eq("superadmin"),
                eq("PostgreSQL database backup exported; sizeBytes=4")
        );
    }
}
