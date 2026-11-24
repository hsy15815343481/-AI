/**
 * 数据访问层（Repository）。
 *
 * 本地演示实现基于 server/data/db.json；所有方法均为异步签名，
 * 将来迁移 Supabase / 其他 BaaS 时，只需新写一个实现同样方法名的仓储，
 * 路由层（index.js）无需改动。
 *
 * 数据模型与现有 db.json 保持一致：
 *   users        用户（含 credits、passwordHash）
 *   generations  作品记录
 *   transactions 积分流水
 *   sessions     令牌 -> userId 的映射（本地演示用；BaaS 后由平台 Auth 替代）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

function freshDb() {
  return { users: [], generations: [], sessions: {}, transactions: [] }
}

function loadDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_FILE)) {
    const fresh = freshDb()
    fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2))
    return fresh
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
  } catch {
    return freshDb()
  }
}

let db = loadDb()

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

export const repo = {
  // ---- 用户 ----
  async findUserByEmail(email) {
    return db.users.find((u) => u.email === email) || null
  },

  async findUserById(id) {
    return db.users.find((u) => u.id === id) || null
  },

  async createUser(input) {
    const user = { ...input }
    db.users.push(user)
    saveDb()
    return user
  },

  /** 持久化用户字段变更（如扣费后更新 credits） */
  async saveUser(user) {
    const i = db.users.findIndex((u) => u.id === user.id)
    if (i >= 0) {
      db.users[i] = user
      saveDb()
    }
  },

  // ---- 会话（本地演示；BaaS 后由平台 Auth 令牌替代）----
  async createSession(token, userId) {
    db.sessions[token] = userId
    saveDb()
  },

  async getUserByToken(token) {
    if (!token) return null
    const userId = db.sessions[token]
    return userId ? db.users.find((u) => u.id === userId) || null : null
  },

  // ---- 积分流水 ----
  async addTransaction(tx) {
    db.transactions.push(tx)
    saveDb()
  },

  async listTransactionsByUser(userId) {
    return db.transactions.filter((t) => t.userId === userId).reverse()
  },

  // ---- 作品 ----
  async addGeneration(gen) {
    db.generations.push(gen)
    saveDb()
  },

  async listGenerationsByUser(userId) {
    return db.generations.filter((g) => g.userId === userId).reverse()
  },

  async findGenerationForUser(id, userId) {
    return db.generations.find((g) => g.id === id && g.userId === userId) || null
  }
}
