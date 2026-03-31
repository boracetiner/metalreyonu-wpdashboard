import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = 'https://jywohakixaodiyxilgsf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d29oYWtpeGFvZGl5eGlsZ3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTQ0ODEsImV4cCI6MjA4ODI5MDQ4MX0.MMcMO_2WPosy7sukDH9wmaWCEOQJEq56NeuRBg5uAF8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'metalreyonu-auth',
    lock: (name, acquireTimeout, fn) => fn()
  }
})

const WEBHOOK_URL = 'https://metalreyonu-webhook-production.up.railway.app'

// ── Auth ──────────────────────────────────────────────────────────────────
export async function girisYap(email, sifre) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: sifre })
  if (error) throw error
  return data
}

export async function cikisYap() {
  await supabase.auth.signOut()
}

export async function mevcutKullanici() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return { ...user, profil }
}

// ── Konuşmalar ────────────────────────────────────────────────────────────
export async function getKonusmalar(filtre = {}) {
  let query = supabase
    .from('conversations')
    .select('*, assigned_profile:profiles!conversations_assigned_agent_fkey(id, ad, soyad)')
    .order('last_message_at', { ascending: false })

  if (filtre.status)         query = query.eq('status', filtre.status)
  if (filtre.assigned_agent) query = query.eq('assigned_agent', filtre.assigned_agent)
  if (filtre.limit)          query = query.limit(filtre.limit)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getKonusma(id) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function konusmaGuncelle(id, updates) {
  const { data, error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Mesajlar ──────────────────────────────────────────────────────────────
export async function getMesajlar(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: true })
  if (error) throw error
  return data || []
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

export async function templateGonder({ phone, template_name, conversation_id, agent_id }) {
  const res = await fetch(`${WEBHOOK_URL}/send-template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, template_name, conversation_id, agent_id })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Template gönderilemedi')
  }
  return res.json()
}

// ── Profiller ─────────────────────────────────────────────────────────────
export async function getTemsilciler() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('ad')
  if (error) throw error
  return data || []
}

export async function profilGuncelle(id, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Hazır Yanıtlar ────────────────────────────────────────────────────────
export async function getHazirYanitlar() {
  const { data, error } = await supabase
    .from('hazir_yanitlar')
    .select('*')
    .eq('aktif', true)
    .order('kisayol')
  if (error) throw error
  return data || []
}

// ── Kategoriler ───────────────────────────────────────────────────────────
export async function getKategoriler() {
  const { data, error } = await supabase
    .from('kategoriler')
    .select('*')
    .eq('aktif', true)
    .order('isim')
  if (error) throw error
  return data || []
}

// ── Templates ─────────────────────────────────────────────────────────────
export async function getTemplates() {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('isim')
  if (error) throw error
  return data || []
}

// ── Dashboard KPI ─────────────────────────────────────────────────────────
export async function getKpiStats() {
  const bugun = new Date()
  bugun.setHours(0, 0, 0, 0)
  const bugunISO = bugun.toISOString()

  const haftaBaslangic = new Date(bugun)
  haftaBaslangic.setDate(bugun.getDate() - 7)

  const [
    { data: tumKonusmalar },
    { data: bugunKonusmalar },
    { data: haftaKonusmalar }
  ] = await Promise.all([
    supabase.from('conversations').select('status, sonuc'),
    supabase.from('conversations').select('id, status, sonuc').gte('created_at', bugunISO),
    supabase.from('conversations').select('id, status, sonuc').gte('created_at', haftaBaslangic.toISOString())
  ])

  const total     = tumKonusmalar?.length || 0
  const bekleyen  = tumKonusmalar?.filter(c => c.status === 'open').length || 0
  const kapanan   = tumKonusmalar?.filter(c => c.status === 'closed' || c.status === 'kapali').length || 0
  const satis     = tumKonusmalar?.filter(c => c.sonuc === 'satis').length || 0
  const kapanmaOrani = total ? Math.round((kapanan / total) * 100) : 0

  return {
    bugunGelen:    bugunKonusmalar?.length || 0,
    haftaGelen:    haftaKonusmalar?.length || 0,
    bekleyen,
    kapanan,
    satis,
    kapanmaOrani,
    total
  }
}

export async function getDailyStats(days = 15) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data } = await supabase
    .from('conversations')
    .select('created_at, status, sonuc')
    .gte('created_at', since.toISOString())
  if (!data) return []
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
  const { data } = await supabase.from('conversations').select('category')
  if (!data) return []
  const sayac = {}
  data.forEach(({ category }) => { sayac[category] = (sayac[category] || 0) + 1 })
  const renkler = {
    fiyat_sorgusu: '#16a34a', stok_sorgusu: '#0891B2',
    siparis_takibi: '#7c3aed', iade_sikayet: '#D97706',
    degisim: '#db2777', diger: '#6B7280'
  }
  const etiketler = {
    fiyat_sorgusu: 'Fiyat Sorgusu', stok_sorgusu: 'Stok Sorgusu',
    siparis_takibi: 'Sipariş Takibi', iade_sikayet: 'İade/Şikayet',
    degisim: 'Değişim', diger: 'Diğer'
  }
  const toplam = Object.values(sayac).reduce((a, b) => a + b, 0)
  return Object.entries(sayac).map(([key, val]) => ({
    name: etiketler[key] || key,
    value: Math.round((val / toplam) * 100),
    sayi: val,
    color: renkler[key] || '#6B7280'
  }))
}
