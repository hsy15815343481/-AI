# 迁移 Supabase（方向 B）实施方案

> 适用阶段：本地 mock 闭环已跑通，准备把账号、作品、积分流水迁到 BaaS，并把模型调用放到服务端函数。
> 原则：现有 `/api/v1` 路径与返回字段尽量保持不变；前端页面不大改，后端只换底层实现。

## 1. 目标与不做的事

**迁什么**
- 账号认证：由本地 `sessions` 令牌改为 Supabase Auth。
- 数据存储：用户积分、作品记录、积分流水由 `db.json` 改为 Supabase 数据库。
- 模型调用：文案/图片生成放进服务端函数，密钥只留在函数环境变量。

**暂不做**
- 在线支付、微信扫码登录、国内备案域名、运营后台（需企业主体或后续有真实收入再补）。
- 不把模型 Key、service role key 下发到前端。

## 2. 架构对照

| 层 | 现状（本地 mock） | 目标（Supabase） |
|---|---|---|
| 前端 | Vue3 + Pinia，`src/api/http.js` 统一请求 | 不变；登录改用 `@supabase/supabase-js`，读取可直连受 RLS 保护的表 |
| 业务后端 | `server/index.js`（路由 + 鉴权 + 扣费） | 鉴权由 Supabase Auth 承担；写操作收束到 Edge Function |
| 数据 | `server/data/db.json` | `profiles` / `generations` / `transactions` 三张表 |
| 模型渠道 | `server/channels.js`（real/mock 适配） | 逻辑搬入 Edge Function，环境变量不变 |
| 部署 | 本地 `npm run dev:all` | 前端静态托管 + Supabase 函数/数据库 |

## 3. 数据库表结构（DDL）

在 Supabase SQL Editor 执行：

```sql
-- 用户资料，关联 Supabase Auth 内置的 auth.users
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  nickname      text not null,
  credits       integer not null default 10,
  created_at    timestamptz not null default now()
);

-- 作品记录
create table public.generations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  tool_slug     text not null,
  params        jsonb not null default '{}',
  status        text not null default 'success',
  result_url    text,
  result_text   text,
  error_message text,
  created_at    timestamptz not null default now()
);

-- 积分流水
create table public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  change_amount integer not null,
  reason        text not null,
  balance_after integer not null,
  created_at    timestamptz not null default now()
);

-- 常用查询索引
create index idx_generations_user on public.generations(user_id desc);
create index idx_transactions_user on public.transactions(user_id desc);
```

字段与现有 mock 的对应关系（snake_case ↔ camelCase）：

| mock（db.json） | Supabase 列 |
|---|---|
| `user.id` | `profiles.id` |
| `user.email / nickname / credits / createdAt` | `email / nickname / credits / created_at` |
| `generation.userId` | `generations.user_id` |
| `generation.toolSlug / params / status / resultUrl / resultText / errorMessage / createdAt` | `tool_slug / params / status / result_url / result_text / error_message / created_at` |
| `transaction.userId / changeAmount / reason / balanceAfter / createdAt` | `user_id / change_amount / reason / balance_after / created_at` |

> 若希望前端完全不用改字段名，可在读取接口里把 snake_case 映射回 camelCase；读表场景也可由 Supabase 视图层完成。

## 4. 行级安全（RLS）

三张表全部开启 RLS。核心规则：**用户只能读取自己的数据；所有写入（扣费、建作品）只允许服务端函数用 service role 执行，前端不能直接改余额。**

```sql
alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.transactions enable row level security;

-- profiles：本人可读
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

-- generations：本人可读
create policy "generations: read own" on public.generations
  for select using (auth.uid() = user_id);

-- transactions：本人可读
create policy "transactions: read own" on public.transactions
  for select using (auth.uid() = user_id);

-- 写入策略：不开放给匿名/普通登录角色，仅 service role 绕过 RLS 在函数内写入。
```

注册时自动建档案：用 Supabase Database Trigger，在 `auth.users` 新增行时往 `profiles` 插入初始记录（赠送初始积分）。

## 5. 认证方式

- 前端安装 `@supabase/supabase-js`，用匿名 key（anon key）初始化客户端。
- 注册 `signUp({ email, password })`，登录 `signInWithPassword({ email, password })`；登录态存 session，请求头带 `session.access_token`（对应现有 `Authorization: Bearer <token>`）。
- 退出调用 `signOut()`，清空本地状态。
- 现有 `src/api/auth.js`、`src/stores/auth.js` 对接这一层；`http.js` 的 token 读取逻辑保持不变。

## 6. 服务端函数（Edge Function）

### 6.1 `generate`（提交生成）

职责对应现有 `POST /api/v1/generations`：

1. 校验请求里的 JWT，取 `user_id`；未登录返回 401。
2. 查 `profiles.credits`，对照工具成本（绘画 2、文案 1，与 `constants.js` 对齐），余额不足返回 402。
3. 调用模型渠道（把 `server/channels.js` 的 `generateCopywriting` / `generateImage` 搬入）；渠道未配置 Key 时仍回退 mock。
4. **成功才扣费**：扣减余额、写一条消耗流水、写作品记录；失败标记 `failed`，不扣费、不写消耗流水。
5. 返回 `{ id, status }`，字段与现有接口一致。

### 6.2 密钥与环境变量

函数侧（Supabase Function Secrets）保存，不下发前端：

| 变量 | 说明 |
|---|---|
| `MODEL_API_KEY` | 模型渠道密钥 |
| `MODEL_BASE_URL` | 渠道接口地址 |
| `MODEL_CHAT_MODEL` | 文案模型名 |
| `MODEL_IMAGE_MODEL` | 文生图模型名 |
| `INITIAL_CREDITS` | 注册赠送积分 |

前端只需要 Supabase 公开配置：`SUPABASE_URL`、`SUPABASE_ANON_KEY`（可打包进前端，不算秘密）。

## 7. 前端改动点（按文件）

| 文件 | 改动 |
|---|---|
| `src/api/http.js` | `BASE` 可通过环境变量切换；保留 Bearer token 注入与错误抛出 |
| `src/api/auth.js` / `src/stores/auth.js` | 注册/登录/退出改为 Supabase Auth 客户端；token 取 session |
| `src/stores/works.js` | 作品列表读取：直连 `generations` 表（RLS 只读本人）或经函数返回 |
| `src/stores/wallet.js` | 余额与流水读取同上；本地兜底扣减逻辑保留为展示用 |
| `src/api/generations.js` | `createGeneration` 改为调用 `generate` 函数；单条/列表读取路径调整 |

工作流画布（`/workflow`）的节点编排、拓扑执行、localStorage 持久化属于前端本地能力，不受后端迁移影响。

## 8. 迁移步骤（分阶段、可回退）

1. **准备**：本地先接通真实模型渠道（见第 9 节），确认文案/图片能出真结果。
2. **建项目**：注册 Supabase，新建项目；执行第 3 节 DDL 与第 4 节 RLS。
3. **接认证**：前端用 supabase-js 跑通注册/登录/退出，session 可保持。
4. **迁读取**：作品列表、钱包余额/流水改为读 Supabase 表（RLS 只读本人）。
5. **写函数**：实现 `generate` 函数（扣费 + 调渠道 + 回写作品），本地用函数 URL 联调。
6. **切流量**：前端接口指向 Supabase/函数，下线 `db.json` mock 与本地 Node 后端。
7. **部署前端**：`npm run build` 产物部署到静态托管（EdgeOne / Vercel / Netlify 任选）。

每一步都可回退：切换前保留本地 mock 后端，新链路验证通过后再切。

## 9. 模型渠道接通前置

在迁 BaaS 之前，建议先在本地 `.env` 配好渠道并验证真实出文案：

```
MODEL_API_KEY=渠道密钥
MODEL_BASE_URL=https://渠道地址/v1
MODEL_CHAT_MODEL=文案模型名
MODEL_IMAGE_MODEL=文生图模型名
```

未配置时后端自动回退 mock；渠道状态通过 `GET /api/v1/channel/status` 查看（`mock` / `real`）。

## 10. 风险与注意事项

- **访问速度**：Supabase 为海外服务，免费层在国内访问可能偏慢；早期用户少可接受，若主要面向国内用户再评估国内云（通常需要主体）。
- **免费额度**：有数据库/接口调用额度与冷启动延迟，用户量上来后再评估付费档。
- **密钥安全**：模型 Key、service role key 只能在服务端/函数环境变量，严禁打包进前端或提交进仓库。
- **扣费一致性**：扣费与流水写入要在同一逻辑里完成；模型失败不得扣费。
- **不要绕过 RLS**：前端不直接写余额表，所有余额变更走服务端函数。
- **后置事项**：支付、微信登录、备案域名、运营后台等有主体或合规门槛，MVP 阶段不做。

## 11. 备选：Cloudflare Workers + D1/KV

若后续偏好边缘函数部署，可用 Cloudflare Workers 承接业务逻辑，D1 存结构化数据、KV 存缓存、R2 存图片；接口契约保持一致。上手门槛高于 Supabase（需自己写更多后端逻辑），作为备选保留。
