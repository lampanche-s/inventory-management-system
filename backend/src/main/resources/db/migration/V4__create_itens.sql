CREATE TABLE itens (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    sku VARCHAR(80) NOT NULL UNIQUE,
    categoria VARCHAR(50) NOT NULL,
    unidade VARCHAR(50) NOT NULL,
    fornecedor_id BIGINT NOT NULL,
    corredor VARCHAR(50) NOT NULL,
    prateleira VARCHAR(50) NOT NULL,
    quantidade_atual NUMERIC(15, 3) NOT NULL DEFAULT 0,
    estoque_minimo NUMERIC(15, 3) NOT NULL DEFAULT 0,
    preco_medio NUMERIC(15, 2) NOT NULL DEFAULT 0,
    imagem_url VARCHAR(500),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_itens_fornecedor
        FOREIGN KEY (fornecedor_id)
        REFERENCES fornecedores (id)
);

CREATE INDEX idx_itens_nome ON itens(nome);
CREATE INDEX idx_itens_sku ON itens(sku);
CREATE INDEX idx_itens_categoria ON itens(categoria);
CREATE INDEX idx_itens_fornecedor_id ON itens(fornecedor_id);
CREATE INDEX idx_itens_ativo ON itens(ativo);
CREATE INDEX idx_itens_quantidade_atual ON itens(quantidade_atual);
CREATE INDEX idx_itens_estoque_minimo ON itens(estoque_minimo);