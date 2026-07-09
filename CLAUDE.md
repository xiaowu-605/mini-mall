# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
pnpm dev           # 同时启动 Vite (5173) + Express (3000)
pnpm dev:frontend  # 仅前端
pnpm dev:server    # 仅后端（watch 模式）

pnpm db:push       # 同步 Prisma schema → SQLite 数据库
pnpm db:generate   # 重新生成 Prisma Client
pnpm db:studio     # 打开 Prisma Studio 可视化

pnpm format        # Prettier 格式化
pnpm format:check  # Prettier 检查（pre-commit 钩子自动执行）
```

## 架构

```
前端 (Vite + Vue 3)          后端 (Express)
        |                        |
  src/api/ —— axios ——> /api ——> server/routes/
        |                        |
  Pinia stores                   Prisma Client
        |                        |
      组件                       SQLite (prisma/dev.db)
```

### 关键设计决策

- **前后端同仓库、单 package.json**：`tsconfig.json` 管前端（Vue），`tsconfig.node.json` 管后端（Express/Prisma）
- **开发时代理**：Vite 开发服务器将 `/api/*` 代理到 `localhost:3000`，无需 CORS 配置
- **生产部署**：`vite build` 输出到 `dist/`，Express 通过 `express.static('dist')` 托管
- **Tailwind CSS 4**：CSS-first 配置，在 `src/style.css` 通过 `@import "tailwindcss"` 引入，`vite.config.ts` 中使用 `@tailwindcss/vite` 插件。无 `tailwind.config.js`

### 数据库模型（Prisma + SQLite）

6 个模型：`User`、`Category`、`Product`、`CartItem`、`Order`、`OrderItem`

- `User.role`：`"user"` 或 `"admin"`；`User.permissions`：JSON 数组控制后台细粒度权限（`super_admin`、`manage_products`、`manage_orders`、`manage_categories`、`manage_users`）
- `User.memberLevel`：0-3，按累计消费（`totalSpent`）自动升级，下单时享受对应折扣；`User.totalSpent` 在订单支付成功后累加
- `CartItem`：`@@unique([userId, productId])`，重复添加同一商品时 upsert 增加数量
- `Order.total`：商品原价合计；`Order.discount`：会员折扣率（1.0/0.98/0.95/0.9）；`Order.discountedTotal`：折后实付
- `OrderItem.price`：下单时商品价格快照，避免后续调价影响历史订单
- 订单状态流转：`pending → paid → shipped → completed`，任意状态可 → `cancelled`

### 会员等级规则

下单时按当前等级计算 `discountedTotal = total × discount`，支付后累加 `totalSpent` 并重算等级（只升不降）：

| 等级 | 条件 | 折扣 |
|------|------|------|
| 0 普通 | < 1000 | 原价 |
| 1 心悦1 | ≥ 1000 | 0.98 |
| 2 心悦2 | ≥ 2000 | 0.95 |
| 3 心悦3 | ≥ 3000 | 0.90 |

### 前端路径别名

`@` → `src/`，在 `vite.config.ts` 和 `tsconfig.json` 中均配置。

### Git 规范

Conventional Commits，冒号后必须有空格：`feat: 描述`。pre-commit 钩子自动运行 prettier --check，commit-msg 钩子运行 commitlint。
