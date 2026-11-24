/**
 * 本地并发启动：mock 后端（8787）+ Vite 前端（5173）。
 * 退出任一进程时一并关闭另一个。
 */
import { spawn } from 'node:child_process'

const procs = []

function run(command, args, label) {
  const p = spawn(command, args, { stdio: 'inherit', shell: true })
  p.label = label
  procs.push(p)
  p.on('exit', () => shutdown())
  return p
}

function shutdown() {
  for (const p of procs) {
    if (!p.killed) p.kill()
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

run('node', ['server/index.js'], 'mock-server')
run('npm', ['run', 'dev'], 'vite')
