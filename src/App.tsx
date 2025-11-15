import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import { HomeAssistantProvider } from './context/HomeAssistantContext'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <HomeAssistantProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/dashboard" element={<Dashboard initialPage="dashboard" />} />
            <Route path="/settings" element={<Dashboard initialPage="settings" />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </HomeAssistantProvider>
    </AuthProvider>
  )
}

export default App


