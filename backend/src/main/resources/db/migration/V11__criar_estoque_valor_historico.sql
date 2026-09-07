CREATE TABLE IF NOT EXISTS estoque_valor_historico (
    id BIGSERIAL PRIMARY KEY,
    valor_total NUMERIC(15, 2) NOT NULL,
    data_hora TIMESTAMP NOT NULL,
    origem VARCHAR(80) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_estoque_valor_historico_data_hora
ON estoque_valor_historico (data_hora);