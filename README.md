# AI 工具箱 MVP

聚合型 AI 工具平台的个人起步原型：前端把 AI 绘画、文案生成包装成开箱即用的小工具，用户登录后消耗积分调用。当前版本为**本地可闭环演示**，后端为零依赖 mock 服务，未接入真实模型与真实数据库。

## 技术栈

- 前端：Vue 3 + Vite + Element Plus + Pinia + Vue Router
- 后端（mock）：Node 内置 `http` 模块，零额外依赖，JSON 文件持久化
- 接口前缀：`/api/v1`（前端只访问自家后端，模型密钥不进前端）

## 快速启动

前置：Node 18+（已在 Node 22 验证）。

```bash
npm install
npm run dev:all
```

`dev:all` 会同时启动：

- mock 后端：http://localhost:8787
- Vite 前端：http://localhost:5173

也可分两个终端分别启动：

```bash
npm run server   # 后端 8787
npm run dev      # 前端 5173
```

构建生产包：

```bash
npm run build
```

### 打包与按需引入

- Element Plus 通过 `unplugin-vue-components` + `ElementPlusResolver` 按需解析模板组件；图标仅注册实际用到的几个；`ElMessage` 等函数式组件样式在 `src/main.js` 手动引入。
- Vite `manualChunks` 将第三方库拆为独立长效缓存 chunk：`vendor-vue`（Vue 全家桶）、`vendor-flow`（Vue Flow 画布）、`vendor-element`（Element Plus）；页面路由全部懒加载，首屏只加载当前路由所需资源。

## 目录结构

```
ai-tools-mvp/
├── server/            # mock 后端（/api/v1）
│   ├── index.js
│   └── data/db.json   # 本地演示数据（自动生成）
├── src/
│   ├── api/           # 后端接口封装
│   ├── stores/        # Pinia：auth / wallet / works
│   ├── router/
│   ├── views/         # 页面
│   ├── components/    # 公共组件
│   ├── lib/           # 常量与工具
│   └── assets/
├── scripts/dev-all.mjs
└── vite.config.js
```

## 工作流画布（/workflow）

节点式可视化编排，可按连线真实执行：

- 节点类型：文本节点、图片节点、AI 文案、AI 绘画。
- 左侧面板点击或拖拽节点到画布；从节点右侧端口拖线到下一节点左侧端口完成连线。
- 选中节点后右侧显示参数面板（语气、提示词、补充主题等），节点上方浮出操作条：聚焦、添加下游、预览、下载、删除。
- 「运行工作流」按连线拓扑顺序执行：上游节点输出作为下游输入；AI 节点调用模型渠道，结果回写节点。
- 编排与参数自动保存到浏览器 localStorage，刷新后回读。
- 引擎见 `src/lib/workflow.js`，画布状态见 `src/stores/workflow.js`，渠道适配见 `server/channels.js`。

### 接入真实模型渠道

在项目根目录 `.env`（参考 `.env.example`）配置以下服务端变量后重启后端，即从 mock 切换到真实渠道（OpenAI 兼容协议）：

```
MODEL_API_KEY=你的密钥
MODEL_BASE_URL=https://渠道地址/v1
MODEL_CHAT_MODEL=文案模型名
MODEL_IMAGE_MODEL=文生图模型名
```

未配置时后端自动回退本地 mock；渠道状态可通过 `GET /api/v1/channel/status` 查看（`mock` / `real`）。

### 多渠道骨架

- 渠道注册表见 `server/channel-registry.js`：每条渠道含 `id / name / kind(chat|image) / baseUrl / models / keyEnv`；渠道密钥从环境变量读取，不下发前端。
- 前端 AI 节点参数面板提供「模型」下拉，选项来自 `GET /api/v1/channels`；所选模型随生成请求提交，后端按渠道转发。
- **当前渠道**：DeepSeek（文案，已接通）；智谱 CogView/GLM-Image（文生图，已接通）；OpenAI（预留位，需海外网络与支付）。
- **新增渠道**：在注册表数组加一条渠道定义，再在 `.env` 配置对应 `keyEnv` 密钥即可，调用与前端代码无需改动。
- 旧版 `MODEL_*` 单渠道变量仍作为默认渠道兼容保留。

## 接口一览（与计划 D6 对齐）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/v1/auth/register` | 注册，返回 token 与初始积分 |
| POST | `/api/v1/auth/login` | 登录，返回 token |
| GET | `/api/v1/tools` | 已启用工具列表 |
| POST | `/api/v1/generations` | 提交生成任务（登录、校验余额） |
| GET | `/api/v1/generations/:id` | 查询单条作品 |
| GET | `/api/v1/user/works` | 我的作品列表 |
| GET | `/api/v1/user/wallet` | 积分余额与流水 |

## 当前边界（mock 阶段）

- 未配置模型渠道时结果为本地占位：绘画返回 SVG 占位图，文案返回示例文本；按上文配置 `MODEL_*` 环境变量后即走真实渠道。
- 数据存 `server/data/db.json`，重启保留，清空删除该文件即可重置。
- 密码仅做 sha256 摘要，仅供本地演示，不代表生产安全实现。
- 未接入支付、微信登录、备案域名与运营后台。

## 后续迁移方向

将 `server/index.js` 中的数据读写替换为 Supabase（PostgreSQL + Auth + 存储）或 Cloudflare Workers + D1/KV；前端 `/api/v1` 路径与字段保持不变即可平滑切换。真实模型调用放在后端函数内，密钥通过环境变量注入。

> 详细的表结构、RLS、认证、函数拆分与分阶段步骤见 [`docs/supabase-migration.md`](docs/supabase-migration.md)。后端数据读写已收敛到 `server/repository.js`，迁移时只需替换仓储实现。
