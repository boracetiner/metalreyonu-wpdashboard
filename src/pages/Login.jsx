import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { girisYap } from '../supabaseClient'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [sifre, setSifre]       = useState('')
  const [hata, setHata]         = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const navigate = useNavigate()

  async function handleGiris(e) {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      await girisYap(email, sifre)
      navigate('/')
    } catch (err) {
      setHata('E-posta veya şifre hatalı.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { font-family: inherit; }
        input:focus { outline: none; border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; }
        .btn-primary:hover { background: #15803d !important; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px' }}>💬</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Metal Reyonu</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>WhatsApp Yönetim Paneli</p>
        </div>

        {/* Kart */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Giriş Yap</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Hesabınıza erişmek için giriş yapın</p>

          {hata && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
              {hata}
            </div>
          )}

          <form onSubmit={handleGiris}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>E-posta</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@metalreyonu.com.tr"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, color: '#111827', transition: 'all 0.15s' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Şifre</label>
              <input
                type="password"
                value={sifre}
                onChange={e => setSifre(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, color: '#111827', transition: 'all 0.15s' }}
              />
            </div>

            <button
              type="submit"
              disabled={yukleniyor}
              className="btn-primary"
              style={{ width: '100%', padding: '11px', borderRadius: 8, background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'inherit' }}
            >
              {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 20 }}>
          © 2026 Metal Reyonu · Tüm hakları saklıdır
        </p>
      </div>
    </div>
  )
}
