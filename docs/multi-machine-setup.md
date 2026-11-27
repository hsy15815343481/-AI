# 双机接续教程（家里电脑为主，公司电脑偶尔用）

> 适用项目：秋挽 AI 工具箱（Vue3 + Vite 前端 / Node mock 后端）
> 远程仓库：https://github.com/hsy15815343481/-AI.git （分支 `main`）
> 最后更新：2026-11-27

## 一、三类文件怎么处理

| 类型 | 文件 | 是否进 Git/GitHub | 换机怎么办 |
|---|---|---|---|
| 源代码 | `src/`、`server/`、`scripts/`、`package.json`、`README.md` 等 | ✅ 进 | `git push` 上传，另一台 `git pull` 下载 |
| 密钥 | `.env`（DeepSeek/智谱/百炼/硅基 Key） | ❌ 被 `.gitignore` 忽略 | 每台机器各填一份，照 `.env.example` 抄 |
| 本地数据 | `server/data/db.json`（账号、作品记录） | ❌ 被忽略 | 只在本机；换机后是空库，需重新注册账号 |
| 可再生产物 | `node_modules/`、`dist/` | ❌ 被忽略 | 换机后 `npm install` 重装，`npm run build` 重建 |

一句话：**代码靠 Git 同步，Key 和本地账号数据各管各的。**

## 二、家里电脑（主力机）第一次配置

### 1. 装基础环境（只做一次）

- 安装 Node.js 18+（建议 22 LTS）：https://nodejs.org
- 打开终端（PowerShell / Git Bash）确认：

```bash
node -v
npm -v
```

### 2. 装 Git 并登录 GitHub

- 安装 Git for Windows：https://git-scm.com/download/win
- 配置身份：

```bash
git config --global user.name "hsy15815343481"
git config --global user.email "你的GitHub邮箱"
```

- 推送需要凭据。执行一次 `git push` 时按弹窗登录授权；若浏览器不弹，去 GitHub → Settings → Developer settings → Personal access tokens (classic) 生成 token（勾选 `repo`），推送时用户名填 GitHub 账号，密码粘贴 token。

### 3. 拉取代码

```bash
git clone https://github.com/hsy15815343481/-AI.git ai-tools-mvp
cd ai-tools-mvp
```

> 若 GitHub 尚未授权推送，可先用云盘备份包解压得到工程（见第五节），后续再补 Git 同步。

### 4. 填密钥 `.env`

项目根目录新建 `.env`（与 `.env.example` 同级），填入现有 Key：

```bash
DEEPSEEK_API_KEY=你的Key
ZHIPU_API_KEY=你的Key
DASHSCOPE_API_KEY=你的Key
SILICONFLOW_API_KEY=你的Key
# ARK_API_KEY=  # 火山，暂未开通，先留空
```

`.env` 不要提交到 Git。

### 5. 装依赖、启动

```bash
npm install
npm run dev:all
```

- 后端：http://localhost:8787
- 前端：http://localhost:5173

打开 5173，本地注册一个账号（空库需重新注册），能登录、能出图即配置完成。

## 三、日常在家开发的固定流程

### 开工前：先拉最新代码

```bash
git pull origin main
```

### 改完代码：提交并推送

```bash
git add .
git commit -m "写清楚这次改了什么"
git push origin main
```

### 启动开发

```bash
npm run dev:all
```

### 构建生产包（可选）

```bash
npm run build
```

产物在 `dist/index.html`（单文件，可单独预览）。

## 四、公司电脑（偶尔用）接续流程

### 第一次（还没拉过代码）

```bash
git clone https://github.com/hsy15815343481/-AI.git ai-tools-mvp
cd ai-tools-mvp
npm install
```

同样新建 `.env` 填 Key，再 `npm run dev:all`。

### 之后每次用

**开工前**：

```bash
git pull origin main
```

**用完离开前**（避免改动留在公司机器上）：

```bash
git add .
git commit -m "公司电脑上的改动说明"
git push origin main
```

没改代码只查看，不用 commit/push。

## 五、云盘备份包兜底（GitHub 未授权前用）

GitHub 推送需要授权；在完成授权前，最新工程以云盘 tar 包作为云端备份。

1. 从云盘文件夹下载 `ai-tools-mvp-source-YYYYMMDD.tar.gz`。
2. 解压到目标目录，进入 `ai-tools-mvp`。
3. `npm install` 装依赖（包里不含 `node_modules`）。
4. 新建 `.env` 填 Key。
5. `npm run dev:all` 启动。

备份包内含 `.git` 提交历史、`.env`、`db.json`、`package-lock.json` 与文档；不含 `node_modules`、`dist`、日志。

## 六、关键纪律

1. 改代码前先 `git pull`，收工前一定 `git push`。
2. 不要在两台机器上同时改同一批文件；家里是主力，公司只做临时查看或小改。
3. `.env` 永远不进 Git；换机后自己填 Key。
4. 本地账号/作品记录不同步，换机后需重新注册；等接云端数据库（BaaS）后才跨机器共享。
5. 遇到 Git 冲突（conflict），不要强行覆盖，先保留现场并求助解冲突。

## 七、速查命令表

| 场景 | 命令 |
|---|---|
| 拉取最新代码 | `git pull origin main` |
| 提交改动 | `git add .` → `git commit -m "说明"` → `git push origin main` |
| 装依赖（换机后） | `npm install` |
| 启动前后端 | `npm run dev:all` |
| 只起后端 | `npm run server` |
| 只起前端 | `npm run dev` |
| 构建生产包 | `npm run build` |
| 查看当前改动 | `git status` |
| 查看提交历史 | `git log --oneline -5` |

## 八、当前挂起的后置项

- 后端接 BaaS / 部署 Node 后端（待本地打磨满意后再做）。
- 火山控制台开通 Seedream/Seedance 后回填 Key 与 Model ID。
- 第二档（替换产品、去水印、AI 上身、万物穿戴）待决定是否接低价/试用额度。
- 第三档（精准抠图、高清放大、GIF 动图）暂无免费稳定方案，保持待接入。
