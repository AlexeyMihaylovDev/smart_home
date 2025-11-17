import { Camera, CameraOff } from 'lucide-react'

export interface PreparedCamera {
  id: string
  name: string
  imageUrl: string | null
  hasEntity: boolean
  isOnline: boolean
}

interface CamerasStyleProps {
  cameras: PreparedCamera[]
}

const NotConfiguredBadge = ({ message }: { message: string }) => (
  <div className="text-xs text-dark-textSecondary">{message}</div>
)

export const CamerasListStyle = ({ cameras }: CamerasStyleProps) => (
  <div className="space-y-3">
    {cameras.map(camera => (
      <div
        key={camera.id}
        className="flex items-center gap-3 p-3 rounded-lg border border-dark-border hover:bg-dark-card transition-colors"
      >
        <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-dark-bg border border-dark-border flex-shrink-0">
          {camera.imageUrl && camera.isOnline ? (
            <img
              src={camera.imageUrl}
              alt={camera.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CameraOff size={20} className="text-gray-500" />
            </div>
          )}
          {camera.isOnline && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-dark-bg" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${camera.hasEntity ? 'text-white' : 'text-dark-textSecondary'}`}>
            {camera.name}
          </div>
          <div className="text-xs text-dark-textSecondary">
            {camera.hasEntity ? (camera.isOnline ? 'Онлайн' : 'Офлайн') : 'Не настроен'}
          </div>
        </div>
        <div className="flex-shrink-0">
          {camera.hasEntity ? (
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              camera.isOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
            }`}>
              {camera.isOnline ? 'Активна' : 'Неактивна'}
            </div>
          ) : (
            <NotConfiguredBadge message="Не настроен" />
          )}
        </div>
      </div>
    ))}
  </div>
)

export const CamerasCardStyle = ({ cameras }: CamerasStyleProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {cameras.map(camera => (
      <div
        key={camera.id}
        className="p-4 rounded-xl border border-dark-border bg-gradient-to-br from-dark-card to-dark-bg shadow-inner"
      >
        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-dark-bg border border-dark-border mb-3">
          {camera.imageUrl && camera.isOnline ? (
            <img
              src={camera.imageUrl}
              alt={camera.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CameraOff size={32} className="text-gray-500" />
            </div>
          )}
          {camera.isOnline && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-bg shadow-lg" />
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold truncate ${camera.hasEntity ? 'text-white' : 'text-dark-textSecondary'}`}>
              {camera.name}
            </div>
            <div className="text-xs text-dark-textSecondary mt-0.5">
              {camera.hasEntity ? (camera.isOnline ? 'Онлайн' : 'Офлайн') : 'Не настроен'}
            </div>
          </div>
          {camera.hasEntity && (
            <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
              camera.isOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
            }`}>
              {camera.isOnline ? 'Активна' : 'Неактивна'}
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
)

export const CamerasCompactStyle = ({ cameras }: CamerasStyleProps) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
    {cameras.map(camera => (
      <div
        key={camera.id}
        className="relative rounded-lg overflow-hidden border border-dark-border bg-dark-card hover:border-blue-500 transition-colors"
      >
        <div className="relative w-full aspect-video bg-dark-bg">
          {camera.imageUrl && camera.isOnline ? (
            <img
              src={camera.imageUrl}
              alt={camera.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CameraOff size={20} className="text-gray-500" />
            </div>
          )}
          {camera.isOnline && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-dark-bg" />
          )}
        </div>
        <div className="p-2">
          <div className={`text-xs font-medium truncate ${camera.hasEntity ? 'text-white' : 'text-dark-textSecondary'}`}>
            {camera.name}
          </div>
        </div>
      </div>
    ))}
  </div>
)

export const CamerasGridStyle = ({ cameras }: CamerasStyleProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {cameras.map(camera => (
      <div
        key={camera.id}
        className="relative rounded-xl overflow-hidden border border-dark-border bg-gradient-to-br from-dark-card to-dark-bg shadow-lg hover:shadow-xl transition-all group"
      >
        <div className="relative w-full aspect-video bg-dark-bg">
          {camera.imageUrl && camera.isOnline ? (
            <img
              src={camera.imageUrl}
              alt={camera.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CameraOff size={40} className="text-gray-500" />
            </div>
          )}
          {camera.isOnline && (
            <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-bg shadow-lg animate-pulse" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={`text-sm font-semibold truncate flex-1 ${camera.hasEntity ? 'text-white' : 'text-dark-textSecondary'}`}>
              {camera.name}
            </div>
            {camera.hasEntity && (
              <div className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                camera.isOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {camera.isOnline ? 'Онлайн' : 'Офлайн'}
              </div>
            )}
          </div>
          {!camera.hasEntity && (
            <div className="text-xs text-dark-textSecondary">Не настроен</div>
          )}
        </div>
      </div>
    ))}
  </div>
)

// Not Configured Components
export const CamerasListNotConfigured = () => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="p-4 bg-gray-500/20 rounded-full mb-4">
      <Camera size={32} className="text-gray-500" />
    </div>
    <div className="text-sm font-medium text-dark-textSecondary mb-1">Камеры не настроены</div>
    <div className="text-xs text-dark-textSecondary">Добавьте камеры в настройках</div>
  </div>
)

export const CamerasCardNotConfigured = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="p-4 bg-gray-500/20 rounded-full mb-4">
      <Camera size={40} className="text-gray-500" />
    </div>
    <div className="text-sm font-medium text-dark-textSecondary mb-1">Камеры не настроены</div>
    <div className="text-xs text-dark-textSecondary">Добавьте камеры в настройках</div>
  </div>
)

export const CamerasCompactNotConfigured = () => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="p-3 bg-gray-500/20 rounded-full mb-3">
      <Camera size={24} className="text-gray-500" />
    </div>
    <div className="text-xs font-medium text-dark-textSecondary mb-1">Камеры не настроены</div>
    <div className="text-[10px] text-dark-textSecondary">Добавьте камеры в настройках</div>
  </div>
)

export const CamerasGridNotConfigured = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-5 bg-gray-500/20 rounded-full mb-5">
      <Camera size={48} className="text-gray-500" />
    </div>
    <div className="text-base font-medium text-dark-textSecondary mb-2">Камеры не настроены</div>
    <div className="text-sm text-dark-textSecondary">Добавьте камеры в настройках</div>
  </div>
)

