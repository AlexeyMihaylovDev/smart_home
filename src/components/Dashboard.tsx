import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../context/HomeAssistantContext'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import ConnectionModal from './ConnectionModal'
import WidgetGrid from './WidgetGrid'

const Dashboard = () => {
  const { isConnected } = useHomeAssistant()
  const [showConnectionModal, setShowConnectionModal] = useState(!isConnected)

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
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 overflow-y-auto p-6">
          <WidgetGrid />
        </div>
      </div>
    </div>
  )
}

export default Dashboard


