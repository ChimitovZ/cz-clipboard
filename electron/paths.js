const { app } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

function userDir() {
  return app.getPath('userData')
}

function ensureDirs() {
  const images = path.join(userDir(), 'images')
  const thumbs = path.join(userDir(), 'thumbs')
  const logs = path.join(userDir(), 'logs')
  const backups = path.join(userDir(), 'backups')
  for (const d of [images, thumbs, logs, backups]) fs.mkdirSync(d, { recursive: true })
  return { images, thumbs, logs, backups, db: path.join(userDir(), 'history.db'), settings: path.join(userDir(), 'settings.json') }
}

function tessDir() {
  const bundled = app.isPackaged
    ? path.join(process.resourcesPath, 'tessdata')
    : path.join(app.getAppPath(), 'tessdata')
  const user = path.join(userDir(), 'tessdata')
  if (fs.existsSync(path.join(user, 'eng.traineddata'))) return user
  return bundled
}

module.exports = { userDir, ensureDirs, tessDir }
