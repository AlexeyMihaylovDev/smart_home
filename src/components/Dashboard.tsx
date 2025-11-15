import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../context/HomeAssistantContext'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import ConnectionModal from './ConnectionModal'
import WidgetGrid from './WidgetGrid'
import Settings from './Settings'

type Page = 'dashboard' | 'settings'

const Dashboard = () => {
  const { isConnected } = useHomeAssistant()
  const [showConnectionModal, setShowConnectionModal] = useState(!isConnected)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    setShowConnectionModal(!isConnected)
  }, [isConnected])

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
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
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


