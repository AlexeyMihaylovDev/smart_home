import Dashboard from './components/Dashboard'
import { HomeAssistantProvider } from './context/HomeAssistantContext'

function App() {
  return (
    <HomeAssistantProvider>
      <Dashboard />
    </HomeAssistantProvider>
  )
}

export default App


