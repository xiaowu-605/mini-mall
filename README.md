# Mini-Mall

微型电商项目，支持商品浏览、用户注册登录、购物车、下单和后台管理。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 (Composition API) + TypeScript |
| 构建工具 | Vite |
| UI 组件库 | Element Plus（按需引入 + 中文语言包） |
| 可视化 | ECharts（按需导入） |
| UI 样式 | Less（scoped + BEM） |
| 状态管理 | Pinia |
| 后端 | Express.js |
| 数据库 | SQLite + Prisma 5 |
| 认证 | JWT (jsonwebtoken + bcryptjs)，httpOnly Cookie |
| 图片上传 | multer |
| 测试 | Vitest + @vue/test-utils + happy-dom |

## 功能

### 用户端

- 商品浏览：列表、详情、搜索、分类筛选、分页、猜你喜欢
- 用户注册 / 登录（演示账号一键填入 / 管理员快捷登录）
- 购物车：添加商品、修改数量、删除、提交订单
- 下单与订单管理：创建订单、模拟支付、查看订单历史
- 会员等级（心悦会员）：根据累计消费自动升级，享受不同折扣
- 拉黑用户禁止下单

### 管理后台

- **仪表盘**：统计卡片 + ECharts 图表（近 7 天订单趋势、订单状态分布饼图、分类商品数量柱状图）
- **商品管理**：CRUD + 分页 + 搜索 + 分类/零库存筛选 + 图片上传（拖拽上传 + URL 双模式）
- **订单管理**：列表 + 搜索（订单号/用户名）+ 状态/时间筛选 + 状态流转 + 金额汇总行 + 分页
- **分类管理**：CRUD
- **用户管理**：普通用户列表 + 搜索 + 拉黑/解除拉黑
- **管理员管理**：仅超级管理员可见（动态路由注入），支持新增/编辑权限/删除管理员
- **权限体系**：两层权限模型（角色级 + 功能级），`v-permission` 指令控制 UI 显隐，路由动态注入

## 会员等级

| 等级 | 累计消费 | 折扣 |
|------|---------|------|
| 普通用户 | < 1000 元 | 原价 |
| 心悦 1 级 | ≥ 1000 元 | 9.8 折 |
| 心悦 2 级 | ≥ 2000 元 | 9.5 折 |
| 心悦 3 级 | ≥ 3000 元 | 9 折 |

支付成功后自动升级，只升不降，折扣仅对后续订单生效。

## 管理员权限

两层权限模型：所有管理员可查看后台数据（读权限），写操作需要对应的细粒度权限。

| 权限 | 功能 |
|------|------|
| `super_admin` | 全部权限，可访问管理员管理页面 |
| `manage_products` | 商品新增/编辑/删除 |
| `manage_orders` | 订单状态变更 |
| `manage_categories` | 分类新增/删除 |
| `manage_users` | 用户拉黑/解除 |

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

启动后执行 `pnpm db:seed` 填充测试数据（1000 个商品 + 4 个演示账号）：

| 角色 | 邮箱 | 密码 | 说明 |
|------|------|------|------|
| 超级管理员 | admin@mini-mall.com | admin123 | 全部后台权限，可管理其他管理员 |
| 普通管理员 | admin2@mini-mall.com | admin123 | 仅查看，不能新增/编辑/删除 |
| 普通用户 | user@mini-mall.com | user123 | 心悦 Lv.1 会员 |
| VIP 会员 | vip@mini-mall.com | vip123 | 心悦 Lv.3 会员 |

登录页提供「管理员快捷登录」按钮（一键直登）和「演示账号」一键填入。

后台管理入口：`/admin`

## 项目结构

```
mini-mall/
├── prisma/
│   ├── schema.prisma              # 数据库模型（6 个模型）
│   └── seed.ts                    # 种子数据（1000 商品 + 演示账号）
├── public/uploads/                # 商品图片上传目录
├── server/
│   ├── index.ts                   # Express 入口
│   ├── lib/auth.ts                # JWT 认证 + 密码加密
│   ├── middleware/admin.ts        # 权限中间件（requireAdmin + requirePermission）
│   ├── prisma.ts                  # Prisma Client 单例
│   └── routes/                    # API 路由
│       ├── auth.ts                # 注册/登录/演示账号
│       ├── products.ts            # 公开商品 API
│       ├── categories.ts          # 公开分类 API
│       ├── cart.ts                # 购物车
│       ├── orders.ts              # 订单（创建/支付/取消）
│       ├── admin-products.ts      # 后台商品管理
│       ├── admin-orders.ts        # 后台订单管理
│       ├── admin-categories.ts    # 后台分类管理
│       ├── admin-users.ts         # 后台用户管理（拉黑）
│       ├── admin-admins.ts        # 后台管理员管理（仅 super_admin）
│       ├── admin-upload.ts        # 图片上传
│       └── admin-dashboard.ts     # 仪表盘数据 + ECharts 图表
├── src/
│   ├── __tests__/                 # Vitest 测试
│   │   ├── utils/                 # 工具函数测试
│   │   ├── hooks/                 # Hooks 测试
│   │   ├── stores/                # Store 测试
│   │   └── components/            # 组件测试
│   ├── api/                       # 前端 API 封装（axios）
│   ├── components/
│   │   ├── common/                # 通用组件（Pagination）
│   │   ├── layout/                # 布局组件（AppHeader）
│   │   └── product/               # 商品组件（ProductCard）
│   ├── directives/                # 自定义指令
│   │   └── permission.ts          # v-permission 权限指令
│   ├── hooks/                     # 组合式函数
│   │   ├── useAsyncData.ts        # 异步数据加载
│   │   └── useDeleteConfirm.ts    # 删除确认弹窗
│   ├── pages/
│   │   ├── admin/                 # 后台管理页面
│   │   │   ├── AdminLayout.vue    # 后台布局（侧边栏 + 顶部栏）
│   │   │   ├── DashboardPage.vue  # 仪表盘（ECharts）
│   │   │   ├── ProductManage.vue  # 商品管理
│   │   │   ├── OrderManage.vue    # 订单管理
│   │   │   ├── CategoryManage.vue # 分类管理
│   │   │   ├── UserManage.vue     # 用户管理（拉黑）
│   │   │   └── AdminManage.vue    # 管理员管理（仅 super_admin）
│   │   ├── home/                  # 首页
│   │   ├── login/                 # 登录
│   │   ├── register/              # 注册
│   │   ├── cart/                  # 购物车
│   │   ├── orders/                # 订单列表/详情
│   │   └── product-detail/        # 商品详情
│   ├── router/index.ts            # Vue Router（含动态路由注入）
│   ├── stores/                    # Pinia 状态管理
│   │   ├── auth.ts                # 认证 + 权限
│   │   └── cart.ts                # 购物车
│   ├── types/                     # TypeScript 类型（按功能拆分）
│   ├── styles/                    # Less 样式变量 + 重置
│   ├── utils/                     # 工具函数
│   │   ├── debounce.ts            # 防抖
│   │   ├── format.ts              # 时间格式化
│   │   └── order.ts               # 订单状态映射
│   ├── App.vue                    # 根组件（含 ElConfigProvider 中文语言包）
│   └── main.ts                    # 入口（注册指令）
├── .husky/                        # Git hooks（pre-commit + commit-msg）
├── vitest.config.ts
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## 数据库

```bash
# 同步数据库结构
pnpm db:push

# 生成 Prisma Client
pnpm db:generate

# 填充种子数据（演示账号 + 1000 商品）
pnpm db:seed

# 打开可视化工具
pnpm db:studio
```

## 测试

基于 Vitest + @vue/test-utils + happy-dom。

```bash
pnpm test           # 运行全部测试（23 个用例）
pnpm test:watch     # watch 模式
```

测试覆盖：utils（防抖、格式化、状态映射）、hooks（useAsyncData）、stores（auth 权限逻辑）、components（ProductCard 渲染）。

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
