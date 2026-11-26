import { request } from './http'

/**
 * 拉取模板市场数据。
 * @param {'prompt'|'workflow'|undefined} type 模板类型；缺省返回 { prompt, workflow }
 * @returns {Promise<Array|{prompt:Array, workflow:Array}>}
 */
export function fetchTemplates(type) {
  return request(`/templates${type ? `?type=${type}` : ''}`)
}
