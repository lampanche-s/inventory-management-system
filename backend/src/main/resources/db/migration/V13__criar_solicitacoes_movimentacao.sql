INSERT INTO perfis (nome, descricao, ativo, created_at, updated_at)
SELECT 'SOLICITANTE', 'Inventory request user', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE nome = 'SOLICITANTE'
);

CREATE TABLE IF NOT EXISTS solicitacoes_movimentacao (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES itens(id),
    solicitante_id BIGINT NOT NULL REFERENCES usuarios(id),
    aprovador_id BIGINT NULL REFERENCES usuarios(id),
    movimentacao_id BIGINT NULL REFERENCES movimentacoes_estoque(id),
    tipo VARCHAR(30) NOT NULL,
    quantidade NUMERIC(15,3) NOT NULL,
    motivo VARCHAR(50) NOT NULL,
    observacao VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    justificativa_decisao VARCHAR(500),
    data_solicitacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_decisao TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_movimentacao_status
    ON solicitacoes_movimentacao(status);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_movimentacao_solicitante
    ON solicitacoes_movimentacao(solicitante_id);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_movimentacao_item
    ON solicitacoes_movimentacao(item_id);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_movimentacao_data
    ON solicitacoes_movimentacao(data_solicitacao DESC);
