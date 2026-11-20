# 健身空间站 Fitness Space Station

面向中国大陆用户的健身内容 / 工具平台。

## 技术栈

- 前端：React 19 + TypeScript + Vite + react-router + TanStack Query + Tailwind CSS + shadcn/ui
- 后端：NestJS + Prisma + PostgreSQL
- 认证：邮箱 + 密码 + JWT
- 仓库：pnpm workspaces monorepo

## 目录结构

```
fitness-space-station/
├── apps/
│   ├── web/   # 前端（Vite + React）
│   └── api/   # 后端（NestJS + Prisma）
├── pnpm-workspace.yaml
└── package.json
```

## 本地启动

### 1. 准备 PostgreSQL

安装 PostgreSQL 16/17+，创建数据库 `fitness_space_station`。

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
# 复制并填写
cp apps/api/.env.example apps/api/.env
```

编辑 `apps/api/.env`，填入：

- `DATABASE_URL`：形如 `postgresql://postgres:<密码>@localhost:5432/fitness_space_station`
- `JWT_SECRET`：任意随机长字符串

### 4. 初始化数据库

```bash
pnpm --filter api exec prisma migrate dev
```

### 5. 启动前后端（两个终端）

```bash
# 终端 1：后端（http://localhost:3000/api）
pnpm --filter api start:dev

# 终端 2：前端（http://localhost:5173）
pnpm --filter web dev
```

打开 http://localhost:5173 即可。

## 默认管理员账号

1. 先在 `/register` 注册一个账号
2. 将该用户角色提升为 ADMIN，二选一：
   - **Prisma Studio（GUI）**：`pnpm --filter api exec prisma studio` → 打开 `User` 表 → 把该用户 `role` 改为 `ADMIN`
   - **psql**：`UPDATE "User" SET role = 'ADMIN' WHERE email = '你的邮箱';`
3. 用该账号登录后，导航栏出现「管理后台」，访问 `/admin` 管理视频 / 文章 / 评论 / 举报

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm build` | 构建 web + api |
| `pnpm lint` | lint web + api |
| `pnpm --filter web dev` | 启动前端开发服务器 |
| `pnpm --filter api start:dev` | 启动后端开发服务器 |
| `pnpm --filter api exec prisma migrate dev` | 应用数据库迁移 |
| `pnpm --filter api exec prisma studio` | 打开 Prisma Studio |
