import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Layout from './components/Layout'
import Login from './pages/Login'

export default function App() {
  const [kullanici, setKullanici] = useState(null)
  const [profil, setProfil]       = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    // Mevcut oturumu kontrol et
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setKullanici(session.user)
        await profilYukle(session.user.id)
      }
      setYukleniyor(false)
    }).catch(() => {
      setYukleniyor(false)
    })

    // Auth değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setKullanici(session.user)
        await profilYukle(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setKullanici(null)
        setProfil(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function profilYukle(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfil(data)
    } catch {
      // profil yüklenemese bile devam et
    }
  }

  if (yukleniyor) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={kullanici ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/*"
          element={
            kullanici
              ? <Layout kullanici={kullanici} profil={profil} />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </HashRouter>
  )
}
