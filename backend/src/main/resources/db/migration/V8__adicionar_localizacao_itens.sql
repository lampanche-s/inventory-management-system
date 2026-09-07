ALTER TABLE itens
ADD COLUMN IF NOT EXISTS localizacao VARCHAR(255);

UPDATE itens
SET localizacao = CONCAT('Aisle ', corredor, ' - Shelf ', prateleira)
WHERE localizacao IS NULL OR TRIM(localizacao) = '';
