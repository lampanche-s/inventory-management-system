package com.nexusstock.almoxarifado;

import com.nexusstock.almoxarifado.service.ItemService;
import com.nexusstock.almoxarifado.service.FornecedorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("dev")
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.MOCK,
        properties = {
                "app.jwt.secret=test-only-secret-with-more-than-32-bytes",
                "app.dev-bootstrap.username=bootstrap-test",
                "app.dev-bootstrap.password=exclusive-local-test-password",
                "app.dev-bootstrap.name=Bootstrap administrator",
                "app.dev-bootstrap.email=bootstrap@example.test",
                "logging.level.org.hibernate.SQL=ERROR",
                "logging.level.org.hibernate.orm.jdbc.bind=ERROR"
        }
)
class PostgreSqlMigrationTests {

    private static final int TOTAL_REGRAS_NUMERICAS = 11;

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
    private Environment environment;

    @Autowired
    private ItemService itemService;

    @Autowired
    private FornecedorService fornecedorService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void aplicaHistoricoCompletoEAtivaRegrasDeIntegridade() {
        String ultimaVersao = jdbcTemplate.queryForObject("""
                SELECT version
                FROM flyway_schema_history
                WHERE success = TRUE
                ORDER BY installed_rank DESC
                LIMIT 1
                """, String.class);

        Integer regrasValidadas = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM pg_constraint
                WHERE convalidated = TRUE
                  AND conname IN (
                    'ck_itens_quantidade_atual_nao_negativa',
                    'ck_itens_estoque_minimo_nao_negativo',
                    'ck_itens_preco_medio_nao_negativo',
                    'ck_itens_dias_aviso_validade_intervalo',
                    'ck_fornecedores_score_intervalo',
                    'ck_movimentacoes_quantidade_positiva',
                    'ck_movimentacoes_saldo_anterior_nao_negativo',
                    'ck_movimentacoes_saldo_posterior_nao_negativo',
                    'ck_solicitacoes_quantidade_positiva',
                    'ck_solicitacoes_ordem_positiva',
                    'ck_estoque_valor_historico_nao_negativo'
                  )
                """, Integer.class);

        assertThat(ultimaVersao).isEqualTo("23");
        assertThat(regrasValidadas).isEqualTo(TOTAL_REGRAS_NUMERICAS);

        assertThat(jdbcTemplate.queryForList(
                "SELECT nome FROM perfis ORDER BY nome",
                String.class
        )).containsExactly(
                "ADMINISTRADOR",
                "SOLICITANTE",
                "SUPER_ADMINISTRADOR",
                "USUARIO"
        );

        Integer fornecedoresDemo = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM fornecedores
                WHERE nome IN (
                    'Northstar Office Supplies (Demo)',
                    'Bluebird Safety Equipment (Demo)',
                    'Evergreen Facility Services (Demo)',
                    'Atlas Maintenance Services (Demo)',
                    'Paper Kite Packaging (Demo)'
                )
                """, Integer.class);
        Integer fornecedorNeutro = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM fornecedores
                WHERE nome = 'Not specified'
                """, Integer.class);

        assertThat(fornecedoresDemo).isZero();
        assertThat(fornecedorNeutro).isEqualTo(1);

        assertThatThrownBy(() -> jdbcTemplate.update("""
                INSERT INTO fornecedores (nome, score, ativo, created_at, updated_at)
                VALUES ('Invalid supplier', -0.01, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("ck_fornecedores_score_intervalo");
    }

    @Test
    void baselineAutomaticoPermaneceDesabilitado() {
        assertThat(environment.getProperty(
                "spring.flyway.baseline-on-migrate",
                Boolean.class,
                false
        )).isFalse();
    }

    @Test
    void criaPrimeiroSuperAdministradorSomenteNoProfileDev() {
        String senhaHash = jdbcTemplate.queryForObject(
                "SELECT senha_hash FROM usuarios WHERE usuario = 'bootstrap-test'",
                String.class
        );
        String perfil = jdbcTemplate.queryForObject("""
                SELECT p.nome
                FROM usuarios u
                JOIN perfis p ON p.id = u.perfil_id
                WHERE u.usuario = 'bootstrap-test'
                """, String.class);

        assertThat(passwordEncoder.matches("exclusive-local-test-password", senhaHash)).isTrue();
        assertThat(perfil).isEqualTo("SUPER_ADMINISTRADOR");
    }

    @Test
    void listaFornecedoresSemBuscaEComBuscaTextualNoPostgresql() {
        assertThat(fornecedorService.listar(null, null, 0, 10, "nome,asc").getContent())
                .extracting("nome")
                .contains("Not specified");

        assertThat(fornecedorService.listar("Not specified", true, 0, 10, "nome,asc").getContent())
                .extracting("nome")
                .containsExactly("Not specified");
    }

    @Test
    void exclusaoCompativelDesativaItemEPreservaMovimentacao() {
        Long usuarioId = jdbcTemplate.queryForObject("""
                INSERT INTO usuarios (
                    nome, email, senha_hash, perfil_id, ativo,
                    created_at, updated_at, usuario, excluido
                )
                SELECT
                    'Test operator', 'operator-phase2@example.invalid', 'unused-hash', id, TRUE,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'operator-phase2', FALSE
                FROM perfis
                WHERE nome = 'USUARIO'
                RETURNING id
                """, Long.class);

        Long itemId = jdbcTemplate.queryForObject("""
                INSERT INTO itens (
                    nome, sku, categoria, unidade, fornecedor_id,
                    corredor, prateleira, quantidade_atual, estoque_minimo,
                    preco_medio, ativo, version, created_at, updated_at
                )
                SELECT
                    'Test item', 'ITEM-PHASE2', 'Cleaning', 'UNIDADE', id,
                    '-', '-', 1.000, 0.000,
                    1.00, TRUE, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM fornecedores
                WHERE nome = 'Not specified'
                RETURNING id
                """, Long.class);

        jdbcTemplate.update("""
                INSERT INTO movimentacoes_estoque (
                    item_id, usuario_id, tipo, quantidade, motivo,
                    data_hora, saldo_anterior, saldo_posterior, created_at, updated_at
                ) VALUES (?, ?, 'ENTRADA', 1.000, 'REPOSICAO_ESTOQUE',
                    CURRENT_TIMESTAMP, 0.000, 1.000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, itemId, usuarioId);

        itemService.excluir(itemId);

        Boolean ativo = jdbcTemplate.queryForObject(
                "SELECT ativo FROM itens WHERE id = ?",
                Boolean.class,
                itemId
        );
        Integer movimentacoes = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM movimentacoes_estoque WHERE item_id = ?",
                Integer.class,
                itemId
        );
        Integer snapshots = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM estoque_valor_historico WHERE origem = 'ITEM_DESATIVADO'",
                Integer.class
        );

        assertThat(ativo).isFalse();
        assertThat(movimentacoes).isEqualTo(1);
        assertThat(snapshots).isEqualTo(1);
    }
}
