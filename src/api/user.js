import { request } from './http'

export function fetchWallet() {
  return request('/user/wallet')
}
