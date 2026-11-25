const BASE = import.meta.env.VITE_API_BASE || '/api/v1'
const TOKEN_KEY = 'ai_tools_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let resp
  try {
    resp = await fetch(`${BASE}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    })
  } catch {
    // 网络层异常（后端未启动、断网、CORS 等），包装成可读错误，避免抛裸 TypeError
    throw new Error('网络连接失败，请确认后端服务已启动后重试')
  }

  let data = null
  const text = await resp.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
  }

  if (resp.status === 401) {
    // 会话过期或未登录：清除本地令牌，避免后续请求持续带失效凭证
    setToken('')
  }

  if (!resp.ok) {
    const message = data?.message || `请求失败（${resp.status}）`
    const error = new Error(message)
    error.status = resp.status
    error.data = data
    throw error
  }
  return data
}
