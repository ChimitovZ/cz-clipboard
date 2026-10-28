const { clipboard, nativeImage } = require('electron')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const db = require('./db')
const logger = require('./logger')
const settings = require('./settings')
const { detect } = require('./detect')
const privacy = require('./privacy')
const win32 = require('./win32')
const cryptoStore = require('./crypto-store')
const ocr = require('./ocr')
const paths = require('./paths')

let timer = null
let lastHash = ''
let lastSource = null
let paused = false
let onChange = () => {}
let running = false

function sha(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

function readFiles() {
  for (const name of ['FileNameW', 'FileName', 'text/uri-list']) {
    try {
      const buf = clipboard.readBuffer(name)
      if (!buf || buf.length < 4) continue
      if (name === 'text/uri-list') {
        return buf.toString('utf8').split(/\r?\n/).map((s) => s.replace(/^file:\/\//i, '')).filter((s) => s && !s.startsWith('#'))
      }
      const str = buf.toString('ucs2').replace(/\0+$/, '')
      const parts = str.split('\0').filter(Boolean)
      if (parts.length) return parts
    } catch {}
  }
  return []
}

function tooBig(n) {
  return n > (settings.get().maxItemBytes || 20 * 1024 * 1024)
}

function enforceStoreLimit() {
  const max = settings.get().maxStoreBytes
  if (!max) return
  let size = db.storeBytes()
  while (size > max) {
    const old = db.oldestUnpinned()
    if (!old.length) break
    for (const it of old) {
      dropFiles(it)
      db.remove(it.id)
      size -= it.size_bytes || 0
      if (size <= max) break
    }
  }
}

function dropFiles(it) {
  for (const p of [it.image_path, it.thumb_path]) {
    if (p) try { fs.unlinkSync(p) } catch {}
  }
}

async function capture() {
  if (paused || settings.get().paused) return
  let formats
  try { formats = clipboard.availableFormats() } catch (e) {
    logger.debug('clipboard busy')
    return
  }
  if (!formats || !formats.length) return
  if (privacy.formatsSayIgnore()) return

  let type = 'text'
  let text = ''
  let html = ''
  let rtf = ''
  let imagePath = null
  let thumbPath = null
  let imageW = 0
  let imageH = 0
  let filesJson = null
  let size = 0
  let hashInput = ''

  try {
    const files = readFiles()
    try { text = clipboard.readText() || '' } catch { text = '' }
    try { html = clipboard.readHTML() || '' } catch { html = '' }
    try { rtf = clipboard.readRTF() || '' } catch { rtf = '' }
    const img = formats.some((f) => /image|png|bmp|dib/i.test(f)) ? clipboard.readImage() : nativeImage.createEmpty()
    const hasText = !!(text.trim() || (html && html.length > 20))
    if (files.length) {
      type = 'files'
      filesJson = JSON.stringify(files)
      text = files.join('\n')
      hashInput = 'files:' + filesJson
    } else if (!img.isEmpty() && !hasText) {
      type = 'image'
      const png = img.toPNG()
      size = png.length
      if (tooBig(size)) return
      hashInput = 'image:' + sha(png)
      const ih = sha(png)
      const dirs = paths.ensureDirs()
      imagePath = path.join(dirs.images, ih + '.png')
      thumbPath = path.join(dirs.thumbs, ih + '.png')
      if (!fs.existsSync(imagePath)) fs.writeFileSync(imagePath, png)
      const sz = img.getSize()
      imageW = sz.width
      imageH = sz.height
      if (!fs.existsSync(thumbPath)) {
        const thumb = img.resize({ height: 48, quality: 'better' })
        fs.writeFileSync(thumbPath, thumb.toPNG())
      }
    } else {
      if (!text && !html && !rtf) return
      if (html && html.length > 20 && /<[a-z]/i.test(html) && html !== text) type = 'html'
      size = Buffer.byteLength(text || '') + Buffer.byteLength(html || '') + Buffer.byteLength(rtf || '')
      if (tooBig(size)) return
      if (privacy.skipText(text)) return
      hashInput = type + ':' + sha(Buffer.from(rtf + '\n' + html + '\n' + text))
    }
  } catch (e) {
    logger.warn('capture read', e)
    return
  }

  const hash = sha(Buffer.from(hashInput))
  if (hash === lastHash) return
  lastHash = hash

  try {
    const fg = await win32.foreground()
    if (fg && fg.app && !['electron', 'cz clipboard'].includes(fg.app.toLowerCase())) lastSource = fg
  } catch {}
  const src = lastSource
  if (src && privacy.blockedApp(src.app)) return

  const detected = detect(text)
  const wrapped = cryptoStore.wrap(text)
  const htmlW = cryptoStore.wrap(html)
  const rtfW = cryptoStore.wrap(rtf)
  const item = {
    type,
    hash,
    text: wrapped.value,
    html: htmlW.value,
    rtf: rtfW.value,
    image_path: imagePath,
    thumb_path: thumbPath,
    image_w: imageW,
    image_h: imageH,
    files_json: filesJson,
    app_name: src && src.app || '',
    window_title: src && src.title || '',
    detected,
    char_count: (text || '').length,
    size_bytes: size || (imagePath && fs.statSync(imagePath).size) || 0,
    encrypted: wrapped.encrypted
  }
  try {
    const res = db.upsertByHash(item)
    if (!res.bumped && type === 'image' && imagePath) ocr.enqueue(res.id, imagePath)
    enforceStoreLimit()
    onChange()
  } catch (e) {
    logger.error('db upsert', e)
  }
}

async function poll() {
  if (running) return
  running = true
  try { await capture() } finally { running = false }
}

function start(cb) {
  onChange = cb || (() => {})
  paused = settings.get().paused
  stop()
  const ms = Math.min(800, Math.max(300, settings.get().pollMs || 400))
  timer = setInterval(poll, ms)
  poll()
}

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

function setPaused(v) {
  paused = v
  settings.set({ paused: v })
}

function isPaused() {
  return paused || settings.get().paused
}

function rememberSource(fg) {
  if (fg) lastSource = fg
}

module.exports = { start, stop, setPaused, isPaused, rememberSource, dropFiles }
