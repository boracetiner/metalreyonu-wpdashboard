import { useState } from 'react'
import { supabase, profilGuncelle } from '../supabaseClient'

export default function Profil({ profil: initialProfil }) {
  const [profil, setProfil]   = useState(initialProfil || {})
  const [sekme, setSekme]     = useState('profil')
  const [kaydediyor, setKaydediyor] = useState(false)
  const [mesaj, setMesaj]     = useState(null)

  // Profil form state
  const [ad, setAd]         = useState(initialProfil?.ad || '')
  const [soyad, setSoyad]   = useState(initialProfil?.soyad || '')

  // Şifre form state
  const [mevcutSifre, setMevcutSifre]   = useState('')
  const [yeniSifre, setYeniSifre]       = useState('')
  const [yeniSifre2, setYeniSifre2]     = useState('')

  function basari(msg) {
    setMesaj({ tip: 'basari', msg })
    setTimeout(() => setMesaj(null), 3000)
  }

  function hata(msg) {
    setMesaj({ tip: 'hata', msg })
    setTimeout(() => setMesaj(null), 4000)
  }

  async function profilKaydet(e) {
    e.preventDefault()
    setKaydediyor(true)
    try {
      await profilGuncelle(profil.id, { ad, soyad, updated_at: new Date().toISOString() })
      basari('Profil güncellendi.')
    } catch (err) {
      hata('Güncelleme başarısız: ' + err.message)
    } finally {
      setKaydediyor(false)
    }
  }

  async function sifreDegistir(e) {
    e.preventDefault()
    if (yeniSifre !== yeniSifre2) { hata('Yeni şifreler eşleşmiyor.'); return }
    if (yeniSifre.length < 8) { hata('Şifre en az 8 karakter olmalı.'); return }
    setKaydediyor(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: yeniSifre })
      if (error) throw error
      basari('Şifre güncellendi.')
      setMevcutSifre(''); setYeniSifre(''); setYeniSifre2('')
    } catch (err) {
      hata('Şifre değiştirilemedi: ' + err.message)
    } finally {
      setKaydediyor(false)
    }
  }

  const ROL_ETIKET = { super_admin: 'Süper Admin', admin: 'Admin', temsilci: 'Temsilci' }
  const DURUM_RENK = { aktif: '#16a34a', izinde: '#f59e0b', pasif: '#ef4444' }
  const DURUM_ETIKET = { aktif: 'Aktif', izinde: 'İzinde', pasif: 'Pasif' }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 640, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 2 }}>Profil</h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>Hesap bilgilerinizi yönetin</p>
      </div>

      {/* Mesaj */}
      {mesaj && (
        <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 500,
          background: mesaj.tip === 'basari' ? '#dcfce7' : '#fef2f2',
          border: `1px solid ${mesaj.tip === 'basari' ? '#bbf7d0' : '#fecaca'}`,
          color: mesaj.tip === 'basari' ? '#15803d' : '#dc2626'
        }}>
          {mesaj.tip === 'basari' ? '✅' : '❌'} {mesaj.msg}
        </div>
      )}

      {/* Profil kartı */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 22 }}>
            {(profil?.ad || '?').charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{profil?.ad} {profil?.soyad}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '2px 10px', borderRadius: 20 }}>
                {ROL_ETIKET[profil?.rol] || profil?.rol}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: DURUM_RENK[profil?.durum] || '#6b7280', background: `${DURUM_RENK[profil?.durum]}15`, padding: '2px 10px', borderRadius: 20 }}>
                {DURUM_ETIKET[profil?.durum] || profil?.durum}
              </span>
            </div>
          </div>
        </div>

        {/* Sekmeler */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #f3f4f6', marginBottom: 20 }}>
          {[['profil', 'Profil Bilgileri'], ['sifre', 'Şifre Değiştir']].map(([key, label]) => (
            <button key={key} onClick={() => setSekme(key)} style={{ padding: '8px 16px', borderRadius: '6px 6px 0 0', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              background: sekme === key ? '#fff' : 'transparent',
              color: sekme === key ? '#16a34a' : '#6b7280',
              borderBottom: sekme === key ? '2px solid #16a34a' : '2px solid transparent'
            }}>{label}</button>
          ))}
        </div>

        {/* Profil Bilgileri */}
        {sekme === 'profil' && (
          <form onSubmit={profilKaydet}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Ad</label>
                <input value={ad} onChange={e => setAd(e.target.value)} required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit', color: '#111827' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Soyad</label>
                <input value={soyad} onChange={e => setSoyad(e.target.value)} required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit', color: '#111827' }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Rol</label>
              <input value={ROL_ETIKET[profil?.rol] || profil?.rol} disabled
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', color: '#9ca3af', background: '#f9fafb' }} />
            </div>
            <button type="submit" disabled={kaydediyor}
              style={{ padding: '10px 24px', borderRadius: 8, background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: kaydediyor ? 0.7 : 1 }}>
              {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </form>
        )}

        {/* Şifre Değiştir */}
        {sekme === 'sifre' && (
          <form onSubmit={sifreDegistir}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Yeni Şifre</label>
                <input type="password" value={yeniSifre} onChange={e => setYeniSifre(e.target.value)} required placeholder="En az 8 karakter"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit', color: '#111827' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Yeni Şifre (Tekrar)</label>
                <input type="password" value={yeniSifre2} onChange={e => setYeniSifre2(e.target.value)} required placeholder="Şifreyi tekrarla"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit', color: '#111827' }} />
              </div>
            </div>
            <button type="submit" disabled={kaydediyor}
              style={{ padding: '10px 24px', borderRadius: 8, background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: kaydediyor ? 0.7 : 1 }}>
              {kaydediyor ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
