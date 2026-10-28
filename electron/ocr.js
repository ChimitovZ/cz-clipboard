const fs = require('node:fs')
const path = require('node:path')
const logger = require('./logger')
const db = require('./db')
const settings = require('./settings')
const paths = require('./paths')

let busy = false
const q = []

function langsReady() {
  const dir = paths.tessDir()
  return fs.existsSync(path.join(dir, 'eng.traineddata')) && fs.existsSync(path.join(dir, 'rus.traineddata'))
}

function enqueue(id, imagePath) {
  if (!settings.get().ocrEnabled) return
  if (!langsReady()) return
  q.push({ id, imagePath })
  pump()
}

async function pump() {
  if (busy) return
  const job = q.shift()
  if (!job) return
  busy = true
  try {
    const { createWorker } = require('tesseract.js')
    const worker = await createWorker('eng+rus', 1, {
      langPath: paths.tessDir(),
      cachePath: paths.tessDir(),
      gzip: false,
      logger: () => {}
    })
    const { data } = await worker.recognize(job.imagePath)
    await worker.terminate()
    const text = (data && data.text || '').trim()
    if (text) db.setOcr(job.id, text)
  } catch (e) {
    logger.warn('ocr', e)
  }
  busy = false
  pump()
}

module.exports = { enqueue, langsReady }
