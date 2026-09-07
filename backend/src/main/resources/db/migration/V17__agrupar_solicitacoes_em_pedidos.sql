ALTER TABLE solicitacoes_movimentacao
ADD COLUMN IF NOT EXISTS codigo_pedido VARCHAR(40);

ALTER TABLE solicitacoes_movimentacao
ADD COLUMN IF NOT EXISTS ordem_no_pedido INTEGER;

CREATE INDEX IF NOT EXISTS idx_solicitacoes_movimentacao_codigo_pedido
ON solicitacoes_movimentacao(codigo_pedido);
