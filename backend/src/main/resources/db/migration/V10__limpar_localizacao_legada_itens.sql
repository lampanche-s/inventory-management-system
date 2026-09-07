UPDATE itens
SET localizacao = NULL
WHERE localizacao IS NULL
   OR TRIM(localizacao) = ''
   OR TRIM(localizacao) = '-'
   OR LOWER(TRIM(localizacao)) = 'corredor - - prateleira -'
   OR LOWER(TRIM(localizacao)) = 'corredor - prateleira -';

UPDATE itens
SET corredor = '-'
WHERE corredor IS NULL OR TRIM(corredor) = '';

UPDATE itens
SET prateleira = '-'
WHERE prateleira IS NULL OR TRIM(prateleira) = '';