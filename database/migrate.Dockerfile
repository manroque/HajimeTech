# Imagem do serviço `migrate` (docker-compose.yml): aplica as migrações do
# Prisma e carrega o seed. Só as dependências ficam na imagem; as migrações,
# o prisma.config.js e o seed.sql são montados como volumes.
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]
