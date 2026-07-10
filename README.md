# Mini-Mall

微型电商项目，支持商品浏览、用户注册登录、购物车、下单和后台管理。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 (Composition API) + TypeScript |
| 构建工具 | Vite |
| UI 组件库 | Element Plus（按需引入） |
| UI 样式 | Less |
| 状态管理 | Pinia |
| 后端 | Express.js |
| 数据库 | SQLite + Prisma 5 |
| 认证 | JWT (jsonwebtoken + bcryptjs) |

## 功能

### 用户端

- 商品浏览：列表、详情、搜索、分类筛选、分页
- 用户注册 / 登录
- 购物车：添加商品、修改数量、删除
- 下单与订单管理：创建订单、模拟支付、查看订单历史
- 会员等级（心悦会员）：根据累计消费自动升级，享受不同折扣

### 管理后台

- 仪表盘：统计数据概览
- 商品管理：增删改查
- 订单管理：查看订单、修改状态
- 分类管理：增删改查
- 管理员权限控制：支持细粒度权限分配

## 会员等级

| 等级 | 累计消费 | 折扣 |
|------|---------|------|
| 普通用户 | < 1000 元 | 原价 |
| 心悦 1 级 | ≥ 1000 元 | 9.8 折 |
| 心悦 2 级 | ≥ 2000 元 | 9.5 折 |
| 心悦 3 级 | ≥ 3000 元 | 9 折 |

支付成功后自动升级，只升不降，折扣仅对后续订单生效。

## 管理员权限

| 权限 | 功能 |
|------|------|
| `super_admin` | 全部权限，可管理其他管理员 |
| `manage_products` | 商品 CRUD |
| `manage_orders` | 订单管理 |
| `manage_categories` | 分类管理 |
| `manage_users` | 查看用户信息 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 初始化数据库
pnpm db:push

# 启动开发环境（前端 5173 + 后端 3000）
pnpm dev

# 单独启动前端
pnpm dev:frontend

# 单独启动后端
pnpm dev:server
```

## 测试账号

启动后执行 `pnpm db:seed` 填充测试数据，包含：

| 角色 | 邮箱 | 密码 | 说明 |
|------|------|------|------|
| 管理员 | admin@mini-mall.com | admin123 | 超级管理员，拥有全部后台权限 |
| 普通用户 | 自行注册 | — | 通过 `/register` 注册即可 |

后台管理入口：`/admin`

## 项目结构

```
mini-mall/
├── prisma/
│   └── schema.prisma          # 数据库模型
├── server/
│   ├── index.ts               # Express 入口
│   ├── middleware/             # 中间件（认证、权限）
│   ├── routes/                # API 路由
│   └── utils/                 # 工具函数
├── src/
│   ├── api/                   # 前端 API 封装
│   ├── components/            # 通用组件
│   ├── pages/                 # 页面组件
│   ├── router/                # Vue Router 配置
│   ├── stores/                # Pinia 状态管理
│   ├── types/                 # TypeScript 类型定义
│   ├── styles/                # Less 样式（变量/重置）
│   ├── App.vue
│   ├── main.ts
├── .husky/                    # Git hooks
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 数据库

```bash
# 同步数据库结构
pnpm db:push

# 生成 Prisma Client
pnpm db:generate

# 打开可视化工具
pnpm db:studio
```

## Git 规范

基于 Conventional Commits，提交信息格式：`type: subject`

| type | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 Bug |
| docs | 文档变更 |
| style | 代码格式 |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试 |
| chore | 杂项 |
| build | 构建/依赖 |

提交前自动执行 Prettier 格式检查。
