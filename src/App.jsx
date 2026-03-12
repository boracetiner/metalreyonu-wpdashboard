import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inbox from './pages/Inbox'
import Sohbet from './pages/Sohbet'

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
    })

    // Auth değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setKullanici(session.user)
        await profilYukle(session.user.id)
      } else {
        setKullanici(null)
        setProfil(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function profilYukle(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfil(data)
  }

  if (yukleniyor) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ color: '#6b7280', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Yükleniyor...</p>
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
