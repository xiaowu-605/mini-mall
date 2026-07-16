# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
pnpm dev           # 同时启动 Vite (5173) + Express (3000)
pnpm dev:frontend  # 仅前端
pnpm dev:server    # 仅后端（watch 模式）

pnpm db:push       # 同步 Prisma schema → SQLite 数据库
pnpm db:generate   # 重新生成 Prisma Client
pnpm db:seed       # 填充种子数据（演示账号 + 1000 商品）
pnpm db:studio     # 打开 Prisma Studio 可视化

pnpm test          # 运行全部 Vitest 测试
pnpm test:watch    # watch 模式自动重跑

pnpm format        # Prettier 格式化
pnpm format:check  # Prettier 检查（pre-commit 钩子自动执行）
```

## 架构

```
前端 (Vite + Vue 3 + Element Plus)          后端 (Express)
        |                                        |
  src/api/ —— axios ——> /api ——> server/routes/
        |                                        |
  Pinia stores                                   Prisma Client
        |                                        |
  组件 + 指令(permission)                       SQLite (prisma/dev.db)
  (scoped Less)                                       |
        |                                        |
  __tests__/  Vitest 单元测试
```

### 关键设计决策

- **前后端同仓库、单 package.json**：`tsconfig.json` 管前端（Vue），`tsconfig.node.json` 管后端（Express/Prisma）
- **开发时代理**：Vite 开发服务器将 `/api/*` 代理到 `localhost:3000`，无需 CORS 配置
- **生产部署**：`vite build` 输出到 `dist/`，Express 通过 `express.static('dist')` 托管
- **Less**：样式写在各自 Vue 文件的 `<style lang="less" scoped>` 中，`src/styles/index.less` 仅引入变量和全局重置；`vite.config.ts` 中通过 `additionalData` 自动注入 `variables.less`，所有 scoped 样式块可直接使用全局变量
- **Element Plus**：按需自动导入，`vite.config.ts` 中配置 `unplugin-vue-components` + `unplugin-auto-import`；组件使用 `el-` 前缀无需手动 import；图标需从 `@element-plus/icons-vue` 显式导入；全局注册 `zhCn` 中文语言包（`App.vue` 中 `el-config-provider`）
- **ECharts**：按需导入，仅注册 `LineChart / PieChart / BarChart` 三种图表 + `Tooltip / Legend / Grid / Title` 组件 + `CanvasRenderer`，不用的模块不打包
- **图片上传**：`multer` 处理 multipart/form-data，存储到 `public/uploads/`，Express 以 `express.static('public')` 托管
- **权限指令 `v-permission`**：`src/directives/permission.ts` 全局注册，基于 `useAuthStore().hasPermission()` 控制元素显隐（`display:none` + `disabled`）
- **动态路由**：`src/router/index.ts` 中 `DYNAMIC_ROUTES` 数组配置需按权限注入的路由，`beforeEach` 中遍历注入，`hasRoute` 防重复

### 数据库模型（Prisma + SQLite）

6 个模型：`User`、`Category`、`Product`、`CartItem`、`Order`、`OrderItem`

- `User.role`：`"user"` 或 `"admin"`；`User.permissions`：JSON 数组控制后台细粒度权限（`super_admin`、`manage_products`、`manage_orders`、`manage_categories`、`manage_users`）
- `User.status`：`"active"`（默认）或 `"blocked"`，拉黑用户禁止下单（`orders.ts` 创建订单时校验）
- `User.memberLevel`：0-3，按累计消费（`totalSpent`）自动升级，下单时享受对应折扣；`User.totalSpent` 在订单支付成功后累加
- `CartItem`：`@@unique([userId, productId])`，重复添加同一商品时 upsert 增加数量
- `Order.total`：商品原价合计；`Order.discount`：会员折扣率（1.0/0.98/0.95/0.9）；`Order.discountedTotal`：折后实付
- `OrderItem.price`：下单时商品价格快照，避免后续调价影响历史订单
- 订单状态流转：`pending → paid → shipped → completed`，任意状态可 → `cancelled`

### 后台权限体系

**两层权限模型：**

1. **角色级**（`requireAdmin` 中间件）：仅 `role='admin'` 可访问后台
2. **功能级**（`requirePermission` 中间件）：读操作所有管理员可见，写操作需对应权限

| 权限 | 说明 |
|------|------|
| `super_admin` | 拥有所有权限，可访问管理员管理页面（动态路由注入）|
| `manage_products` | 商品 CRUD |
| `manage_orders` | 订单状态变更 |
| `manage_categories` | 分类 CRUD |
| `manage_users` | 用户拉黑/解除 |

**前端权限控制：**
- `v-permission="'manage_products'"` 指令控制按钮显隐
- 侧边栏 `管理员管理` 菜单项 `v-if="auth.hasPermission('super_admin')"` 仅超级管理员可见
- 管理员管理路由通过 `DYNAMIC_ROUTES` 配置数组动态注入，无权限用户路由表不存在该路径

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

<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版

本项目已安装 superpowers-zh 技能框架（20 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.claude/skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **chinese-code-review**: 中文 review 沟通参考——话术模板、分级标注（必须修复/建议修改/仅供参考）、国内团队常见反模式应对。仅在用户显式 /chinese-code-review 时调用，不要根据上下文自动触发。
- **chinese-commit-conventions**: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配、commitlint/husky/commitizen 中文模板、conventional-changelog 中文配置。仅在用户显式 /chinese-commit-conventions 时调用，不要根据上下文自动触发。
- **chinese-documentation**: 中文文档排版参考——中英文空格、全半角标点、术语保留、链接格式、中文文案排版指北约定。仅在用户显式 /chinese-documentation 时调用，不要根据上下文自动触发。
- **chinese-git-workflow**: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的 SSH/HTTPS/凭据/CI 接入差异与镜像同步配置。仅在用户显式 /chinese-git-workflow 时调用，不要根据上下文自动触发。
- **dispatching-parallel-agents**: 当面对 2 个以上可以独立进行、无共享状态或顺序依赖的任务时使用
- **executing-plans**: 当你有一份书面实现计划需要在单独的会话中执行，并设有审查检查点时使用
- **finishing-a-development-branch**: 当实现完成、所有测试通过、需要决定如何集成工作时使用——通过提供合并、PR 或清理等结构化选项来引导开发工作的收尾
- **mcp-builder**: MCP 服务器构建方法论 — 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力
- **receiving-code-review**: 收到代码审查反馈后、实施建议之前使用，尤其当反馈不明确或技术上有疑问时——需要技术严谨性和验证，而非敷衍附和或盲目执行
- **requesting-code-review**: 完成任务、实现重要功能或合并前使用，用于验证工作成果是否符合要求
- **subagent-driven-development**: 当在当前会话中执行包含独立任务的实现计划时使用
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **using-git-worktrees**: 当需要开始与当前工作区隔离的功能开发，或在执行实现计划之前使用——通过原生工具或 git worktree 回退机制确保隔离工作区存在
- **using-superpowers**: 在开始任何对话时使用——确立如何查找和使用技能，要求在任何响应（包括澄清性问题）之前调用 Skill 工具
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **workflow-runner**: 在 Claude Code / OpenClaw / Cursor 中直接运行 agency-orchestrator YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎。当用户提供 .yaml 工作流文件或要求多角色协作完成任务时触发。
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前
- **writing-skills**: 当创建新技能、编辑现有技能或在部署前验证技能是否有效时使用

## 如何使用

当任务匹配某个 skill 时，使用 `Skill` 工具加载对应 skill 并严格遵循其流程。绝不要用 Read 工具读取 SKILL.md 文件。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->

## 代码规范
- 接口请求参数预定义：
  调用接口时，请求参数必须预先声明为独立变量或常量，严禁在请求方法中直接传递内联对象字面量，以提升可读性和参数复用性。
- 模板事件处理简洁化：
  在 `<template>` 中绑定事件（如 @click）时，若内联代码超过一个表达式，必须抽离为独立的组件方法，不得在模板中编写多行 JS 逻辑。
- 接口数据空值防护：
  对接口返回的数据，必须先进行空值（null / undefined）校验或提供安全默认值，再赋值给响应式状态，避免因数据缺失导致运行时异常。
- 组件顶层 API 集中声明：
  `onMounted、watch、computed` 等Vue内置组合式API应统一放置在 `<script setup>` 或组件脚本的顶部区域，确保核心生命周期与侦听逻辑一目了然。
- 通用工具函数强制提取：
  防抖、节流等工具函数必须封装至 `utils` 目录。任何在两个及以上组件或模块中引用的函数，均需提取为公共工具方法，杜绝重复定义。
- 函数注释明确化：
  组件内所有函数均须添加中文注释，清晰说明函数功能、关键参数的含义及返回值类型，保障代码的可维护性。
- 业务逻辑内聚分组：
  将处理同一业务功能的响应式变量、计算属性和方法就近放置，形成逻辑块，避免跨区域交叉引用，减少滚动与认知负担。
- 可复用逻辑抽取为 Hooks：
  当相同业务逻辑在多个组件中重复出现时，必须封装为组合式函数（Hooks），统一存放于 `hooks` 目录下，实现逻辑复用与关注点分离。
- 变量与常量声明规范：
  变量定义强制使用 `let`，常量使用 `const`，禁止出现 `var`。对于结构复杂或业务含义不直观的变量（如深层嵌套对象、特殊标识符），必须添加行内注释说明其结构、用途及约束条件。
- 可交互元素指针样式规范:
  所有支持点击交互的元素（如按钮、链接、可点击的图标、通过 @click 绑定的非原生交互组件等）均须设置 CSS 属性 cursor: pointer，以明确告知用户该区域可操作，提升交互体验。