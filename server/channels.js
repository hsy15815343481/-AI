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

// 前端存比例（1:1 / 3:4 / 16:9 等），渠道请求体需像素尺寸；这里映射为两家渠道都接受的安全值
const IMAGE_SIZE_PX = {
  '1:1': '1024x1024',
  '3:4': '864x1152',
  '4:3': '1152x864',
  '16:9': '1344x768',
  '9:16': '768x1344',
  '2:3': '864x1296',
  '3:2': '1296x864',
  '21:9': '1536x640'
}
function sizeToPx(size) {
  return IMAGE_SIZE_PX[size] || IMAGE_SIZE_PX['1:1']
}

/** 取渠道默认模型名（兼容 models 为对象数组或字符串数组） */
function defaultModel(channel) {
  const first = channel?.models?.[0]
  return typeof first === 'string' ? first : first?.model || ''
}

/** 按分辨率档位放大像素（4K 相对 2K 边长翻倍；渠道不支持时由调用结果反馈，待校准） */
function pxForResolution(px, resolution) {
  if (resolution !== '4K') return px
  const [w, h] = px.split('x').map(Number)
  if (!w || !h) return px
  const scale = 2
  return `${Math.min(2048, w * scale)}x${Math.min(2048, h * scale)}`
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

  const model = opts.model || defaultModel(channel)
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

  const model = opts.model || defaultModel(channel)
  let body

  if (channel.id === 'volc-seedream') {
    // 火山 Seedream：尺寸用分辨率档位（2K/4K），宽高比在提示词里描述；
    // 不识别 OpenAI 的 n 字段，组图走 sequential_image_generation，这里固定单图。
    body = {
      model,
      prompt,
      size: opts.resolution === '4K' ? '4K' : '2K',
      response_format: 'url'
    }
    // 参考图：Seedream 支持图生图/参考图编辑，image 字段接受 URL 或 Base64（单张字符串 / 多张数组）
    if (Array.isArray(opts.refs) && opts.refs.length) {
      body.image = opts.refs.length === 1 ? opts.refs[0] : opts.refs
    }
  } else if (channel.id === 'siliconflow-image') {
    // 硅基流动：尺寸字段为 image_size（widthxheight）；响应取 images[0].url，非 OpenAI data[0]。
    body = {
      model,
      prompt,
      image_size: pxForResolution(sizeToPx(opts.size), opts.resolution)
    }
  } else {
    // 其他文生图渠道（智谱 CogView / GLM-Image 等）：用像素尺寸表；纯文生图不附加参考图字段
    body = {
      model,
      prompt,
      size: pxForResolution(sizeToPx(opts.size), opts.resolution)
    }
    if (opts.n) body.n = opts.n
  }

  const data = await postJson(channel, '/images/generations', body)
  // 兼容两种响应结构：OpenAI/智谱 data[0]，硅基 images[0]
  const firstOpenAi = data?.data?.[0]
  const firstSilicon = data?.images?.[0]
  const url = firstOpenAi?.url || firstSilicon?.url
  const b64 = firstOpenAi?.b64_json
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

  const model = opts.model || defaultModel(channel)
  const refs = Array.isArray(opts.refs) ? opts.refs.filter(Boolean) : []

  if (channel.id === 'bailian-wanxiang') {
    return generateVideoBailian(channel, model, prompt, refs, opts)
  }
  if (channel.id === 'zhipu-video') {
    return generateVideoZhipu(channel, model, prompt, refs, opts)
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
    // 方舟分辨率档位为小写：480p / 720p / 1080p / 4k
    resolution: (opts.resolution || '720P').toLowerCase(),
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
    // 百炼任务状态字段为 output.task_status（SUCCEEDED / FAILED），兼容旧版 output.status
    const status = task.output?.task_status || task.output?.status
    if (status === 'SUCCEEDED') return task.output?.video_url || ''
    if (status === 'FAILED') throw new Error(task.output?.message || '视频生成失败')
    await sleep(3000)
  }
  throw new Error('视频生成超时')
}

// 智谱视频：比例 + 分辨率 → 官方支持的像素档位。
// 实测 cogvideox-flash 仅支持 1280x720 与 1024x1024，不支持竖屏 720x1280 / 1080x1920，
// 竖屏与 1080P 档位就近回退到 flash 支持的尺寸。
const ZHIPU_VIDEO_SIZE = {
  '16:9': { '480P': '1280x720', '720P': '1280x720', '1080P': '1280x720' },
  '9:16': { '480P': '1024x1024', '720P': '1024x1024', '1080P': '1024x1024' },
  '1:1': { '480P': '1024x1024', '720P': '1024x1024', '1080P': '1024x1024' }
}
function zhipuVideoSize(ratio, resolution) {
  const row = ZHIPU_VIDEO_SIZE[ratio] || ZHIPU_VIDEO_SIZE['16:9']
  return row[resolution] || row['720P'] || '1280x720'
}

/** 智谱 CogVideoX：创建异步任务后轮询 video_result[0].url */
async function generateVideoZhipu(channel, model, prompt, refs, opts) {
  // 官方时长仅支持 5 / 10 秒；前端传入 2–30 秒，就近归一
  const duration = opts.duration && opts.duration > 5 ? 10 : 5
  const body = {
    model,
    prompt,
    quality: 'speed',
    with_audio: false,
    size: zhipuVideoSize(opts.ratio, opts.resolution),
    fps: 30,
    duration
  }
  // 参考图：智谱 image_url 支持单张字符串或多张数组
  if (refs.length) body.image_url = refs.length === 1 ? refs[0] : refs

  const create = await postJson(channel, '/videos/generations', body)
  const taskId = create.id
  if (!taskId) throw new Error('视频任务创建失败：未返回任务 ID')

  for (let i = 0; i < 40; i++) {
    const task = await getJson(channel, `/async-result/${taskId}`)
    const status = task.task_status
    if (status === 'SUCCESS') return task.video_result?.[0]?.url || ''
    if (status === 'FAIL') throw new Error(task.error?.message || '视频生成失败')
    await sleep(3000)
  }
  throw new Error('视频生成超时')
}

export function channelStatus() {
  return hasAnyRealChannel() ? 'real' : 'mock'
}
