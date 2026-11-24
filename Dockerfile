# ---- 构建阶段：装依赖 + 构建 api ----
FROM node:22-alpine AS builder

# Alpine 软件源换阿里云镜像（国内构建提速）
RUN sed -i 's#https\?://dl-cdn.alpinelinux.org#https://mirrors.aliyun.com#g' /etc/apk/repositories

# pnpm 通过 npm 装（配合下面设置的国内 registry）
RUN npm config set registry https://registry.npmmirror.com \
    && npm i -g pnpm@9

WORKDIR /app

# pnpm 也指向国内 registry
RUN pnpm config set registry https://registry.npmmirror.com

# 先复制清单以利用缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# 全量依赖（构建需要 tsc / nest cli / prisma cli）
RUN pnpm install --frozen-lockfile

# 复制源码并构建
COPY . .
# Prisma 引擎走国内镜像，避免从境外下载二进制卡住
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

# ---- 运行阶段 ----
FROM node:22-alpine AS runner

# 同样换阿里云镜像源
RUN sed -i 's#https\?://dl-cdn.alpinelinux.org#https://mirrors.aliyun.com#g' /etc/apk/repositories \
    && apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

# 直接复用构建阶段的 node_modules（含 prisma cli / @prisma/client 生成物），
# 避免在运行阶段再解析依赖导致 migrate 失败
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# prisma schema 中的 generator 输出到默认位置，需保证可写
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

WORKDIR /app/apps/api
EXPOSE 3000

# 迁移成功后启动（失败则快速退出，便于发现问题）
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
