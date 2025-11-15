import TVTimeWidget from './widgets/TVTimeWidget'
import MediaPlayerWidget from './widgets/MediaPlayerWidget'
import SpotifyWidget from './widgets/SpotifyWidget'
import MediaRoomWidget from './widgets/MediaRoomWidget'
import CanvasWidget from './widgets/CanvasWidget'
import TVPreviewWidget from './widgets/TVPreviewWidget'
import PlexWidget from './widgets/PlexWidget'
import TVDurationWidget from './widgets/TVDurationWidget'
import AmbientLightingWidget from './widgets/AmbientLightingWidget'
import LivingRoomWidget from './widgets/LivingRoomWidget'
import WeatherCalendarWidget from './widgets/WeatherCalendarWidget'

const WidgetGrid = () => {
  return (
    <div className="grid grid-cols-3 gap-6 max-w-[2048px] mx-auto">
      {/* Колонка 1 */}
      <div className="space-y-6">
        <TVTimeWidget />
        <MediaPlayerWidget />
        <SpotifyWidget />
        <MediaRoomWidget />
      </div>

      {/* Колонка 2 */}
      <div className="space-y-6">
        <CanvasWidget />
        <TVPreviewWidget />
        <PlexWidget />
        <TVDurationWidget />
      </div>

      {/* Колонка 3 */}
      <div className="space-y-6">
        <WeatherCalendarWidget />
        <AmbientLightingWidget />
        <LivingRoomWidget />
      </div>
    </div>
  )
}

export default WidgetGrid


