import { useState, useEffect } from 'react'
import { supabase, getTemsilciler, profilGuncelle } from '../supabaseClient'

const ROL_ETIKET  = { super_admin: 'Süper Admin', admin: 'Admin', temsilci: 'Temsilci' }
const DURUM_RENK  = { aktif: '#16a34a', izinde: '#f59e0b', pasif: '#ef4444' }
const DURUM_ETIKET = { aktif: '🟢 Aktif', izinde: '🏖️ İzinde', pasif: '⛔ Pasif' }

export default function TemsilciYonetimi({ profil }) {
  const [temsilciler, setTemsilciler] = useState([])
  const [yukleniyor, setYukleniyor]   = useState(true)
  const [modal, setModal]             = useState(null) // {tip: 'ekle'|'durum'|'rol', veri}
  const [mesaj, setMesaj]             = useState(null)

  // Ekle form
  const [yeniEmail, setYeniEmail]   = useState('')
  const [yeniAd, setYeniAd]         = useState('')
  const [yeniSoyad, setYeniSoyad]   = useState('')
  const [yeniRol, setYeniRol]       = useState('temsilci')
  const [yeniSifre, setYeniSifre]   = useState('')
  const [kaydediyor, setKaydediyor] = useState(false)

  useEffect(() => { yukle() }, [])

  async function yukle() {
    setYukleniyor(true)
    const data = await getTemsilciler()
    setTemsilciler(data)
    setYukleniyor(false)
  }

  function basari(msg) { setMesaj({ tip: 'basari', msg }); setTimeout(() => setMesaj(null), 3000) }
  function hata(msg)   { setMesaj({ tip: 'hata', msg });   setTimeout(() => setMesaj(null), 4000) }

  async function kullaniciEkle(e) {
    e.preventDefault()
    setKaydediyor(true)
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: yeniEmail,
        password: yeniSifre,
        email_confirm: true,
        user_metadata: { ad: yeniAd, soyad: yeniSoyad, rol: yeniRol }
      })
      if (error) throw error
      basari(`${yeniAd} ${yeniSoyad} eklendi.`)
      setModal(null)
      setYeniEmail(''); setYeniAd(''); setYeniSoyad(''); setYeniSifre(''); setYeniRol('temsilci')
      await yukle()
    } catch (err) {
      hata('Kullanıcı eklenemedi: ' + err.message)
    } finally {
      setKaydediyor(false)
    }
  }

  async function durumDegistir(id, yeniDurum) {
    try {
      await profilGuncelle(id, { durum: yeniDurum })
      basari('Durum güncellendi.')
      setModal(null)
      await yukle()
    } catch (err) {
      hata('Güncelleme başarısız.')
    }
  }

  async function rolDegistir(id, yeniRol) {
    try {
      await profilGuncelle(id, { rol: yeniRol })
      basari('Rol güncellendi.')
      setModal(null)
      await yukle()
    } catch (err) {
      hata('Güncelleme başarısız.')
    }
  }

  const benimRolum = profil?.rol

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 2 }}>Temsilci Yönetimi</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>{temsilciler.length} kullanıcı</p>
        </div>
        {benimRolum === 'super_admin' && (
          <button onClick={() => setModal({ tip: 'ekle' })}
            style={{ padding: '9px 18px', borderRadius: 8, background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Kullanıcı Ekle
          </button>
        )}
      </div>

      {mesaj && (
        <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500,
          background: mesaj.tip === 'basari' ? '#dcfce7' : '#fef2f2',
          border: `1px solid ${mesaj.tip === 'basari' ? '#bbf7d0' : '#fecaca'}`,
          color: mesaj.tip === 'basari' ? '#15803d' : '#dc2626'
        }}>
          {mesaj.tip === 'basari' ? '✅' : '❌'} {mesaj.msg}
        </div>
      )}

      {yukleniyor ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>Yükleniyor...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {temsilciler.map(t => (
            <div key={t.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                  {t.ad?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{t.ad} {t.soyad}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{ROL_ETIKET[t.rol] || t.rol}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: DURUM_RENK[t.durum] || '#6b7280', background: `${DURUM_RENK[t.durum] || '#6b7280'}15`, padding: '4px 12px', borderRadius: 20 }}>
                  {DURUM_ETIKET[t.durum] || t.durum}
                </span>
                {benimRolum === 'super_admin' && t.id !== profil?.id && (
                  <>
                    <button onClick={() => setModal({ tip: 'durum', veri: t })}
                      style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Durum
                    </button>
                    <button onClick={() => setModal({ tip: 'rol', veri: t })}
                      style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Rol
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

            {/* Kullanıcı Ekle */}
            {modal.tip === 'ekle' && (
              <>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', marginBottom: 20 }}>Yeni Kullanıcı Ekle</div>
                <form onSubmit={kullaniciEkle}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Ad</label>
                      <input value={yeniAd} onChange={e => setYeniAd(e.target.value)} required
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Soyad</label>
                      <input value={yeniSoyad} onChange={e => setYeniSoyad(e.target.value)} required
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>E-posta</label>
                    <input type="email" value={yeniEmail} onChange={e => setYeniEmail(e.target.value)} required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Şifre</label>
                    <input type="password" value={yeniSifre} onChange={e => setYeniSifre(e.target.value)} required minLength={8}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Rol</label>
                    <select value={yeniRol} onChange={e => setYeniRol(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                      <option value="temsilci">Temsilci</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Süper Admin</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={kaydediyor}
                      style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {kaydediyor ? 'Ekleniyor...' : 'Ekle'}
                    </button>
                    <button type="button" onClick={() => setModal(null)}
                      style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      İptal
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Durum Değiştir */}
            {modal.tip === 'durum' && (
              <>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', marginBottom: 6 }}>Durum Değiştir</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>{modal.veri.ad} {modal.veri.soyad}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {Object.entries(DURUM_ETIKET).map(([key, label]) => (
                    <button key={key} onClick={() => durumDegistir(modal.veri.id, key)}
                      style={{ padding: '12px 16px', borderRadius: 8, border: `2px solid ${modal.veri.durum === key ? DURUM_RENK[key] : '#e5e7eb'}`, background: modal.veri.durum === key ? `${DURUM_RENK[key]}10` : '#fff', color: '#111827', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setModal(null)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  İptal
                </button>
              </>
            )}

            {/* Rol Değiştir */}
            {modal.tip === 'rol' && (
              <>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', marginBottom: 6 }}>Rol Değiştir</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>{modal.veri.ad} {modal.veri.soyad}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {Object.entries(ROL_ETIKET).map(([key, label]) => (
                    <button key={key} onClick={() => rolDegistir(modal.veri.id, key)}
                      style={{ padding: '12px 16px', borderRadius: 8, border: `2px solid ${modal.veri.rol === key ? '#16a34a' : '#e5e7eb'}`, background: modal.veri.rol === key ? '#dcfce7' : '#fff', color: '#111827', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setModal(null)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  İptal
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
