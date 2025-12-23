import { useState, useEffect } from 'react'
import { RefreshCw, ExternalLink, Clock, AlertCircle } from 'lucide-react'

interface NewsItem {
    title: string
    link: string
    pubDate: string
    source: string
    description?: string
}

const NewsPage = () => {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const fetchNews = async () => {
        setLoading(true)
        setError(null)

        try {
            // Using RSS2JSON API to fetch Israeli news from Ynet
            const sources = [
                { name: 'Ynet', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.ynet.co.il/Integration/StoryRss2.xml' },
                { name: 'Mako', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://rcs.mako.co.il/rss/31750a2610f26110VgnVCM1000004801000aRCRD.xml' },
            ]

            const allNews: NewsItem[] = []

            for (const source of sources) {
                try {
                    const response = await fetch(source.url)
                    const data = await response.json()

                    if (data.status === 'ok' && data.items) {
                        const items = data.items.slice(0, 10).map((item: any) => ({
                            title: item.title,
                            link: item.link,
                            pubDate: item.pubDate,
                            source: source.name,
                            description: item.description?.replace(/<[^>]*>/g, '').slice(0, 200)
                        }))
                        allNews.push(...items)
                    }
                } catch (e) {
                    console.error(`Error fetching from ${source.name}:`, e)
                }
            }

            // Sort by date, newest first
            allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

            setNews(allNews)
            setLastUpdate(new Date())
        } catch (e) {
            console.error('Error fetching news:', e)
            setError('שגיאה בטעינת החדשות. נסה שוב מאוחר יותר.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNews()
        // Refresh every 5 minutes
        const interval = setInterval(fetchNews, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            return date.toLocaleString('he-IL', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return dateStr
        }
    }

    const getSourceColor = (source: string) => {
        switch (source) {
            case 'Ynet': return 'bg-red-600'
            case 'Mako': return 'bg-orange-600'
            default: return 'bg-blue-600'
        }
    }

    return (
        <div className="h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-dark-bg/95 backdrop-blur-lg py-4 z-10">
                <div>
                    <h1 className="text-2xl font-bold text-white">חדשות ישראל</h1>
                    {lastUpdate && (
                        <div className="flex items-center gap-2 text-sm text-dark-textSecondary mt-1">
                            <Clock size={14} />
                            <span>עודכן לאחרונה: {lastUpdate.toLocaleTimeString('he-IL')}</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={fetchNews}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    רענן
                </button>
            </div>

            {/* Error state */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg mb-6">
                    <AlertCircle size={20} className="text-red-400" />
                    <span className="text-red-300">{error}</span>
                </div>
            )}

            {/* Loading state */}
            {loading && news.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                    <RefreshCw size={48} className="text-blue-400 animate-spin mb-4" />
                    <span className="text-dark-textSecondary">טוען חדשות...</span>
                </div>
            )}

            {/* News grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {news.map((item, index) => (
                    <a
                        key={index}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 bg-dark-card rounded-xl border border-dark-border hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
                    >
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${getSourceColor(item.source)}`}>
                                {item.source}
                            </span>
                            <ExternalLink size={14} className="text-dark-textSecondary group-hover:text-blue-400 transition-colors flex-shrink-0" />
                        </div>

                        <h3 className="font-medium text-white group-hover:text-blue-300 transition-colors mb-2 line-clamp-3" dir="rtl">
                            {item.title}
                        </h3>

                        {item.description && (
                            <p className="text-sm text-dark-textSecondary line-clamp-2 mb-3" dir="rtl">
                                {item.description}
                            </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-dark-textSecondary">
                            <Clock size={12} />
                            <span>{formatDate(item.pubDate)}</span>
                        </div>
                    </a>
                ))}
            </div>

            {/* Empty state */}
            {!loading && news.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertCircle size={48} className="text-dark-textSecondary mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">אין חדשות זמינות</h3>
                    <p className="text-dark-textSecondary mb-4">לא הצלחנו לטעון חדשות כרגע</p>
                    <button
                        onClick={fetchNews}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        נסה שוב
                    </button>
                </div>
            )}
        </div>
    )
}

export default NewsPage
