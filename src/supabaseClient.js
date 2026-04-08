import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = 'https://jywohakixaodiyxilgsf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d29oYWtpeGFvZGl5eGlsZ3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTQ0ODEsImV4cCI6MjA4ODI5MDQ4MX0.MMcMO_2WPosy7sukDH9wmaWCEOQJEq56NeuRBg5uAF8'
const WEBHOOK_URL = 'https://metalreyonu-webhook-production.up.railway.app'

// Tek global client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'metalreyonu-auth'
  },
  db: { schema: 'public' }
})

// Token'ı her zaman localStorage'dan al
function getToken() {
  try {
    const raw = localStorage.getItem('metalreyonu-auth')
    if (!raw) return SUPABASE_ANON_KEY
    const session = JSON.parse(raw)
    return session?.access_token || SUPABASE_ANON_KEY
  } catch { return SUPABASE_ANON_KEY }
}

// Authenticated REST API çağrısı
async function restGet(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + getToken(),
      'Accept': 'application/json'
    }
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function restPatch(table, id, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + getToken(),
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data[0]
}

// ── Auth ──────────────────────────────────────────────────────────────────
export async function girisYap(email, sifre) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: sifre })
  if (error) throw error
  return data
}

export async function cikisYap() {
  await supabase.auth.signOut()
}

// ── Konuşmalar ────────────────────────────────────────────────────────────
export async function getKonusmalar(filtre = {}) {
  let params = '?select=*,assigned_profile:profiles!conversations_assigned_agent_fkey(id,ad,soyad)&order=last_message_at.desc'
  if (filtre.status) params += `&status=eq.${filtre.status}`
  if (filtre.assigned_agent) params += `&assigned_agent=eq.${filtre.assigned_agent}`
  if (filtre.limit) params += `&limit=${filtre.limit}`
  return restGet('conversations', params)
}

export async function konusmaGuncelle(id, updates) {
  return restPatch('conversations', id, updates)
}

// ── Mesajlar ──────────────────────────────────────────────────────────────
export async function getMesajlar(conversationId) {
  return restGet('messages', `?conversation_id=eq.${conversationId}&order=sent_at.asc`)
}

export async function mesajGonder({ phone, message, conversation_id, agent_id, is_note = false }) {
  const res = await fetch(`${WEBHOOK_URL}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message, conversation_id, agent_id, is_note })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Mesaj gönderilemedi')
  }
  return res.json()
}

// ── Profiller ─────────────────────────────────────────────────────────────
export async function getTemsilciler() {
  return restGet('profiles', '?order=ad')
}

export async function profilGuncelle(id, updates) {
  return restPatch('profiles', id, updates)
}

// ── Hazır Yanıtlar ────────────────────────────────────────────────────────
export async function getHazirYanitlar() {
  return restGet('hazir_yanitlar', '?aktif=eq.true&order=kisayol')
}

// ── Kategoriler ───────────────────────────────────────────────────────────
export async function getKategoriler() {
  return restGet('kategoriler', '?aktif=eq.true&order=isim')
}

// ── Dashboard KPI ─────────────────────────────────────────────────────────
export async function getKpiStats() {
  const bugun = new Date()
  bugun.setHours(0, 0, 0, 0)
  const bugunISO = bugun.toISOString()
  const haftaISO = new Date(bugun.getTime() - 7 * 86400000).toISOString()

  const [tumKonusmalar, bugunKonusmalar, haftaKonusmalar] = await Promise.all([
    restGet('conversations', '?select=status,sonuc'),
    restGet('conversations', `?select=id,status,sonuc&created_at=gte.${bugunISO}`),
    restGet('conversations', `?select=id,status,sonuc&created_at=gte.${haftaISO}`)
  ])

  const total = tumKonusmalar?.length || 0
  const bekleyen = tumKonusmalar?.filter(c => c.status === 'open').length || 0
  const kapanan = tumKonusmalar?.filter(c => c.status === 'closed' || c.status === 'kapali').length || 0
  const satis = tumKonusmalar?.filter(c => c.sonuc === 'satis').length || 0
  const kapanmaOrani = total ? Math.round((kapanan / total) * 100) : 0

  return {
    bugunGelen: bugunKonusmalar?.length || 0,
    haftaGelen: haftaKonusmalar?.length || 0,
    bekleyen, kapanan, satis, kapanmaOrani, total
  }
}

export async function getDailyStats(days = 15) {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const data = await restGet('conversations', `?select=created_at,status,sonuc&created_at=gte.${since}`)
  const byDay = {}
  data.forEach(row => {
    const gun = new Date(row.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    if (!byDay[gun]) byDay[gun] = { gun, gelen: 0, kapanan: 0, satis: 0 }
    byDay[gun].gelen++
    if (row.status === 'closed' || row.status === 'kapali') byDay[gun].kapanan++
    if (row.sonuc === 'satis') byDay[gun].satis++
  })
  return Object.values(byDay)
}

export async function getKategoriDagilim() {
  const data = await restGet('conversations', '?select=category')
  const sayac = {}
  data.forEach(({ category }) => { sayac[category] = (sayac[category] || 0) + 1 })
  const renkler = { fiyat_sorgusu: '#16a34a', stok_sorgusu: '#0891B2', siparis_takibi: '#7c3aed', iade_sikayet: '#D97706', degisim: '#db2777', diger: '#6B7280' }
  const etiketler = { fiyat_sorgusu: 'Fiyat Sorgusu', stok_sorgusu: 'Stok Sorgusu', siparis_takibi: 'Sipariş Takibi', iade_sikayet: 'İade/Şikayet', degisim: 'Değişim', diger: 'Diğer' }
  const toplam = Object.values(sayac).reduce((a, b) => a + b, 0)
  return Object.entries(sayac).map(([key, val]) => ({
    name: etiketler[key] || key,
    value: Math.round((val / toplam) * 100),
    sayi: val,
    color: renkler[key] || '#6B7280'
  }))
}
