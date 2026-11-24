/**
 * 模型渠道适配层（多渠道）。
 *
 * - 支持多家 OpenAI 兼容渠道；渠道定义见 channel-registry.js。
 * - 调用时可通过 opts.channelId / opts.model 指定渠道与模型；未指定则回退默认渠道。
 * - 任何渠道都未配置密钥时，回退本地 mock；模型调用失败由路由层标记 failed 且不扣费。
 *
 * 注意：密钥只存在服务端环境变量，不下发到前端。
 */
import { getChannel, hasAnyRealChannel } from './channel-registry.js'

function escapeXml(s) {
  return String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))
}

function mockImage(prompt) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#0ea5e9"/>` +
    `</linearGradient></defs>` +
    `<rect width="640" height="640" fill="url(#g)"/>` +
    `<text x="50%" y="50%" fill="#fff" font-size="22" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">` +
    `${escapeXml(prompt || 'AI 绘画结果')}</text></svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

function mockCopywriting(topic, tone) {
  return `【${topic || '未命名主题'} · ${tone || '简洁'}风格】\n` +
    `这是一条 mock 文案示例。接入真实大模型后，这里会返回根据主题生成的营销/社交文案。\n` +
    `卖点突出、语气贴合目标人群，可直接复制使用。`
}

async function postJson(channel, path, body, extraHeaders = {}) {
  const resp = await fetch(`${channel.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channel.apiKey}`,
      ...extraHeaders
    },
    body: JSON.stringify(body)
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`渠道请求失败（${resp.status}）：${text.slice(0, 120)}`)
  }
  return resp.json()
}

async function getJson(channel, path) {
  const resp = await fetch(`${channel.baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${channel.apiKey}` }
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`渠道请求失败（${resp.status}）：${text.slice(0, 120)}`)
  }
  return resp.json()
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 前端存比例（1:1 / 3:4 / 16:9），渠道请求体需像素尺寸；这里映射为两家渠道都接受的安全值
const IMAGE_SIZE_PX = {
  '1:1': '1024x1024',
  '3:4': '864x1152',
  '16:9': '1344x768'
}
function sizeToPx(size) {
  return IMAGE_SIZE_PX[size] || '1024x1024'
}

/**
 * 生成文案；返回纯文本。
 * @param {string} topic 主题
 * @param {string} tone 语气
 * @param {{channelId?:string, model?:string}} [opts]
 */
export async function generateCopywriting(topic, tone, opts = {}) {
  const channel = getChannel('chat', opts.channelId)
  if (!channel || !channel.apiKey) return mockCopywriting(topic, tone)

  const model = opts.model || channel.models[0]
  const prompt = `请围绕主题「${topic}」写一段${tone || '简洁'}风格的社交/营销文案，控制在 120 字以内。`
  const data = await postJson(channel, '/chat/completions', {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8
  })
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('渠道未返回文案内容')
  return text.trim()
}

/**
 * 生成图片；返回图片 URL 或 dataURI。
 * @param {string} prompt 提示词
 * @param {{channelId?:string, model?:string, size?:string, n?:number, refs?:string[]}} [opts]
 *   refs 为参考图数组（图生图预留）；当前已接通渠道若不支持参考图，将安全忽略，不进入请求体。
 */
export async function generateImage(prompt, opts = {}) {
  const channel = getChannel('image', opts.channelId)
  // 未配置图片渠道/模型时回退 mock（如仅接了 DeepSeek 文案渠道，其不提供文生图）
  if (!channel || !channel.apiKey) return mockImage(prompt)

  const model = opts.model || channel.models[0]
  const body = {
    model,
    prompt,
    size: sizeToPx(opts.size)
  }
  if (opts.n) body.n = opts.n
  // 参考图预留：当前已接通渠道（智谱 CogView / GLM-Image）为纯文生图，不接受参考图字段。
  // 待接入支持图生图 / 多图参考的渠道后，再在此按渠道协议附加 refs。
  if (Array.isArray(opts.refs) && opts.refs.length) {
    // 参考图：仅 Seedream 支持图生图/参考图编辑，按其 OpenAI 兼容协议附加 image 字段；
    // 智谱等纯文生图渠道不接受该字段，安全忽略。
    if (channel.id === 'volc-seedream') {
      body.image = opts.refs.length === 1 ? opts.refs[0] : opts.refs
    }
  }
  const data = await postJson(channel, '/images/generations', body)
  const url = data?.data?.[0]?.url
  const b64 = data?.data?.[0]?.b64_json
  if (url) return url
  if (b64) return `data:image/png;base64,${b64}`
  throw new Error('渠道未返回图片')
}

function mockVideo(prompt) {
  // 无 Key 时的本地占位：前端识别 mock:// 前缀显示占位，不实际播放
  return 'mock://video'
}

/**
 * 生成视频；返回视频 URL（异步任务：提交后轮询结果）。
 * @param {string} prompt 提示词
 * @param {{channelId?:string, model?:string, ratio?:string, duration?:number, resolution?:string, refs?:string[]}} [opts]
 */
export async function generateVideo(prompt, opts = {}) {
  const channel = getChannel('video', opts.channelId)
  // 未配置视频渠道时回退 mock（不产生真实调用费用）
  if (!channel || !channel.apiKey) return mockVideo(prompt)

  const model = opts.model || channel.models[0]
  const refs = Array.isArray(opts.refs) ? opts.refs.filter(Boolean) : []

  if (channel.id === 'bailian-wanxiang') {
    return generateVideoBailian(channel, model, prompt, refs, opts)
  }
  return generateVideoVolc(channel, model, prompt, refs, opts)
}

/** 火山方舟 Seedance：创建任务后轮询 video_url */
async function generateVideoVolc(channel, model, prompt, refs, opts) {
  const create = await postJson(channel, '/contents/generations/tasks', {
    model,
    content: [
      { type: 'text', text: prompt },
      ...refs.map((url) => ({ type: 'image_url', image_url: { url }, role: 'reference_image' }))
    ],
    generate_audio: true,
    ratio: opts.ratio || '16:9',
    duration: opts.duration || 5,
    watermark: true
  })
  const taskId = create.id
  if (!taskId) throw new Error('视频任务创建失败：未返回任务 ID')
  for (let i = 0; i < 30; i++) {
    const task = await getJson(channel, `/contents/generations/tasks/${taskId}`)
    if (task.status === 'succeeded') return task.content?.video_url || ''
    if (task.status === 'failed') throw new Error(task.error?.message || '视频生成失败')
    await sleep(3000)
  }
  throw new Error('视频生成超时')
}

/** 阿里云百炼万相：提交异步任务后轮询 video_url */
async function generateVideoBailian(channel, model, prompt, refs, opts) {
  const create = await postJson(
    channel,
    '/services/aigc/video-generation/video-synthesis',
    {
      model,
      input: { prompt, ...(refs.length ? { ref_images: refs } : {}) },
      parameters: {
        resolution: opts.resolution || '480P',
        ratio: opts.ratio || '16:9',
        duration: opts.duration || 5
      }
    },
    { 'X-DashScope-Async': 'enable' }
  )
  const taskId = create.output?.task_id
  if (!taskId) throw new Error('视频任务创建失败：未返回 task_id')
  for (let i = 0; i < 30; i++) {
    const task = await getJson(channel, `/tasks/${taskId}`)
    const status = task.output?.status
    if (status === 'SUCCEEDED') return task.output?.video_url || ''
    if (status === 'FAILED') throw new Error(task.output?.message || '视频生成失败')
    await sleep(3000)
  }
  throw new Error('视频生成超时')
}

export function channelStatus() {
  return hasAnyRealChannel() ? 'real' : 'mock'
}
