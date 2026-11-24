import { request } from './http'

export function fetchTools() {
  return request('/tools')
}
