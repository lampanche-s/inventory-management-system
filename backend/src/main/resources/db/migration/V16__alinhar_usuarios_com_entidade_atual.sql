ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS usuario VARCHAR(80);

UPDATE usuarios
SET usuario = COALESCE(NULLIF(TRIM(email), ''), CONCAT('user-', id))
WHERE usuario IS NULL OR TRIM(usuario) = '';

ALTER TABLE usuarios
ALTER COLUMN usuario SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_usuario
ON usuarios(usuario);

ALTER TABLE usuarios
ALTER COLUMN email DROP NOT NULL;
