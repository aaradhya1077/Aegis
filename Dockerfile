# Multi-stage build for Next.js frontend
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency catalogs
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Turn off telemetry during compilation
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_GROQ_API_KEY
ARG NEXT_PUBLIC_SIH_YEAR=2026
ARG NEXT_PUBLIC_SIH_PROBLEM_ID=SIH1748
ARG NEXT_PUBLIC_MINISTRY="Ministry of Coal, Government of India"
ARG NEXT_PUBLIC_REGULATOR="Directorate General of Mines Safety (DGMS)"

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_GROQ_API_KEY=$NEXT_PUBLIC_GROQ_API_KEY
ENV NEXT_PUBLIC_SIH_YEAR=$NEXT_PUBLIC_SIH_YEAR
ENV NEXT_PUBLIC_SIH_PROBLEM_ID=$NEXT_PUBLIC_SIH_PROBLEM_ID
ENV NEXT_PUBLIC_MINISTRY=$NEXT_PUBLIC_MINISTRY
ENV NEXT_PUBLIC_REGULATOR=$NEXT_PUBLIC_REGULATOR

RUN npm run build

# Production runtime image setup
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Setup unprivileged system user for process execution
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "npm start -- -p ${PORT:-3000}"]
