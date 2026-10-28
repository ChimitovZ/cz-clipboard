const Database = require('better-sqlite3')
const logger = require('./logger')

let db

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
   CREATE TABLE IF NOT EXISTS items (
     id INTEGER PRIMARY KEY,
     type TEXT NOT NULL,
     hash TEXT NOT NULL UNIQUE,
     text TEXT,
     html TEXT,
     rtf TEXT,
     ocr_text TEXT,
     image_path TEXT,
     thumb_path TEXT,
     image_w INTEGER,
     image_h INTEGER,
     files_json TEXT,
     app_name TEXT,
     window_title TEXT,
     detected TEXT,
     char_count INTEGER DEFAULT 0,
     size_bytes INTEGER DEFAULT 0,
     pinned INTEGER DEFAULT 0,
     favorite INTEGER DEFAULT 0,
     encrypted INTEGER DEFAULT 0,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL
   );
   CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL);
   CREATE TABLE IF NOT EXISTS item_tags (item_id INTEGER NOT NULL, tag_id INTEGER NOT NULL, PRIMARY KEY (item_id, tag_id));
   CREATE TABLE IF NOT EXISTS snippets (
     id INTEGER PRIMARY KEY,
     name TEXT NOT NULL,
     shortcut TEXT,
     body TEXT NOT NULL,
     created_at INTEGER NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_items_updated ON items(updated_at DESC);
   CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
   CREATE INDEX IF NOT EXISTS idx_items_pinned ON items(pinned);
   CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(text, ocr, tags, app, content='');
  `
]

function open(file) {
  db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate()
  return db
}

function migrate() {
  db.exec(MIGRATIONS[0])
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get('schema')
  const v = row ? +row.value : 0
  if (v < 1) db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('schema', '1')
}

function ftsSync(id, item, tagStr) {
  db.prepare('DELETE FROM items_fts WHERE rowid = ?').run(id)
  db.prepare('INSERT INTO items_fts (rowid, text, ocr, tags, app) VALUES (?, ?, ?, ?, ?)').run(
    id,
    item.text || '',
    item.ocr_text || '',
    tagStr || '',
    item.app_name || ''
  )
}

function tagsOf(id) {
  return db.prepare(
    `SELECT t.name FROM tags t JOIN item_tags it ON it.tag_id = t.id WHERE it.item_id = ? ORDER BY t.name`
  ).all(id).map((r) => r.name)
}

function upsertByHash(item) {
  const now = Date.now()
  const existing = db.prepare('SELECT id FROM items WHERE hash = ?').get(item.hash)
  if (existing) {
    db.prepare('UPDATE items SET updated_at = ?, app_name = COALESCE(?, app_name), window_title = COALESCE(?, window_title) WHERE id = ?')
      .run(now, item.app_name || null, item.window_title || null, existing.id)
    return { id: existing.id, bumped: true }
  }
  const info = db.prepare(
    `INSERT INTO items (type, hash, text, html, rtf, ocr_text, image_path, thumb_path, image_w, image_h, files_json, app_name, window_title, detected, char_count, size_bytes, encrypted, created_at, updated_at)
     VALUES (@type, @hash, @text, @html, @rtf, @ocr_text, @image_path, @thumb_path, @image_w, @image_h, @files_json, @app_name, @window_title, @detected, @char_count, @size_bytes, @encrypted, @created_at, @updated_at)`
  ).run({
    ...item,
    ocr_text: item.ocr_text || null,
    html: item.html || null,
    rtf: item.rtf || null,
    image_path: item.image_path || null,
    thumb_path: item.thumb_path || null,
    image_w: item.image_w || null,
    image_h: item.image_h || null,
    files_json: item.files_json || null,
    encrypted: item.encrypted ? 1 : 0,
    created_at: now,
    updated_at: now
  })
  ftsSync(info.lastInsertRowid, item, '')
  return { id: info.lastInsertRowid, bumped: false }
}

function list({ query, filter, app, offset = 0, limit = 80 }) {
  const where = []
  const params = {}
  if (filter === 'text') where.push("i.type IN ('text','html') AND IFNULL(i.detected,'') != 'url'")
  else if (filter === 'image') where.push("i.type = 'image'")
  else if (filter === 'link') where.push("i.detected = 'url'")
  else if (filter === 'files') where.push("i.type = 'files'")
  else if (filter === 'pinned') where.push('i.pinned = 1')
  else if (filter === 'favorite') where.push('i.favorite = 1')
  if (app) {
    where.push('i.app_name = @app')
    params.app = app
  }
  if (query && query.trim()) {
    const raw = query.trim()
    const tokens = raw.split(/\s+/).map((t) => t.replace(/[^\p{L}\p{N}]/gu, '')).filter((t) => t.length > 1)
    let ids = []
    if (tokens.length) {
      try {
        const q = tokens.map((t) => t + '*').join(' ')
        ids = db.prepare('SELECT rowid AS id FROM items_fts WHERE items_fts MATCH ?').all(q).map((r) => r.id)
      } catch {
        ids = []
      }
    }
    if (!ids.length) {
      where.push('(IFNULL(i.text,\'\') LIKE @like OR IFNULL(i.ocr_text,\'\') LIKE @like OR IFNULL(i.app_name,\'\') LIKE @like)')
      params.like = '%' + raw + '%'
    } else {
      where.push(`i.id IN (${ids.join(',')})`)
    }
  }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : ''
  const total = db.prepare(`SELECT COUNT(*) AS c FROM items i ${w}`).get(params).c
  const rows = db.prepare(
    `SELECT i.* FROM items i ${w} ORDER BY i.pinned DESC, i.updated_at DESC LIMIT @limit OFFSET @offset`
  ).all({ ...params, limit, offset })
  for (const r of rows) r.tags = tagsOf(r.id)
  return { rows, total }
}

function get(id) {
  const r = db.prepare('SELECT * FROM items WHERE id = ?').get(id)
  if (r) r.tags = tagsOf(id)
  return r
}

function remove(id) {
  const r = get(id)
  db.prepare('DELETE FROM item_tags WHERE item_id = ?').run(id)
  db.prepare('DELETE FROM items_fts WHERE rowid = ?').run(id)
  db.prepare('DELETE FROM items WHERE id = ?').run(id)
  return r
}

function clearUnpinned() {
  const rows = db.prepare('SELECT * FROM items WHERE pinned = 0').all()
  db.prepare('DELETE FROM item_tags WHERE item_id IN (SELECT id FROM items WHERE pinned = 0)').run()
  db.exec(`DELETE FROM items_fts WHERE rowid IN (SELECT id FROM items WHERE pinned = 0)`)
  db.prepare('DELETE FROM items WHERE pinned = 0').run()
  return rows
}

function toggle(id, field) {
  db.prepare(`UPDATE items SET ${field} = CASE WHEN ${field} = 1 THEN 0 ELSE 1 END WHERE id = ?`).run(id)
  return get(id)
}

function setOcr(id, text) {
  db.prepare('UPDATE items SET ocr_text = ? WHERE id = ?').run(text, id)
  const item = get(id)
  ftsSync(id, item, (item.tags || []).join(' '))
}

function setTags(id, names) {
  db.prepare('DELETE FROM item_tags WHERE item_id = ?').run(id)
  const insT = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)')
  const getT = db.prepare('SELECT id FROM tags WHERE name = ?')
  const link = db.prepare('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)')
  for (const n of names) {
    const name = String(n).trim()
    if (!name) continue
    insT.run(name)
    link.run(id, getT.get(name).id)
  }
  const item = get(id)
  ftsSync(id, item, names.join(' '))
  return item
}

function expired(days) {
  if (!days) return []
  const cut = Date.now() - days * 86400000
  return db.prepare('SELECT * FROM items WHERE pinned = 0 AND updated_at < ?').all(cut)
}

function storeBytes() {
  const r = db.prepare('SELECT IFNULL(SUM(size_bytes),0) AS s FROM items').get()
  return r.s
}

function oldestUnpinned() {
  return db.prepare('SELECT * FROM items WHERE pinned = 0 ORDER BY updated_at ASC LIMIT 20').all()
}

function stats() {
  const total = db.prepare('SELECT COUNT(*) AS c FROM items').get().c
  const byType = db.prepare('SELECT type, COUNT(*) AS c FROM items GROUP BY type').all()
  const apps = db.prepare("SELECT IFNULL(app_name,'?') AS app, COUNT(*) AS c FROM items GROUP BY app_name ORDER BY c DESC LIMIT 10").all()
  const pinned = db.prepare('SELECT COUNT(*) AS c FROM items WHERE pinned = 1').get().c
  return { total, byType, apps, pinned, bytes: storeBytes() }
}

function apps() {
  return db.prepare("SELECT DISTINCT app_name AS app FROM items WHERE app_name IS NOT NULL AND app_name != '' ORDER BY app_name").all()
}

function snippets() {
  return db.prepare('SELECT * FROM snippets ORDER BY name').all()
}

function saveSnippet(s) {
  const now = Date.now()
  if (s.id) {
    db.prepare('UPDATE snippets SET name=?, shortcut=?, body=? WHERE id=?').run(s.name, s.shortcut || '', s.body, s.id)
    return s.id
  }
  const info = db.prepare('INSERT INTO snippets (name, shortcut, body, created_at) VALUES (?,?,?,?)').run(s.name, s.shortcut || '', s.body, now)
  return info.lastInsertRowid
}

function deleteSnippet(id) {
  db.prepare('DELETE FROM snippets WHERE id = ?').run(id)
}

function allItems() {
  const rows = db.prepare('SELECT * FROM items ORDER BY updated_at DESC').all()
  for (const r of rows) r.tags = tagsOf(r.id)
  return rows
}

function importItem(item) {
  try { return upsertByHash(item) } catch (e) { logger.warn('import item', e); return null }
}

module.exports = {
  open, upsertByHash, list, get, remove, clearUnpinned, toggle, setOcr, setTags,
  expired, storeBytes, oldestUnpinned, stats, apps, snippets, saveSnippet, deleteSnippet, allItems, importItem
}
