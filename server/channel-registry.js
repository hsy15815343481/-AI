/**
 * 模型渠道注册表（多渠道骨架）。
 *
 * 每个渠道对应一家 OpenAI 兼容平台：
 *   id       渠道唯一标识（前端选择时回传）
 *   name     展示名
 *   kind     用途：'chat' 文案 / 'image' 文生图 / 'video' 视频
 *   baseUrl  渠道接口地址（不含末尾斜杠）
 *   models   该渠道可用模型列表，每项：
 *              model  真实模型名（调用时回传）
 *              label  产品型号别名（前端展示）
 *              desc   一句能力说明
 *              fit    适用场景标签
 *   keyEnv   读取密钥的环境变量名（密钥只在服务端环境变量，不写进代码/前端）
 *
 * 新增渠道：在 CHANNEL_DEFS 里加一条定义，再在环境变量里配对应 Key 即可，无需改动调用代码。
 */

const CHANNEL_DEFS = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    kind: 'chat',
    baseUrl: 'https://api.deepseek.com',
    models: [
      { model: 'deepseek-chat', label: '秋挽·文案模型', desc: '提炼卖点，生成营销 / 种草文案', fit: '营销文案' }
    ],
    keyEnv: 'DEEPSEEK_API_KEY'
  },
  // 预留位：OpenAI（OpenAI 兼容协议）。需可访问海外网络 + 海外支付；无 OPENAI_API_KEY 时不启用，回退 mock。
  {
    id: 'openai',
    name: 'OpenAI',
    kind: 'chat',
    baseUrl: 'https://api.openai.com',
    models: [
      { model: 'gpt-4o-mini', label: 'GPT-4o mini', desc: '轻量通用文案模型', fit: '备用文案' },
      { model: 'gpt-4o', label: 'GPT-4o', desc: '高质量通用模型', fit: '备用文案' }
    ],
    keyEnv: 'OPENAI_API_KEY'
  },
  // 国内文生图：智谱 CogView / GLM-Image（OpenAI 兼容图片协议）。无 ZHIPU_API_KEY 时回退 mock。
  {
    id: 'zhipu',
    name: '智谱 CogView',
    kind: 'image',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { model: 'cogview-4', label: '秋挽·高质稳定版', desc: '质感稳、一致性强，适合模特类高质量出图', fit: '模特 · 高质量' },
      { model: 'glm-image', label: 'GLM Image', desc: '智谱通用文生图', fit: '通用出图' },
      { model: 'cogview-3-flash', label: 'CogView 3 Flash', desc: '轻量快速出图', fit: '跑量款' }
    ],
    keyEnv: 'ZHIPU_API_KEY'
  },
  // 字节火山方舟：Seedream 图像生成（OpenAI 兼容图片协议，支持参考图编辑）。无 ARK_API_KEY 时回退 mock。
  {
    id: 'volc-seedream',
    name: '火山 Seedream',
    kind: 'image',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      { model: 'doubao-seedream-5-0-lite', label: '秋挽·通用版', desc: '改图、做商品主图能力强，上手快', fit: '主图 · 跑量款' },
      { model: 'doubao-seedream-5-0-pro', label: '秋挽·Pro 版', desc: '通用升级版，整体品质更好', fit: '高质量主图' },
      { model: 'doubao-seedream-5-5-261028', label: '秋挽·服装细节版', desc: '面料纹理细节表现好，服装鞋帽家纺适用', fit: '服装 · 面料细节' }
    ],
    keyEnv: 'ARK_API_KEY'
  },
  // 字节火山方舟：Seedance 视频生成（异步任务：创建后轮询 video_url）。无 ARK_API_KEY 时回退 mock。
  {
    id: 'volc-seedance',
    name: '火山 Seedance 视频',
    kind: 'video',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      { model: 'doubao-seedance-2-0-fast', label: '秋挽·视频快版', desc: '出片快，适合跑量商品展示视频', fit: '商品展示' },
      { model: 'doubao-seedance-2-5', label: '秋挽·视频 Pro', desc: '画质与运动表现更好，适合高质穿搭视频', fit: '高质穿搭视频' },
      { model: 'doubao-seedance-2-0', label: 'Seedance 2.0', desc: '通用视频模型', fit: '通用视频' },
      { model: 'doubao-seedance-2-0-mini', label: 'Seedance Mini', desc: '轻量视频模型', fit: '备用视频' }
    ],
    keyEnv: 'ARK_API_KEY'
  },
  // 阿里云百炼：万相 Wan3.0 视频生成（异步任务：创建后轮询 video_url）。无 DASHSCOPE_API_KEY 时回退 mock。
  {
    id: 'bailian-wanxiang',
    name: '阿里万相视频',
    kind: 'video',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    models: [
      { model: 'wan3.0-video-prime', label: '秋挽·视频稳版', desc: '稳定性强，服装上身类场景适用', fit: '穿搭视频' },
      { model: 'wan3.0-video', label: '万相 Wan3.0', desc: '通用视频模型', fit: '通用视频' }
    ],
    keyEnv: 'DASHSCOPE_API_KEY'
  }
]

function readKey(def) {
  return process.env[def.keyEnv] || ''
}

/** 前端可见的渠道列表（不含密钥）；模型附带展示元信息与渠道是否已配置密钥 */
export function listChannels(kind) {
  const defs = kind ? CHANNEL_DEFS.filter((d) => d.kind === kind) : CHANNEL_DEFS
  return defs.map((d) => {
    const available = Boolean(readKey(d))
    return {
      id: d.id,
      name: d.name,
      kind: d.kind,
      available,
      models: d.models.map((m) => ({ ...m, available }))
    }
  })
}

/** 旧版单渠道环境变量兼容（MODEL_API_KEY / MODEL_BASE_URL / MODEL_CHAT_MODEL） */
function legacyChannel() {
  const key = process.env.MODEL_API_KEY || ''
  const base = (process.env.MODEL_BASE_URL || '').replace(/\/$/, '')
  if (!key || !base) return null
  return {
    id: 'default',
    name: '默认渠道',
    kind: 'chat',
    baseUrl: base,
    apiKey: key,
    models: [{ model: process.env.MODEL_CHAT_MODEL || '', label: process.env.MODEL_CHAT_MODEL || '默认模型' }]
  }
}

/**
 * 取一个可用渠道（服务端内部使用，含 apiKey）。
 * @param {'chat'|'image'|'video'} kind 用途
 * @param {string} [channelId] 前端指定的渠道 id
 * @returns {object|null} 渠道配置；无任何已配置渠道时返回 null
 */
export function getChannel(kind, channelId) {
  if (channelId) {
    const def = CHANNEL_DEFS.find((d) => d.id === channelId && (!kind || d.kind === kind))
    if (def) return { ...def, apiKey: readKey(def) }
  }
  const configured = CHANNEL_DEFS.find((d) => (!kind || d.kind === kind) && readKey(d))
  if (configured) return { ...configured, apiKey: readKey(configured) }
  // 旧版单渠道仅兼容文案；文生图无配置时返回 null，由渠道层回退 mock
  if (kind === 'chat') return legacyChannel()
  return null
}

/** 是否存在任一已配置密钥的渠道（用于 mock / real 状态判断） */
export function hasAnyRealChannel() {
  return CHANNEL_DEFS.some((d) => readKey(d)) || Boolean(process.env.MODEL_API_KEY && process.env.MODEL_BASE_URL)
}
