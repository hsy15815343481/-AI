/**
 * 模型渠道注册表（多渠道骨架）。
 *
 * 每个渠道对应一家 OpenAI 兼容平台：
 *   id       渠道唯一标识（前端选择时回传）
 *   name     展示名
 *   kind     用途：'chat' 文案 / 'image' 文生图
 *   baseUrl  渠道接口地址（不含末尾斜杠）
 *   models   该渠道可用模型名列表
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
    models: ['deepseek-chat'],
    keyEnv: 'DEEPSEEK_API_KEY'
  },
  // 预留位：OpenAI（OpenAI 兼容协议）。需可访问海外网络 + 海外支付；无 OPENAI_API_KEY 时不启用，回退 mock。
  {
    id: 'openai',
    name: 'OpenAI',
    kind: 'chat',
    baseUrl: 'https://api.openai.com',
    models: ['gpt-4o-mini', 'gpt-4o'],
    keyEnv: 'OPENAI_API_KEY'
  },
  // 国内文生图：智谱 CogView / GLM-Image（OpenAI 兼容图片协议）。无 ZHIPU_API_KEY 时回退 mock。
  {
    id: 'zhipu',
    name: '智谱 CogView',
    kind: 'image',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-image', 'cogview-4', 'cogview-3-flash'],
    keyEnv: 'ZHIPU_API_KEY'
  },
  // 字节火山方舟：Seedream 图像生成（OpenAI 兼容图片协议，支持参考图编辑）。无 ARK_API_KEY 时回退 mock。
  {
    id: 'volc-seedream',
    name: '火山 Seedream',
    kind: 'image',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-seedream-5-5-261028', 'doubao-seedream-5-0-pro', 'doubao-seedream-5-0-lite'],
    keyEnv: 'ARK_API_KEY'
  },
  // 字节火山方舟：Seedance 视频生成（异步任务：创建后轮询 video_url）。无 ARK_API_KEY 时回退 mock。
  {
    id: 'volc-seedance',
    name: '火山 Seedance 视频',
    kind: 'video',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-seedance-2-0-mini', 'doubao-seedance-2-0-fast', 'doubao-seedance-2-0', 'doubao-seedance-2-5'],
    keyEnv: 'ARK_API_KEY'
  },
  // 阿里云百炼：万相 Wan3.0 视频生成（异步任务：创建后轮询 video_url）。无 DASHSCOPE_API_KEY 时回退 mock。
  {
    id: 'bailian-wanxiang',
    name: '阿里万相视频',
    kind: 'video',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    models: ['wan3.0-video', 'wan3.0-video-prime'],
    keyEnv: 'DASHSCOPE_API_KEY'
  }
]

function readKey(def) {
  return process.env[def.keyEnv] || ''
}

/** 前端可见的渠道列表（不含密钥） */
export function listChannels(kind) {
  const defs = kind ? CHANNEL_DEFS.filter((d) => d.kind === kind) : CHANNEL_DEFS
  return defs.map((d) => ({ id: d.id, name: d.name, kind: d.kind, models: d.models }))
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
    models: [process.env.MODEL_CHAT_MODEL || ''].filter(Boolean)
  }
}

/**
 * 取一个可用渠道（服务端内部使用，含 apiKey）。
 * @param {'chat'|'image'} kind 用途
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
