# 秋挽AI 接续教程：从云主机到家里电脑（含 GitHub 同步配置）

> 项目：Vue3 + Vite 前端 / Node 内置 http mock 后端
> 远程仓库：https://github.com/hsy15815343481/-AI.git （分支 `main`）
> 最后更新：2026-11-27

## 0. 现状先讲清楚

- 代码目前在**云主机**上打磨，本地有 3 个提交还没推到 GitHub：
  - `fffee65` 硅基文案渠道 + 百炼视频轮询修复
  - `d36c6ea` 第一档 6 个免费功能放开
  - `fd73a2e` 双机教程与文档归档
- GitHub 远端停在更早的 `695fc06`；云主机这台环境没有存 GitHub 推送凭据，所以暂时推不上去。
- 解决路径：**在家里自己电脑上完成一次 Git 授权，把本地这版工程接续到仓库并推送**；之后家里为主、公司偶尔用，日常靠 `pull / push` 同步。

## 1. 三类文件怎么处理

| 类型 | 文件 | 是否进 Git/GitHub | 换机怎么办 |
|---|---|---|---|
| 源代码 | `src/`、`server/`、`scripts/`、`package.json`、`README.md`、`docs/` | ✅ 进 | `git push` 上传，另一台 `git pull` 下载 |
| 密钥 | `.env`（DeepSeek/智谱/百炼/硅基 Key） | ❌ 被 `.gitignore` 忽略 | 每台机器各填一份，照 `.env.example` 抄 |
| 本地数据 | `server/data/db.json`（账号、作品记录） | ❌ 被忽略 | 只在本机；换机后是空库，需重新注册账号 |
| 可再生产物 | `node_modules/`、`dist/` | ❌ 被忽略 | 换机后 `npm install` 重装，`npm run build` 重建 |

一句话：**代码靠 Git 同步，Key 和本地账号数据各管各的。**

## 2. 第一步：家里电脑装环境（只做一次）

### 2.1 装 Node.js 18+（建议 22 LTS）

下载安装：https://nodejs.org ，一路下一步。
打开终端（Windows 用 **PowerShell** 或 **Git Bash**）确认：

```bash
node -v
npm -v
```

能打印版本号即可。

### 2.2 装 Git

下载安装 Git for Windows：https://git-scm.com/download/win ，默认选项即可。

### 2.3 配置 Git 身份

```bash
git config --global user.name "hsy15815343481"
git config --global user.email "你的GitHub邮箱"
```

> 邮箱填你 GitHub 账号注册邮箱；用户名用 `hsy15815343481`，和仓库归属一致。

## 3. 第二步：把工程弄到家里电脑

因为远端仓库落后于云主机最新版，**不要直接 `git clone` 远端**（会拿到旧代码）。用云盘最新备份包接续：

1. 打开云盘文件夹：https://my.feishu.cn/drive/folder/FzUtfkov4lRTgGdd2ercv7nKnsc
2. 下载最新包 `ai-tools-mvp-source-20261127-v2.tar.gz`。
3. 解压到你想放项目的目录，例如 `D:\code\`，解压后得到 `ai-tools-mvp` 文件夹。
4. 进入目录：

```bash
cd D:/code/ai-tools-mvp
```

> 包里已经带 `.git` 提交历史（含上面 3 个待推送提交），也带 `.env`、`db.json`、`package-lock.json` 和文档；不含 `node_modules`、`dist`。

## 4. 第三步：填密钥 `.env`

包里的 `.env` 已带现有免费渠道 Key，先核对是否齐全；若缺失，在项目根目录新建/编辑 `.env`（与 `.env.example` 同级）：

```bash
DEEPSEEK_API_KEY=你的Key
ZHIPU_API_KEY=你的Key
DASHSCOPE_API_KEY=你的Key
SILICONFLOW_API_KEY=你的Key
# ARK_API_KEY=  # 火山，暂未开通，先留空
```

`.env` 永远不要提交到 Git。

## 5. 第四步：装依赖并本地跑通

```bash
npm install
npm run dev:all
```

- 后端：http://localhost:8787
- 前端：http://localhost:5173

浏览器打开 5173，本地注册一个账号（空库需重新注册），能登录、能出图即环境就绪。

## 6. 第五步：关联 GitHub 并完成首次推送

### 6.1 确认远程地址

```bash
git remote -v
```

应显示：

```
origin  https://github.com/hsy15815343481/-AI.git
```

若没有 `origin`，手动添加：

```bash
git remote add origin https://github.com/hsy15815343481/-AI.git
```

### 6.2 先同步远端历史（避免冲突）

```bash
git fetch origin
```

### 6.3 推送本地领先提交

```bash
git push -u origin main
```

- 首次推送会弹出浏览器，**用你已登录的同一个 GitHub 账号**点授权（Authorize）；凭据会被本机记住，后续不用再登。
- 若浏览器不弹、要求输入用户名密码：用户名填 `hsy15815343481`，密码处粘贴 GitHub Personal Access Token（勾选 `repo` 权限），不是登录密码。

### 6.4 推送成功后核对

```bash
git status -sb
```

显示 `## main...origin/main`（没有 ahead/behind）即同步完成。

> 若推送报冲突或被拒，**不要强行 force push**，把终端提示原文发出来，先解冲突再推。

## 7. 之后日常在家开发的固定流程

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

### 构建生产包（可选，产出单文件 dist/index.html）

```bash
npm run build
```

## 8. 公司电脑（偶尔用）接续流程

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

## 9. 关键纪律

1. 改代码前先 `git pull`，收工前一定 `git push`。
2. 不要在两台机器上同时改同一批文件；家里是主力，公司只做临时查看或小改。
3. `.env` 永远不进 Git；换机后自己填 Key。
4. 本地账号/作品记录不同步，换机后需重新注册；等接云端数据库（BaaS）后才跨机器共享。
5. 遇到 Git 冲突（conflict），不要强行覆盖，先保留现场并求助解冲突。

## 10. 速查命令表

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

## 11. 当前挂起的后置项

- 后端接 BaaS / 部署 Node 后端（待本地打磨满意后再做）。
- 火山控制台开通 Seedream/Seedance 后回填 Key 与 Model ID。
- 第二档（替换产品、去水印、AI 上身、万物穿戴）待决定是否接低价/试用额度。
- 第三档（精准抠图、高清放大、GIF 动图）暂无免费稳定方案，保持待接入。
