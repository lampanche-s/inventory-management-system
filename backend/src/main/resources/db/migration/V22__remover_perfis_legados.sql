DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM usuarios u
        JOIN perfis p ON p.id = u.perfil_id
        WHERE p.nome IN ('GERENTE', 'OPERADOR', 'LEITOR')
    ) THEN
        RAISE EXCEPTION
            'Legacy user roles detected (GERENTE, OPERADOR or LEITOR). Migrate affected users explicitly to a supported role before applying V22.';
    END IF;
END $$;

DELETE FROM perfis
WHERE nome IN ('GERENTE', 'OPERADOR', 'LEITOR');
