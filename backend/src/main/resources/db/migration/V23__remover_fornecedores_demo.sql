DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM itens i
        JOIN fornecedores f ON f.id = i.fornecedor_id
        WHERE f.nome IN (
            'Northstar Office Supplies (Demo)',
            'Bluebird Safety Equipment (Demo)',
            'Evergreen Facility Services (Demo)',
            'Atlas Maintenance Services (Demo)',
            'Paper Kite Packaging (Demo)'
        )
    ) THEN
        RAISE EXCEPTION
            'Demo suppliers are still linked to items. Reassign those items explicitly before applying V23.';
    END IF;
END $$;

DELETE FROM fornecedores
WHERE nome IN (
    'Northstar Office Supplies (Demo)',
    'Bluebird Safety Equipment (Demo)',
    'Evergreen Facility Services (Demo)',
    'Atlas Maintenance Services (Demo)',
    'Paper Kite Packaging (Demo)'
);
