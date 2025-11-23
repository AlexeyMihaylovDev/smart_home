import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useHomeAssistant } from '../context/HomeAssistantContext'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import LoginModal from './LoginModal'
import WidgetGrid from './WidgetGrid'
import Settings from './Settings'

type Page = 'dashboard' | 'settings'

interface DashboardProps {
  initialPage?: Page
}

const Dashboard = ({ initialPage }: DashboardProps) => {
  const { isAuthenticated, login } = useAuth()
  const { isConnected } = useHomeAssistant()
  const navigate = useNavigate()
  const location = useLocation()
  const [showLoginModal, setShowLoginModal] = useState(!isAuthenticated)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Определяем текущую страницу из URL
  const getCurrentPage = (): Page => {
    if (location.pathname === '/settings') return 'settings'
    return 'dashboard'
  }

  const [currentPage, setCurrentPage] = useState<Page>(initialPage || getCurrentPage())

  // Получаем текущий таб из URL параметров
  const getCurrentTabFromURL = (): string => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    return tab || 'home'
  }

  const [currentTab, setCurrentTab] = useState<string>(() => getCurrentTabFromURL())

  useEffect(() => {
    setShowLoginModal(!isAuthenticated)
  }, [isAuthenticated])

  // Синхронизируем currentPage с URL
  useEffect(() => {
    const page = getCurrentPage()
    setCurrentPage(page)
  }, [location.pathname])

  // Синхронизируем currentTab с URL параметрами
  useEffect(() => {
    const tabFromURL = getCurrentTabFromURL()
    setCurrentTab(prevTab => {
      if (prevTab !== tabFromURL) {
        return tabFromURL
      }
      return prevTab
    })
  }, [location.search])

  // Обработчик изменения таба с обновлением URL
  const handleTabChange = (tabId: string) => {
    // Если мы в Settings, переключаемся на Dashboard
    if (currentPage === 'settings') {
      setCurrentPage('dashboard')
    }

    setCurrentTab(tabId)
    const params = new URLSearchParams()
    if (tabId === 'home') {
      params.delete('tab')
    } else {
      // Используем tabId (dashboardId) для URL
      params.set('tab', tabId)
    }
    const newSearch = params.toString()
    const newPath = `/dashboard${newSearch ? `?${newSearch}` : ''}`
    navigate(newPath, { replace: true })
  }

  // Закрываем мобильное меню при изменении размера окна (если стало больше lg)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handlePageChange = (page: Page) => {
    setCurrentPage(page)
    if (page === 'dashboard') {
      navigate('/dashboard')
    } else if (page === 'settings') {
      navigate('/settings')
    }
  }

  useEffect(() => {
    console.log('Dashboard: isAuthenticated =', isAuthenticated, 'currentPage =', currentPage)
  }, [isAuthenticated, currentPage])

  if (!isAuthenticated) {
    return (
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    )
  }

  return (
    <div className="flex h-screen bg-dark-bg dark:bg-dark-bg light:bg-light-bg text-dark-text dark:text-dark-text light:text-light-text overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <TopBar
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onTabChange={handleTabChange}
          currentTab={currentPage === 'settings' ? undefined : currentTab}
          currentPage={currentPage}
        />
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-dark-bg dark:bg-dark-bg light:bg-light-bg">
          {currentPage === 'dashboard' ? <WidgetGrid currentTab={currentTab} /> : <Settings />}
        </div>
      </div>
    </div>
  )
}

export default Dashboard


