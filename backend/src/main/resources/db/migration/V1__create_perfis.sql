CREATE TABLE perfis (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(150) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

INSERT INTO perfis (nome, descricao, ativo, created_at, updated_at)
VALUES
    ('ADMINISTRADOR', 'System administrator', TRUE, NOW(), NOW()),
    ('GERENTE', 'Inventory manager', TRUE, NOW(), NOW()),
    ('OPERADOR', 'Inventory operator', TRUE, NOW(), NOW()),
    ('LEITOR', 'Read-only user', TRUE, NOW(), NOW());
