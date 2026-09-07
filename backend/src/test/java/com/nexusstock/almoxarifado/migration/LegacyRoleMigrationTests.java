package com.nexusstock.almoxarifado.migration;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

@Testcontainers(disabledWithoutDocker = true)
class LegacyRoleMigrationTests {

    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    @Test
    void v22RecusaUsuarioLegadoSemConverterNemApagarDados() throws SQLException {
        Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration")
                .target(MigrationVersion.fromVersion("21"))
                .load()
                .migrate();

        executarSql("""
                INSERT INTO usuarios (
                    nome, email, senha_hash, perfil_id, ativo,
                    created_at, updated_at, usuario, excluido
                )
                SELECT
                    'Legacy reader', 'legacy-reader@example.invalid', 'unused-hash', id, TRUE,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'legacy-reader', FALSE
                FROM perfis
                WHERE nome = 'LEITOR'
                """);

        Flyway migracaoAtual = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration")
                .load();

        Throwable falha = catchThrowable(migracaoAtual::migrate);

        assertThat(falha).isInstanceOf(FlywayException.class);
        assertThat(mensagensDaCadeia(falha))
                .contains("Legacy user roles detected (GERENTE, OPERADOR or LEITOR)");

        assertThat(consultarInteiro("""
                SELECT COUNT(*)
                FROM usuarios u
                JOIN perfis p ON p.id = u.perfil_id
                WHERE u.usuario = 'legacy-reader'
                  AND p.nome = 'LEITOR'
                """)).isEqualTo(1);

        assertThat(consultarInteiro("""
                SELECT COUNT(*)
                FROM perfis
                WHERE nome IN ('GERENTE', 'OPERADOR', 'LEITOR')
                """)).isEqualTo(3);

        assertThat(consultarInteiro("""
                SELECT COUNT(*)
                FROM flyway_schema_history
                WHERE version = '22'
                """)).isZero();
    }

    private void executarSql(String sql) throws SQLException {
        try (Connection connection = abrirConexao(); Statement statement = connection.createStatement()) {
            statement.executeUpdate(sql);
        }
    }

    private int consultarInteiro(String sql) throws SQLException {
        try (Connection connection = abrirConexao();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            resultSet.next();
            return resultSet.getInt(1);
        }
    }

    private Connection abrirConexao() throws SQLException {
        return DriverManager.getConnection(
                postgres.getJdbcUrl(),
                postgres.getUsername(),
                postgres.getPassword()
        );
    }

    private String mensagensDaCadeia(Throwable throwable) {
        StringBuilder mensagens = new StringBuilder();
        Throwable atual = throwable;

        while (atual != null) {
            if (atual.getMessage() != null) {
                mensagens.append(atual.getMessage()).append('\n');
            }
            atual = atual.getCause();
        }

        return mensagens.toString();
    }
}
