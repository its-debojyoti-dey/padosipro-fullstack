FROM node:20-alpine AS builder

# Install OpenSSL for Prisma on Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

# Install OpenSSL for Prisma runtime on Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --only=production
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production
ENV DATABASE_URL="file:./dev.db"
ENV JWT_SECRET="padosipro_super_secret_jwt_key_2026_production_grade"
ENV LOG_OTP_TO_CONSOLE=true

CMD ["sh", "-c", "npx prisma db push && node dist/src/prisma/seed.js && node dist/src/index.js"]
