DO $$
DECLARE
    limite_atual INTEGER;
BEGIN
    SELECT character_maximum_length
    INTO limite_atual
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'solicitacoes_movimentacao'
      AND column_name = 'observacao';

    IF limite_atual IS NOT NULL AND limite_atual < 500 THEN
        ALTER TABLE solicitacoes_movimentacao
            ALTER COLUMN observacao TYPE VARCHAR(500);
    END IF;
END $$;

DO $$
DECLARE
    limite_atual INTEGER;
BEGIN
    SELECT character_maximum_length
    INTO limite_atual
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'solicitacoes_movimentacao'
      AND column_name = 'justificativa_decisao';

    IF limite_atual IS NOT NULL AND limite_atual < 500 THEN
        ALTER TABLE solicitacoes_movimentacao
            ALTER COLUMN justificativa_decisao TYPE VARCHAR(500);
    END IF;
END $$;

DO $$
DECLARE
    limite_atual INTEGER;
BEGIN
    SELECT character_maximum_length
    INTO limite_atual
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'movimentacoes_estoque'
      AND column_name = 'observacao';

    IF limite_atual IS NOT NULL AND limite_atual < 1000 THEN
        ALTER TABLE movimentacoes_estoque
            ALTER COLUMN observacao TYPE VARCHAR(1000);
    END IF;
END $$;
