import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useHomeAssistant } from '../context/HomeAssistantContext'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import ConnectionModal from './ConnectionModal'
import WidgetGrid from './WidgetGrid'
import Settings from './Settings'

type Page = 'dashboard' | 'settings'

interface DashboardProps {
  initialPage?: Page
}

const Dashboard = ({ initialPage }: DashboardProps) => {
  const { isConnected } = useHomeAssistant()
  const navigate = useNavigate()
  const location = useLocation()
  const [showConnectionModal, setShowConnectionModal] = useState(!isConnected)
  
  // Определяем текущую страницу из URL
  const getCurrentPage = (): Page => {
    if (location.pathname === '/settings') return 'settings'
    return 'dashboard'
  }
  
  const [currentPage, setCurrentPage] = useState<Page>(initialPage || getCurrentPage())

  useEffect(() => {
    setShowConnectionModal(!isConnected)
  }, [isConnected])

  // Синхронизируем currentPage с URL
  useEffect(() => {
    const page = getCurrentPage()
    setCurrentPage(page)
  }, [location.pathname])

  const handlePageChange = (page: Page) => {
    setCurrentPage(page)
    if (page === 'dashboard') {
      navigate('/dashboard')
    } else if (page === 'settings') {
      navigate('/settings')
    }
  }

  if (!isConnected) {
    return (
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
      />
    )
  }

  return (
    <div className="flex h-screen bg-dark-bg text-dark-text overflow-hidden">
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 overflow-y-auto p-6">
          {currentPage === 'dashboard' ? <WidgetGrid /> : <Settings />}
        </div>
      </div>
    </div>
  )
}

export default Dashboard


