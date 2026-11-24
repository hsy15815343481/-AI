import { request } from './http'

export function createGeneration(payload) {
  return request('/generations', { method: 'POST', body: payload })
}

export function fetchGeneration(id) {
  return request(`/generations/${id}`)
}

export function fetchMyWorks() {
  return request('/user/works')
}
