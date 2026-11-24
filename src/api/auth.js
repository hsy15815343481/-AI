import { request, setToken } from './http'

export async function register(payload) {
  const data = await request('/auth/register', { method: 'POST', body: payload })
  if (data?.token) setToken(data.token)
  return data
}

export async function login(payload) {
  const data = await request('/auth/login', { method: 'POST', body: payload })
  if (data?.token) setToken(data.token)
  return data
}

export function logout() {
  setToken('')
}
