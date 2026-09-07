CREATE TABLE IF NOT EXISTS categorias_produto (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_categorias_produto_nome UNIQUE (nome)
);

ALTER TABLE itens
    ALTER COLUMN categoria TYPE VARCHAR(80);

UPDATE itens
SET categoria = CASE categoria
    WHEN 'ESCRITORIO' THEN 'Office supplies'
    WHEN 'LIMPEZA' THEN 'Cleaning'
    WHEN 'EPI' THEN 'Personal protective equipment'
    WHEN 'INFORMATICA' THEN 'IT equipment'
    WHEN 'MANUTENCAO' THEN 'Maintenance'
    WHEN 'COPA' THEN 'Break room'
    WHEN 'EMBALAGEM' THEN 'Packaging'
    ELSE categoria
END;

INSERT INTO categorias_produto (nome, ativo, created_at, updated_at)
VALUES
    ('Office supplies', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Cleaning', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Personal protective equipment', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('IT equipment', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Maintenance', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Break room', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Packaging', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Uncategorized', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO categorias_produto (nome, ativo, created_at, updated_at)
SELECT DISTINCT i.categoria, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM itens i
WHERE i.categoria IS NOT NULL
  AND TRIM(i.categoria) <> ''
  AND NOT EXISTS (
      SELECT 1
      FROM categorias_produto c
      WHERE LOWER(c.nome) = LOWER(i.categoria)
  );
