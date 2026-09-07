CREATE TABLE fornecedores (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(20) UNIQUE,
    contato VARCHAR(120),
    telefone VARCHAR(30),
    email VARCHAR(150),
    cidade VARCHAR(100),
    score NUMERIC(5, 2),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX idx_fornecedores_ativo ON fornecedores(ativo);

INSERT INTO fornecedores (
    nome,
    cnpj,
    contato,
    telefone,
    email,
    cidade,
    score,
    ativo,
    created_at,
    updated_at
)
VALUES
    ('Not specified', NULL, NULL, NULL, NULL, NULL, 0.00, TRUE, NOW(), NOW()),
    ('Northstar Office Supplies (Demo)', NULL, 'Demo Contact', '+1 202-555-0101', 'sales@northstar.example', 'Example City', 92.00, TRUE, NOW(), NOW()),
    ('Bluebird Safety Equipment (Demo)', NULL, 'Demo Contact', '+1 202-555-0102', 'sales@bluebird.example', 'Example City', 88.00, TRUE, NOW(), NOW()),
    ('Evergreen Facility Services (Demo)', NULL, 'Demo Contact', '+1 202-555-0103', 'hello@evergreen.example', 'Example City', 84.00, TRUE, NOW(), NOW()),
    ('Atlas Maintenance Services (Demo)', NULL, 'Demo Contact', '+1 202-555-0104', 'service@atlas.example', 'Example City', 90.00, TRUE, NOW(), NOW()),
    ('Paper Kite Packaging (Demo)', NULL, 'Demo Contact', '+1 202-555-0105', 'orders@paperkite.example', 'Example City', 80.00, TRUE, NOW(), NOW());
