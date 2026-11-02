-- Los perfiles de las cuentas de demostración (@demo.perfila.app) no vencen,
-- para que la demo siga funcionando después de los 7 días de vigencia normal.
-- Solo toca solicitudes abiertas de cuentas demo; no borra datos.
UPDATE "Solicitud" s
SET "expiraAt" = TIMESTAMP '2099-12-31 00:00:00'
FROM "Perfil" p
JOIN "User" u ON u."id" = p."userId"
WHERE s."perfilId" = p."id"
  AND s."estado" = 'ABIERTA'
  AND u."email" LIKE '%@demo.perfila.app';
