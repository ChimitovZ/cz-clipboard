const fs = require('node:fs')
const path = require('node:path')

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 }
let dir = null
let level = 'info'

function init(logsDir, logLevel = 'info') {
  dir = logsDir
  level = logLevel
}

function fileName() {
  const d = new Date().toISOString().slice(0, 10)
  return path.join(dir, `app-${d}.log`)
}

function rotate() {
  if (!dir) return
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('app-') && f.endsWith('.log')).sort()
  while (files.length > 7) {
    const f = files.shift()
    try { fs.unlinkSync(path.join(dir, f)) } catch {}
  }
}

function write(lvl, msg, extra) {
  if (LEVELS[lvl] > LEVELS[level]) return
  const line = `${new Date().toISOString()} [${lvl}] ${msg}${extra ? ' ' + extra : ''}\n`
  try {
    if (dir) fs.appendFileSync(fileName(), line)
  } catch {}
  if (lvl === 'error') console.error(msg, extra || '')
}

function setLevel(l) {
  if (LEVELS[l] != null) level = l
}

module.exports = {
  init,
  rotate,
  setLevel,
  error: (m, e) => write('error', m, e && (e.stack || String(e))),
  warn: (m, e) => write('warn', m, e && String(e)),
  info: (m) => write('info', m),
  debug: (m) => write('debug', m)
}
