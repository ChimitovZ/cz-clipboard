const { execFile } = require('node:child_process')
const path = require('node:path')

const ps = path.join(__dirname, 'scripts', 'win32.ps1')

function run(args, timeout = 4000) {
  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', ps, ...args],
      { windowsHide: true, timeout },
      (err, stdout) => {
        if (err) return resolve({ ok: false, error: String(err), stdout: String(stdout || '') })
        resolve({ ok: true, stdout: String(stdout || '').trim() })
      }
    )
  })
}

async function foreground() {
  const r = await run(['fg'])
  if (!r.ok || !r.stdout) return null
  try { return JSON.parse(r.stdout) } catch { return null }
}

async function focusHwnd(hwnd) {
  if (!hwnd) return
  await run(['focus', String(hwnd)])
}

async function sendPaste() {
  await run(['paste'])
}

module.exports = { foreground, focusHwnd, sendPaste }
