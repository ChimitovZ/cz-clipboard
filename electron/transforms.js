const EN = "`qwertyuiop[]asdfghjkl;'zxcvbnm,./QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>?~"
const RU = 'ёйцукенгшщзхъфывапролджэячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,Ё'

function mapChars(s, a, b) {
  let out = ''
  for (const ch of s) {
    const i = a.indexOf(ch)
    out += i >= 0 ? b[i] : ch
  }
  return out
}

function apply(name, text) {
  const s = text || ''
  switch (name) {
    case 'upper': return s.toUpperCase()
    case 'lower': return s.toLowerCase()
    case 'title': return s.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    case 'unwrap': return s.replace(/[\r\n]+/g, ' ')
    case 'spaces': return s.replace(/[ \t]+/g, ' ')
    case 'trim': return s.trim()
    case 'json':
      try { return JSON.stringify(JSON.parse(s), null, 2) } catch { return s }
    case 'b64e': return Buffer.from(s, 'utf8').toString('base64')
    case 'b64d':
      try { return Buffer.from(s.trim(), 'base64').toString('utf8') } catch { return s }
    case 'urle': return encodeURIComponent(s)
    case 'urld':
      try { return decodeURIComponent(s) } catch { return s }
    case 'layout': {
      const ru = (s.match(/[а-яё]/gi) || []).length
      const en = (s.match(/[a-z]/gi) || []).length
      return ru >= en ? mapChars(s, RU, EN) : mapChars(s, EN, RU)
    }
    default: return s
  }
}

module.exports = { apply }
