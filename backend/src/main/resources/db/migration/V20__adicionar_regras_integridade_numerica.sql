ALTER TABLE itens
    ADD CONSTRAINT ck_itens_quantidade_atual_nao_negativa
    CHECK (quantidade_atual >= 0) NOT VALID;

ALTER TABLE itens
    ADD CONSTRAINT ck_itens_estoque_minimo_nao_negativo
    CHECK (estoque_minimo >= 0) NOT VALID;

ALTER TABLE itens
    ADD CONSTRAINT ck_itens_preco_medio_nao_negativo
    CHECK (preco_medio >= 0) NOT VALID;

ALTER TABLE itens
    ADD CONSTRAINT ck_itens_dias_aviso_validade_intervalo
    CHECK (dias_aviso_validade BETWEEN 0 AND 3650) NOT VALID;

ALTER TABLE fornecedores
    ADD CONSTRAINT ck_fornecedores_score_intervalo
    CHECK (score BETWEEN 0 AND 100) NOT VALID;

ALTER TABLE movimentacoes_estoque
    ADD CONSTRAINT ck_movimentacoes_quantidade_positiva
    CHECK (quantidade > 0) NOT VALID;

ALTER TABLE movimentacoes_estoque
    ADD CONSTRAINT ck_movimentacoes_saldo_anterior_nao_negativo
    CHECK (saldo_anterior >= 0) NOT VALID;

ALTER TABLE movimentacoes_estoque
    ADD CONSTRAINT ck_movimentacoes_saldo_posterior_nao_negativo
    CHECK (saldo_posterior >= 0) NOT VALID;

ALTER TABLE solicitacoes_movimentacao
    ADD CONSTRAINT ck_solicitacoes_quantidade_positiva
    CHECK (quantidade > 0) NOT VALID;

ALTER TABLE solicitacoes_movimentacao
    ADD CONSTRAINT ck_solicitacoes_ordem_positiva
    CHECK (ordem_no_pedido >= 1) NOT VALID;

ALTER TABLE estoque_valor_historico
    ADD CONSTRAINT ck_estoque_valor_historico_nao_negativo
    CHECK (valor_total >= 0) NOT VALID;
