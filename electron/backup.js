const fs = require('node:fs')
const path = require('node:path')
const db = require('./db')
const paths = require('./paths')
const cryptoStore = require('./crypto-store')

function exportAll(destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  const imgDir = path.join(destDir, 'images')
  fs.mkdirSync(imgDir, { recursive: true })
  const items = db.allItems().map((it) => {
    cryptoStore.unwrap(it)
    const copy = { ...it }
    if (it.image_path && fs.existsSync(it.image_path)) {
      const name = path.basename(it.image_path)
      fs.copyFileSync(it.image_path, path.join(imgDir, name))
      copy.image_file = name
    }
    if (it.thumb_path && fs.existsSync(it.thumb_path)) {
      const name = 't-' + path.basename(it.thumb_path)
      fs.copyFileSync(it.thumb_path, path.join(imgDir, name))
      copy.thumb_file = name
    }
    delete copy.image_path
    delete copy.thumb_path
    return copy
  })
  fs.writeFileSync(path.join(destDir, 'history.json'), JSON.stringify({ version: 1, items, snippets: db.snippets() }, null, 2))
  return destDir
}

function importAll(srcDir) {
  const file = path.join(srcDir, 'history.json')
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const dirs = paths.ensureDirs()
  let n = 0
  for (const it of data.items || []) {
    if (it.image_file) {
      const from = path.join(srcDir, 'images', it.image_file)
      const to = path.join(dirs.images, it.image_file)
      if (fs.existsSync(from)) fs.copyFileSync(from, to)
      it.image_path = to
    }
    if (it.thumb_file) {
      const from = path.join(srcDir, 'images', it.thumb_file)
      const name = it.thumb_file.replace(/^t-/, '')
      const to = path.join(dirs.thumbs, name)
      if (fs.existsSync(from)) fs.copyFileSync(from, to)
      it.thumb_path = to
    }
    if (db.importItem(it)) n++
  }
  for (const s of data.snippets || []) {
    db.saveSnippet({ name: s.name, shortcut: s.shortcut, body: s.body })
  }
  return n
}

function quickBackup() {
  const dir = path.join(paths.ensureDirs().backups, 'backup-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'))
  return exportAll(dir)
}

module.exports = { exportAll, importAll, quickBackup }
