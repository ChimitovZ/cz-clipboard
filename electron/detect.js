function looksLikeCode(t) {
  if (t.length < 20) return false
  const keys = /(?:function|const |let |var |import |class |def |public |#include|<\/?[a-z]+>)/
  return keys.test(t) && t.split('\n').length > 1
}

function luhn(num) {
  const d = num.replace(/\D/g, '')
  if (d.length < 13 || d.length > 19) return false
  let s = 0
  let alt = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = +d[i]
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    s += n
    alt = !alt
  }
  return s % 10 === 0
}

function isPasswordLike(t) {
  const s = t.trim()
  if (s.length < 8 || s.length > 64 || /\s/.test(s)) return false
  if (/^https?:/i.test(s) || s.includes('@') || s.includes('\\')) return false
  return /[a-z]/.test(s) && /[A-Z]/.test(s) && /\d/.test(s)
}

function domainOf(url) {
  try { return new URL(url.trim()).hostname } catch { return '' }
}

function detect(text) {
  if (!text) return 'text'
  const t = text.trim()
  if (!t) return 'text'
  if (/^https?:\/\/\S+$/i.test(t) || /^www\.\S+\.\S+$/i.test(t)) return 'url'
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'email'
  if (/^(?:#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/i.test(t)) return 'color'
  if (/^[\d\s()+.-]{10,20}$/.test(t) && t.replace(/\D/g, '').length >= 10) return 'phone'
  if (/^[a-zA-Z]:[\\/]|^\\\\/.test(t) && t.length < 500) return 'path'
  if ((t.startsWith('{') || t.startsWith('[')) && t.length < 2_000_000) {
    try { JSON.parse(t); return 'json' } catch {}
  }
  if (looksLikeCode(t)) return 'code'
  return 'text'
}

module.exports = { detect, isPasswordLike, luhn, domainOf }
