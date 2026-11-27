# 火山方舟 Seedream / Seedance 开通与联调清单

> 对应任务 #57。代码侧协议已按方舟官方文档校准；账号开通、模型授权、API Key 需要本人在火山控制台完成（助手无法代开通/付费）。
> 渠道定义：`server/channel-registry.js`；调用实现：`server/channels.js`；密钥只走服务端环境变量，不下发前端。

## 一、前置条件

- 注册火山引擎账号并完成实名认证（个人/企业按实际）。
- 开通「火山方舟」大模型服务平台。
- 确认账户有可用余额或后付费额度；图像/视频按张/按秒计费，先用最低额度跑通。

## 二、开通步骤

### 1. 开通模型服务
1. 进入方舟控制台 → 模型列表 / 模型广场。
2. 图像：开通 **Seedream** 系列（主图跑量选 lite/flash，高质量选 pro；服装面料细节按需选对应版本）。
3. 视频：开通 **Seedance** 系列（商品展示选 fast/mini，高质穿搭选 2.5 系列）。
4. 记录每个模型的 **Model ID**（带日期后缀，形如 `doubao-seedream-5-0-flash-260915`、`doubao-seedance-2-5-flash-261115`）；或在「在线推理」创建接入点，取 **Endpoint ID**（`ep-xxxxxxxx`）。

### 2. 获取 API Key
- 控制台 → API Key 管理 → 创建 API Key，复制保存（只展示一次）。
- 在项目根目录 `.env`（参照 `.env.example`）填入：

```
ARK_API_KEY=你的方舟API Key
```

### 3. 回填模型 ID
- 打开 `server/channel-registry.js`：
  - `volc-seedream` 的 `models[].model` 替换为第 1 步复制的图像 Model ID / Endpoint ID。
  - `volc-seedance` 的 `models[].model` 替换为视频 Model ID / Endpoint ID。
- 一个渠道下可保留多个模型，前端下拉按 `label` 展示、提交时回传真实 `model`。

## 三、代码已对齐的协议（本轮校准）

### Seedream 文生图 `POST /api/v3/images/generations`
- 尺寸：对火山渠道直接传分辨率档位 `2K` / `4K`（宽高比在提示词里描述），不再走小像素表；小像素值低于 Seedream 总像素下限会被拒。
- 参考图：`image` 字段，单张传 URL/Base64 字符串，多张传数组；不支持参考图的其他渠道不附加该字段。
- 返回：取 `data[0].url`，无 URL 时回退 `b64_json`。
- 不识别 OpenAI 的 `n` 字段；组图由模型 `sequential_image_generation` 控制，当前固定单图。

### Seedance 视频 `POST /api/v3/contents/generations/tasks`（异步）
- 创建任务 → 轮询 `GET /api/v3/contents/generations/tasks/{id}` → 状态 `succeeded` 取 `content.video_url`，`failed` 抛错。
- 入参：`content` 数组（`text` 文本项；`image_url` 参考图项，`role: reference_image`）、`ratio`、`duration`、`watermark`、`generate_audio`。
- 分辨率档位归一为小写：`480p / 720p / 1080p / 4k`（前端传大写 `P`，后端转小写）。
- 时长限制：Seedance 2.0 系列单段 2–15 秒，2.5 系列 2–30 秒；前端已做 2–30 秒夹取。

## 四、联调校验步骤

1. 启动本地闭环：`npm run dev:all`（mock 后端 8787 + vite 5173）。
2. 查看渠道状态：`GET http://localhost:8787/api/v1/channel/status`，应为 `real`（有任一已配置密钥渠道）。
3. 渠道列表：`GET /api/v1/channels`，火山两条 `available: true`。
4. 首页/工具详情页提交一次文生图，确认返回真实图片 URL（非 `data:image/svg` mock 占位）。
5. 提交一次文生视频，确认任务创建后轮询出 `video_url`，前端可播放。
6. 失败排查：401/403 多为 Key 无效或模型未授权；400 多为 Model ID 错误或参数越界；超时多为轮询间隔/任务排队。

## 五、注意事项

- **密钥安全**：`ARK_API_KEY` 只写服务端 `.env`，不打包前端、不提交仓库；`.env` 已在忽略范围内。
- **失败不扣费**：模型调用失败不写消耗流水、不扣积分（与现有路由逻辑一致）。
- **水印**：视频当前 `watermark: true`（右下角 AI 生成标识）；如需去水印按平台规则与模型授权情况调整。
- **模型下线**：方舟有模型版本下线公告，回填的 Model ID 若被下线，需在控制台换新版本 ID。
- **参考图渠道限制**：图生图/多图参考的保真效果取决于模型授权；当前参考图链路已预留，出片质量待真实渠道实测后回填到 `docs/prompt-realism-guide.md`。

## 六、本轮校准改动

- `server/channels.js`：火山图片尺寸改档位、去掉不兼容的 `n`；视频分辨率转小写。
- `server/channel-registry.js`：火山模型名标注为占位，说明开通后替换完整 Model ID / Endpoint ID。
