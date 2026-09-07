package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.service.SolicitacaoMovimentacaoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("dev")
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.MOCK,
        properties = {
                "app.jwt.secret=test-only-secret-with-more-than-32-bytes",
                "app.dev-bootstrap.username=bootstrap-concurrency",
                "app.dev-bootstrap.password=exclusive-local-test-password",
                "app.dev-bootstrap.name=Bootstrap concurrency administrator",
                "app.dev-bootstrap.email=bootstrap-concurrency@example.test",
                "logging.level.org.hibernate.SQL=ERROR",
                "logging.level.org.hibernate.orm.jdbc.bind=ERROR"
        }
)
class SolicitacaoMovimentacaoConcurrencyTests {

    private static final String APROVADOR = "a11-concurrency-approver";

    @Container
    @ServiceConnection
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    @DynamicPropertySource
    static void registrarCredenciaisDescartaveis(DynamicPropertyRegistry registry) {
        registry.add("DB_URL", postgres::getJdbcUrl);
        registry.add("DB_USERNAME", postgres::getUsername);
        registry.add("DB_PASSWORD", postgres::getPassword);
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private SolicitacaoMovimentacaoService solicitacaoService;

    @Autowired
    private DataSource dataSource;

    @Test
    void duasAprovacoesConcorrentesGeramUmaUnicaMovimentacao() throws Exception {
        Long solicitanteId = inserirUsuario("a11-concurrency-requester", "SOLICITANTE");
        inserirUsuario(APROVADOR, "USUARIO");
        Long itemId = inserirItem();
        Long solicitacaoId = inserirSolicitacao(itemId, solicitanteId);

        CountDownLatch prontas = new CountDownLatch(2);
        CountDownLatch iniciar = new CountDownLatch(1);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        try (Connection bloqueioItem = bloquearItem(itemId)) {
            Callable<ResultadoAprovacao> tarefa = () -> executarAprovacao(solicitacaoId, prontas, iniciar);

            Future<ResultadoAprovacao> primeira = executor.submit(tarefa);
            Future<ResultadoAprovacao> segunda = executor.submit(tarefa);

            assertThat(prontas.await(10, TimeUnit.SECONDS)).isTrue();
            iniciar.countDown();

            Thread.sleep(250);
            assertThat(primeira.isDone()).isFalse();
            assertThat(segunda.isDone()).isFalse();

            bloqueioItem.commit();

            List<ResultadoAprovacao> resultados = List.of(
                    primeira.get(20, TimeUnit.SECONDS),
                    segunda.get(20, TimeUnit.SECONDS)
            );

            assertThat(resultados).filteredOn(ResultadoAprovacao::sucesso).hasSize(1);
            assertThat(resultados).filteredOn(resultado -> !resultado.sucesso()).hasSize(1);

            Throwable falha = resultados.stream()
                    .filter(resultado -> !resultado.sucesso())
                    .map(ResultadoAprovacao::falha)
                    .findFirst()
                    .orElseThrow();

            assertThat(falha)
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already been reviewed");
        } finally {
            iniciar.countDown();
            executor.shutdownNow();
            assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        }

        assertThat(jdbcTemplate.queryForObject(
                "SELECT quantidade_atual FROM itens WHERE id = ?",
                BigDecimal.class,
                itemId
        )).isEqualByComparingTo("7.000");

        assertThat(jdbcTemplate.queryForObject(
                "SELECT status FROM solicitacoes_movimentacao WHERE id = ?",
                String.class,
                solicitacaoId
        )).isEqualTo("APROVADA");

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM movimentacoes_estoque WHERE item_id = ?",
                Integer.class,
                itemId
        )).isEqualTo(1);

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM estoque_valor_historico WHERE origem = 'SOLICITACAO_APROVADA'",
                Integer.class
        )).isEqualTo(1);
    }

    private Connection bloquearItem(Long itemId) throws Exception {
        Connection connection = dataSource.getConnection();
        connection.setAutoCommit(false);

        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT id FROM itens WHERE id = ? FOR UPDATE"
        )) {
            statement.setLong(1, itemId);

            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    throw new IllegalStateException("Test item was not found while acquiring the database lock.");
                }
            }
        } catch (Exception exception) {
            connection.close();
            throw exception;
        }

        return connection;
    }

    private ResultadoAprovacao executarAprovacao(
            Long solicitacaoId,
            CountDownLatch prontas,
            CountDownLatch iniciar
    ) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(
                APROVADOR,
                "N/A",
                List.of(new SimpleGrantedAuthority("ROLE_USUARIO"))
        ));
        SecurityContextHolder.setContext(context);

        prontas.countDown();

        try {
            if (!iniciar.await(10, TimeUnit.SECONDS)) {
                return new ResultadoAprovacao(false, new IllegalStateException("Concurrent approval start timed out."));
            }

            solicitacaoService.aprovar(solicitacaoId, null);
            return new ResultadoAprovacao(true, null);
        } catch (Throwable throwable) {
            return new ResultadoAprovacao(false, throwable);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private Long inserirUsuario(String usuario, String perfil) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO usuarios (
                    nome, email, senha_hash, perfil_id, ativo,
                    created_at, updated_at, usuario, excluido
                )
                SELECT
                    ?, ?, 'unused-hash', id, TRUE,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, FALSE
                FROM perfis
                WHERE nome = ?
                RETURNING id
                """,
                Long.class,
                "A11 " + usuario,
                usuario + "@example.invalid",
                usuario,
                perfil
        );
    }

    private Long inserirItem() {
        return jdbcTemplate.queryForObject("""
                INSERT INTO itens (
                    nome, sku, categoria, unidade, fornecedor_id,
                    corredor, prateleira, quantidade_atual, estoque_minimo,
                    preco_medio, ativo, version, created_at, updated_at
                )
                SELECT
                    'A11 concurrent item', 'A11-CONCURRENT-ITEM', 'Cleaning', 'UNIDADE', id,
                    '-', '-', 10.000, 0.000,
                    1.00, TRUE, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM fornecedores
                WHERE nome = 'Not specified'
                RETURNING id
                """, Long.class);
    }

    private Long inserirSolicitacao(Long itemId, Long solicitanteId) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO solicitacoes_movimentacao (
                    item_id, solicitante_id, tipo, quantidade, motivo,
                    observacao, codigo_pedido, ordem_no_pedido, status,
                    data_solicitacao, created_at, updated_at
                ) VALUES (
                    ?, ?, 'SAIDA', 3.000, 'USO_INTERNO',
                    'A11 concurrent approval', 'A11-CONCURRENT', 1, 'PENDENTE',
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
                RETURNING id
                """, Long.class, itemId, solicitanteId);
    }

    private record ResultadoAprovacao(boolean sucesso, Throwable falha) {
    }
}
