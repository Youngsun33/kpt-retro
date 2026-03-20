import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WriteRetro from './pages/WriteRetro'
import History from './pages/History'
import TeamDetail from './pages/TeamDetail'
import ProjectDetail from './pages/ProjectDetail'
import FinalReport from './pages/FinalReport'


function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/" />} />
     <Route path="/write/:id" element={session ? <WriteRetro session={session} /> : <Navigate to="/" />} />
      <Route path="/history" element={session ? <History session={session} /> : <Navigate to="/" />} />      <Route path="/team/:id" element={session ? <TeamDetail session={session} /> : <Navigate to="/" />} />
      <Route path="/report/:id" element={session ? <FinalReport session={session} /> : <Navigate to="/" />} />
      <Route path="/project/:id" element={session ? <ProjectDetail session={session} /> : <Navigate to="/" />} />
    </Routes>
  )
}

export default App