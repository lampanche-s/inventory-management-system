INSERT INTO perfis (nome, descricao, ativo, created_at, updated_at)
SELECT 'SUPER_ADMINISTRADOR', 'Internal system administration access', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE nome = 'SUPER_ADMINISTRADOR'
);

INSERT INTO perfis (nome, descricao, ativo, created_at, updated_at)
SELECT 'ADMINISTRADOR', 'System administrator', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE nome = 'ADMINISTRADOR'
);

INSERT INTO perfis (nome, descricao, ativo, created_at, updated_at)
SELECT 'USUARIO', 'Inventory operations employee', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE nome = 'USUARIO'
);

INSERT INTO perfis (nome, descricao, ativo, created_at, updated_at)
SELECT 'SOLICITANTE', 'Inventory request user', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE nome = 'SOLICITANTE'
);
