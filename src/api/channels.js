import { request } from './http'

/** 获取可选模型渠道与模型列表（不含密钥） */
export function fetchChannels() {
  return request('/channels')
}
