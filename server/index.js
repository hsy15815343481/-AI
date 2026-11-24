/**
 * 本地 mock 后端（零依赖，仅用 Node 内置模块）
 * 用途：在未接入真实 BaaS 前，跑通注册登录、积分扣费、作品记录的完整闭环。
 * 接口契约与计划 D6 对齐；后续迁移 Supabase / Cloudflare Workers 时保持同一套 /api/v1 路径与字段。
 *
 * 启动：node server/index.js  （默认端口 8787，与 vite proxy 对齐）
 * 数据读写：走 repository.js（本地 db.json 实现）；迁移 BaaS 时替换仓储实现即可。
 */
import http from 'node:http'
import crypto from 'node:crypto'
import './env.js'
import { generateCopywriting, generateImage, generateVideo, channelStatus } from './channels.js'
import { listChannels } from './channel-registry.js'
import { repo } from './repository.js'

const PORT = Number(process.env.PORT || 8787)
const INITIAL_CREDITS = Number(process.env.INITIAL_CREDITS || 10)

// ---- 工具定义（与前端 src/lib/constants.js 对齐）----
const TOOLS = [
  {
    slug: 'text-to-image',
    name: 'AI 绘画',
    category: '图像',
    costCredits: 2,
    description: '输入提示词，生成风格化图片。',
    fields: [
      { key: 'prompt', label: '提示词', type: 'textarea', required: true },
      { key: 'size', label: '尺寸', type: 'select', options: ['1:1', '3:4', '16:9'] }
    ]
  },
  {
    slug: 'copywriting',
    name: '文案生成',
    category: '文本',
    costCredits: 1,
    description: '根据主题生成营销 / 社交文案。',
    fields: [
      { key: 'topic', label: '主题', type: 'input', required: true },
      { key: 'tone', label: '语气', type: 'select', options: ['活泼', '正式', '种草', '简洁'] }
    ]
  },
  {
    slug: 'text-to-video',
    name: 'AI 视频',
    category: '多媒体',
    costCredits: 5,
    description: '根据提示词与参考图生成视频。',
    fields: [
      { key: 'prompt', label: '提示词', type: 'textarea', required: true },
      { key: 'duration', label: '时长(秒)', type: 'input' }
    ]
  }
]

// ---- 工具函数 ----
const hashPassword = (pw) => crypto.createHash('sha256').update(String(pw)).digest('hex')

const IMAGE_SIZES = ['1:1', '3:4', '16:9']
const VIDEO_RATIOS = ['16:9', '9:16', '1:1']

function cleanText(v) {
  return String(v || '').trim()
}

/** 清洗参考图：仅保留非空字符串并去空白 */
function cleanRefs(refs) {
  if (!Array.isArray(refs)) return []
  return refs.filter((r) => typeof r === 'string' && r.trim()).map((r) => r.trim())
}

/** 整数夹取到 [min, max]，非法值回退 fallback */
function clampInt(v, min, max, fallback) {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** 枚举白名单取值，非法回退 fallback */
function pickEnum(v, list, fallback) {
  return list.includes(v) ? v : fallback
}

function send(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve({})
      }
    })
  })
}

async function authUser(req) {
  const header = req.headers.authorization || ''
  const token = header.replace(/^Bearer\s+/i, '')
  return repo.getUserByToken(token)
}

function publicUser(u) {
  return { id: u.id, email: u.email, nickname: u.nickname }
}

// ---- 路由 ----
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const p = url.pathname
  if (req.method === 'OPTIONS') return send(res, 204, {})

  // 注册
  if (p === '/api/v1/auth/register' && req.method === 'POST') {
    const body = await readBody(req)
    const { email, nickname, password } = body
    if (!email || !nickname || !password) return send(res, 400, { message: '邮箱、昵称、密码不能为空' })
    if (await repo.findUserByEmail(email)) return send(res, 409, { message: '该邮箱已注册' })

    const user = {
      id: crypto.randomUUID(),
      email,
      nickname,
      passwordHash: hashPassword(password),
      credits: INITIAL_CREDITS,
      createdAt: new Date().toISOString()
    }
    await repo.createUser(user)

    const token = crypto.randomUUID()
    await repo.createSession(token, user.id)
    await repo.addTransaction({
      id: crypto.randomUUID(),
      userId: user.id,
      changeAmount: INITIAL_CREDITS,
      reason: '注册赠送',
      balanceAfter: user.credits,
      createdAt: user.createdAt
    })
    return send(res, 200, { token, user: publicUser(user), credits: user.credits })
  }

  // 登录
  if (p === '/api/v1/auth/login' && req.method === 'POST') {
    const body = await readBody(req)
    const { email, password } = body
    const user = await repo.findUserByEmail(email)
    if (!user || user.passwordHash !== hashPassword(password)) {
      return send(res, 401, { message: '邮箱或密码不正确' })
    }
    const token = crypto.randomUUID()
    await repo.createSession(token, user.id)
    return send(res, 200, { token, user: publicUser(user), credits: user.credits })
  }

  // 工具列表
  if (p === '/api/v1/tools' && req.method === 'GET') {
    return send(res, 200, TOOLS)
  }

  // 模型渠道状态（mock / real）
  if (p === '/api/v1/channel/status' && req.method === 'GET') {
    return send(res, 200, { mode: channelStatus() })
  }

  // 可选渠道与模型列表（不含密钥，供前端下拉选择）
  if (p === '/api/v1/channels' && req.method === 'GET') {
    return send(res, 200, listChannels())
  }

  // 以下接口需要登录
  const me = await authUser(req)
  if (!me) return send(res, 401, { message: '未登录或登录已过期' })

  // 提交生成
  if (p === '/api/v1/generations' && req.method === 'POST') {
    const body = await readBody(req)
    const tool = TOOLS.find((t) => t.slug === body.tool_slug)
    if (!tool) return send(res, 400, { message: '工具不存在或已下架' })
    if (me.credits < tool.costCredits) return send(res, 402, { message: '积分不足' })

    // 参数校验与归一化：空主题/提示词直接 400，不创建记录、不扣费；非法枚举/数值回退默认
    const raw = body.params || {}
    let params
    if (tool.slug === 'copywriting') {
      const topic = cleanText(raw.topic)
      if (!topic) return send(res, 400, { message: '缺少文案主题' })
      params = { topic, tone: cleanText(raw.tone) || '简洁' }
    } else if (tool.slug === 'text-to-image') {
      const prompt = cleanText(raw.prompt)
      if (!prompt) return send(res, 400, { message: '缺少绘画提示词' })
      params = {
        prompt,
        size: pickEnum(raw.size, IMAGE_SIZES, '1:1'),
        n: clampInt(raw.n, 1, 4, 1),
        refs: cleanRefs(raw.refs)
      }
    } else {
      const prompt = cleanText(raw.prompt)
      if (!prompt) return send(res, 400, { message: '缺少视频提示词' })
      params = {
        prompt,
        ratio: pickEnum(raw.ratio, VIDEO_RATIOS, '16:9'),
        duration: clampInt(raw.duration, 2, 30, 5),
        refs: cleanRefs(raw.refs)
      }
    }

    const gen = {
      id: crypto.randomUUID(),
      userId: me.id,
      toolSlug: tool.slug,
      params,
      status: 'success',
      resultUrl: null,
      resultText: null,
      errorMessage: null,
      channel: body.channel || '',
      model: body.model || '',
      createdAt: new Date().toISOString()
    }

    // 调用模型渠道（未配置 Key 时渠道层回退 mock）；失败不扣费
    const channelOpts = { channelId: body.channel || '', model: body.model || '' }
    try {
      if (tool.slug === 'text-to-image') {
        gen.resultUrl = await generateImage(params.prompt, {
          ...channelOpts,
          size: params.size,
          n: params.n,
          refs: params.refs
        })
      } else if (tool.slug === 'text-to-video') {
        gen.resultUrl = await generateVideo(params.prompt, {
          ...channelOpts,
          ratio: params.ratio,
          duration: params.duration,
          refs: params.refs
        })
      } else {
        gen.resultText = await generateCopywriting(params.topic, params.tone, channelOpts)
      }
    } catch (err) {
      gen.status = 'failed'
      gen.errorMessage = err.message || '模型渠道调用失败'
    }

    if (gen.status === 'success') {
      me.credits -= tool.costCredits
      await repo.saveUser(me)
      await repo.addTransaction({
        id: crypto.randomUUID(),
        userId: me.id,
        changeAmount: -tool.costCredits,
        reason: `消耗-${tool.name}`,
        balanceAfter: me.credits,
        createdAt: gen.createdAt
      })
    }
    await repo.addGeneration(gen)
    return send(res, 200, { id: gen.id, status: gen.status })
  }

  // 单条作品
  const genMatch = p.match(/^\/api\/v1\/generations\/([\w-]+)$/)
  if (genMatch && req.method === 'GET') {
    const gen = await repo.findGenerationForUser(genMatch[1], me.id)
    if (!gen) return send(res, 404, { message: '作品不存在' })
    return send(res, 200, gen)
  }

  // 我的作品
  if (p === '/api/v1/user/works' && req.method === 'GET') {
    const works = await repo.listGenerationsByUser(me.id)
    return send(res, 200, works)
  }

  // 钱包
  if (p === '/api/v1/user/wallet' && req.method === 'GET') {
    const transactions = await repo.listTransactionsByUser(me.id)
    return send(res, 200, { credits: me.credits, transactions })
  }

  return send(res, 404, { message: '接口不存在' })
})

server.listen(PORT, () => {
  console.log(`[mock-server] http://localhost:${PORT}  (initial credits=${INITIAL_CREDITS})`)
})
