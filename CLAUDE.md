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
前端 (Vite + Vue 3 + Element Plus)          后端 (Express)
        |                                        |
  src/api/ —— axios ——> /api ——> server/routes/
        |                                        |
  Pinia stores                                   Prisma Client
        |                                        |
      组件                                       SQLite (prisma/dev.db)
  (scoped Less)                                       |
```

### 关键设计决策

- **前后端同仓库、单 package.json**：`tsconfig.json` 管前端（Vue），`tsconfig.node.json` 管后端（Express/Prisma）
- **开发时代理**：Vite 开发服务器将 `/api/*` 代理到 `localhost:3000`，无需 CORS 配置
- **生产部署**：`vite build` 输出到 `dist/`，Express 通过 `express.static('dist')` 托管
- **Less**：样式写在各自 Vue 文件的 `<style lang="less" scoped>` 中，`src/styles/index.less` 仅引入变量和全局重置；`vite.config.ts` 中通过 `additionalData` 自动注入 `variables.less`，所有 scoped 样式块可直接使用全局变量
- **Element Plus**：按需自动导入，`vite.config.ts` 中配置 `unplugin-vue-components` + `unplugin-auto-import`；组件使用 `el-` 前缀无需手动 import；图标需从 `@element-plus/icons-vue` 显式导入

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
- 请求接口的参数需要单独用变量定义，不要直接放接口里
- vue文件里`template`里的`@click=`，如果js代码超过一行需要单独提前成方法，不要直接写到`template`里