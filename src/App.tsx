import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import { HomeAssistantProvider } from './context/HomeAssistantContext'

function App() {
  return (
    <HomeAssistantProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/dashboard" element={<Dashboard initialPage="dashboard" />} />
          <Route path="/settings" element={<Dashboard initialPage="settings" />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </HomeAssistantProvider>
  )
}

export default App


