CREATE TABLE movimentacoes_estoque (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    quantidade NUMERIC(15, 3) NOT NULL,
    motivo VARCHAR(50) NOT NULL,
    observacao VARCHAR(500),
    data_hora TIMESTAMP NOT NULL,
    saldo_anterior NUMERIC(15, 3) NOT NULL,
    saldo_posterior NUMERIC(15, 3) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_movimentacoes_item
        FOREIGN KEY (item_id)
        REFERENCES itens (id),

    CONSTRAINT fk_movimentacoes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
);

CREATE INDEX idx_movimentacoes_item_id ON movimentacoes_estoque(item_id);
CREATE INDEX idx_movimentacoes_usuario_id ON movimentacoes_estoque(usuario_id);
CREATE INDEX idx_movimentacoes_tipo ON movimentacoes_estoque(tipo);
CREATE INDEX idx_movimentacoes_motivo ON movimentacoes_estoque(motivo);
CREATE INDEX idx_movimentacoes_data_hora ON movimentacoes_estoque(data_hora);