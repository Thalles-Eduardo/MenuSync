-- O schema.prisma documenta "percentual inteiro 0..100" e "preco nao negativo",
-- mas o DSL do Prisma nao expressa CHECK. Sem estas constraints a invariante
-- vive so no comentario, e a Fase 06 vai abrir CRUD escrevendo nestas colunas.
-- Mesma convencao do `@unique` em Coupon.email: a garantia mora no banco.
ALTER TABLE "products"
  ADD CONSTRAINT "products_discount_range"
  CHECK ("discount" IS NULL OR "discount" BETWEEN 0 AND 100);

ALTER TABLE "products"
  ADD CONSTRAINT "products_price_non_negative"
  CHECK ("price" >= 0);
