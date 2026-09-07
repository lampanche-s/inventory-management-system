package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.response.ConfiguracaoResumoResponseDTO;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import com.nexusstock.almoxarifado.service.ConfiguracaoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConfiguracaoServiceImpl implements ConfiguracaoService {

    private final JdbcTemplate jdbcTemplate;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    @Override
    @Transactional(readOnly = true)
    public ConfiguracaoResumoResponseDTO obterResumo() {
        long itens = contar("itens");
        long movimentacoes = contar("movimentacoes_estoque");
        long fornecedores = contar("fornecedores");
        long usuarios = contar("usuarios");
        long solicitacoes = contar("solicitacoes_movimentacao");
        long categorias = contar("categorias_produto");

        long totalOperacional = itens + movimentacoes + fornecedores + solicitacoes + categorias;

        return new ConfiguracaoResumoResponseDTO(
                itens,
                movimentacoes,
                fornecedores,
                usuarios,
                solicitacoes,
                categorias,
                totalOperacional
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> exportarBackupOperacional() {
        Map<String, Object> backup = new LinkedHashMap<>();

        backup.put("exportadoEm", LocalDateTime.now());
        backup.put("tipo", "stockroom-operational-backup");
        backup.put("observacao", "Operational backup without password hashes.");

        backup.put("categorias", jdbcTemplate.queryForList("SELECT * FROM categorias_produto ORDER BY id"));
        backup.put("fornecedores", jdbcTemplate.queryForList("SELECT * FROM fornecedores ORDER BY id"));
        backup.put("itens", jdbcTemplate.queryForList("SELECT * FROM itens ORDER BY id"));
        backup.put("movimentacoes", jdbcTemplate.queryForList("SELECT * FROM movimentacoes_estoque ORDER BY id"));
        backup.put("solicitacoes", jdbcTemplate.queryForList("SELECT * FROM solicitacoes_movimentacao ORDER BY id"));
        backup.put("estoqueValorHistorico", jdbcTemplate.queryForList("SELECT * FROM estoque_valor_historico ORDER BY id"));

        backup.put(
                "usuarios",
                jdbcTemplate.queryForList(
                        """
                        SELECT id, nome, usuario, email, perfil_id, ativo, created_at, updated_at, last_seen_at
                        FROM usuarios
                        ORDER BY id
                        """
                )
        );

        backup.put("perfis", jdbcTemplate.queryForList("SELECT * FROM perfis ORDER BY id"));

        return backup;
    }

    @Override
    public byte[] exportarBackupBancoPostgres(String senhaAtual) {
        Usuario usuario = obterUsuarioReautenticado(senhaAtual, "EXPORT_DATABASE_BACKUP");
        byte[] backup = gerarBackupBancoPostgres();

        registrarAuditoriaAdministrativa(
                "BACKUP_BANCO_POSTGRES",
                usuario,
                "PostgreSQL database backup exported; sizeBytes=" + backup.length
        );

        log.warn(
                "Administrative event: action=EXPORT_DATABASE_BACKUP userId={} username={} sizeBytes={}",
                usuario.getId(),
                usuario.getUsuario(),
                backup.length
        );

        return backup;
    }

    byte[] gerarBackupBancoPostgres() {
        DadosConexaoPostgres dadosConexao = extrairDadosConexaoPostgres();
        Path arquivoTemporario = null;

        try {
            arquivoTemporario = Files.createTempFile("stockroom-database-backup-", ".backup");

            ProcessBuilder processBuilder = new ProcessBuilder(
                    "pg_dump",
                    "-Fc",
                    "--no-owner",
                    "--no-privileges",
                    "-f",
                    arquivoTemporario.toString(),
                    dadosConexao.database()
            );

            Map<String, String> environment = processBuilder.environment();
            environment.put("PGHOST", dadosConexao.host());
            environment.put("PGPORT", String.valueOf(dadosConexao.port()));
            environment.put("PGUSER", datasourceUsername);

            if (datasourcePassword != null && !datasourcePassword.isBlank()) {
                environment.put("PGPASSWORD", datasourcePassword);
            }

            Process processo = processBuilder.start();

            String erro = new String(processo.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
            int exitCode = processo.waitFor();

            if (exitCode != 0) {
                log.error(
                        "PostgreSQL backup generation failed: exitCode={} pgDumpError={}",
                        exitCode,
                        erro
                );
                throw new BusinessException("The PostgreSQL backup could not be generated.");
            }

            return Files.readAllBytes(arquivoTemporario);
        } catch (IOException exception) {
            log.error("PostgreSQL backup generation failed due to an I/O error.", exception);
            throw new BusinessException("The PostgreSQL backup could not be generated.");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.error("PostgreSQL backup generation was interrupted.", exception);
            throw new BusinessException("The PostgreSQL backup could not be generated.");
        } finally {
            if (arquivoTemporario != null) {
                try {
                    Files.deleteIfExists(arquivoTemporario);
                } catch (IOException exception) {
                    log.warn(
                            "Could not immediately delete temporary PostgreSQL backup file: {}",
                            arquivoTemporario,
                            exception
                    );
                }
            }
        }
    }

    @Override
    @Transactional
    public void resetarDadosOperacionais(String senhaAtual) {
        Usuario usuario = obterUsuarioReautenticado(senhaAtual, "RESET_OPERATIONAL");

        jdbcTemplate.execute(
                """
                TRUNCATE TABLE
                    solicitacoes_movimentacao,
                    movimentacoes_estoque,
                    estoque_valor_historico,
                    itens,
                    fornecedores,
                    categorias_produto
                RESTART IDENTITY CASCADE
                """
        );

        registrarAuditoriaAdministrativa(
                "RESET_OPERACIONAL",
                usuario,
                "Operational data removed; users and roles preserved."
        );

        log.warn(
                "Administrative event: action=RESET_OPERATIONAL userId={} username={}",
                usuario.getId(),
                usuario.getUsuario()
        );
    }

    private Usuario obterUsuarioReautenticado(String senhaAtual, String acao) {
        Usuario usuario = obterUsuarioAutenticado();

        if (senhaAtual == null || !passwordEncoder.matches(senhaAtual, usuario.getSenhaHash())) {
            log.warn(
                    "Administrative event denied: action={} userId={} username={} reason=REAUTHENTICATION_FAILED",
                    acao,
                    usuario.getId(),
                    usuario.getUsuario()
            );
            throw new BadCredentialsException("Your identity could not be confirmed.");
        }

        return usuario;
    }

    private void registrarAuditoriaAdministrativa(String acao, Usuario usuario, String detalhes) {
        jdbcTemplate.update(
                """
                INSERT INTO auditoria_administrativa (
                    acao,
                    usuario_id,
                    usuario_login,
                    detalhes,
                    data_hora
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                """,
                acao,
                usuario.getId(),
                usuario.getUsuario(),
                detalhes
        );
    }

    private Usuario obterUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadCredentialsException("Your identity could not be confirmed.");
        }

        return usuarioRepository.findByUsuarioIgnoreCase(authentication.getName())
                .orElseThrow(() -> new BadCredentialsException("Your identity could not be confirmed."));
    }

    private DadosConexaoPostgres extrairDadosConexaoPostgres() {
        if (datasourceUrl == null || !datasourceUrl.startsWith("jdbc:postgresql://")) {
            throw new BusinessException("Exporting a .backup file requires a PostgreSQL JDBC connection.");
        }

        URI uri = URI.create(datasourceUrl.substring("jdbc:".length()));

        String host = uri.getHost() == null || uri.getHost().isBlank()
                ? "localhost"
                : uri.getHost();

        int port = uri.getPort() <= 0 ? 5432 : uri.getPort();

        String path = uri.getPath();

        if (path == null || path.length() <= 1) {
            throw new BusinessException("The PostgreSQL database name could not be determined.");
        }

        String database = path.substring(1);

        return new DadosConexaoPostgres(host, port, database);
    }

    private long contar(String tabela) {
        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tabela, Long.class);

        return total == null ? 0L : total;
    }

    private record DadosConexaoPostgres(String host, int port, String database) {
    }
}
