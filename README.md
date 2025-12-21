# Smart Home Dashboard | לוח בקרה בית חכם

<div dir="rtl">

## סקירה כללית

לוח בקרה מתקדם לניהול מכשירי בית חכם הבנוי על React ו-TypeScript, עם אינטגרציה מלאה ל-Home Assistant.

</div>

## Features | תכונות

- 🔐 **Secure Authentication** - User authentication with encrypted passwords
- 🏠 **Home Assistant Integration** - Full integration with Home Assistant API  
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Beautiful dark mode interface with Hebrew RTL support
- 🐳 **Docker Support** - Easy deployment with Docker and docker-compose
- ⚙️ **Configurable Environment** - Manage credentials via environment variables

## Quick Start with Docker | התחלה מהירה עם Docker

<div dir="rtl">

### דרישות מקדימות

- Docker ו-Docker Compose מותקנים במערכת
- Home Assistant פועל ונגיש ברשת

### שלב 1: שכפול הפרויקט

```bash
git clone <repository-url>
cd smart_home
```

### שלב 2: הגדרת משתני סביבה

העתק את קובץ הדוגמה:

```bash
cp .env.example .env
```

ערוך את הקובץ `.env` והגדר את הערכים שלך:

```env
# פרטי משתמש ברירת מחדל
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=YourSecurePassword123

# חיבור ל-Home Assistant
HOME_ASSISTANT_URL=http://homeassistant.local:8123
HOME_ASSISTANT_TOKEN=your_long_lived_access_token_here
```

### שלב 3: קבלת Access Token מ-Home Assistant

1. היכנס ל-Home Assistant שלך
2. לחץ על הפרופיל שלך (פינה שמאלית תחתונה)
3. גלול למטה ל-"Long-Lived Access Tokens"
4. לחץ "Create Token"
5. תן שם ל-token (למשל: "Smart Home Dashboard")
6. העתק את ה-token והדבק אותו ב-`.env` file

### שלב 4: הרצת הפרויקט

```bash
docker-compose up --build
```

הדשבורד יהיה זמין ב: **http://localhost:3001**

### שלב 5: כניסה למערכת

השתמש בשם המשתמש והסיסמה שהגדרת בקובץ `.env`

</div>

## Development | פיתוח

<div dir="rtl">

### התקנה מקומית

```bash
# התקנת תלויות
npm install

# הרצה במצב פיתוח (סרבר + קליינט)
npm run dev

# הרצה נפרדת
npm run dev:server  # Port 3001
npm run dev:client  # Port 5173
```

### בניית הפרויקט

```bash
# בניית הקליינט
npm run build

# בניית Docker image
docker build -t smart-home-dashboard .
```

</div>

## Environment Variables | משתני סביבה

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DEFAULT_USERNAME` | Default admin username | `admin` | No |
| `DEFAULT_PASSWORD` | Default admin password | `admin` | No |
| `HOME_ASSISTANT_URL` | Home Assistant URL | `http://homeassistant.local:8123` | No* |
| `HOME_ASSISTANT_TOKEN` | HA Long-Lived Access Token | - | No* |
| `NODE_ENV` | Environment mode | `production` | No |

<div dir="rtl">

*הערה: ניתן להגדיר את פרטי החיבור ל-Home Assistant דרך ממשק המשתמש במקום משתני הסביבה.

</div>

## Docker Compose with Home Assistant | Docker Compose עם Home Assistant

<div dir="rtl">

### חיבור ל-Home Assistant הרץ ב-Docker

אם Home Assistant שלך רץ ב-Docker באותה מכונה, הוסף אותו ל `docker-compose.yml`:

```yaml
version: '3.8'

services:
  homeassistant:
    image: ghcr.io/home-assistant/home-assistant:stable
    container_name: homeassistant
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./homeassistant_config:/config
    environment:
      - TZ=Asia/Jerusalem

  smart-home:
    build: .
    image: smart-home-dashboard
    container_name: smart-home-dashboard
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - ./server/data:/app/server/data
    environment:
      - NODE_ENV=production
      - DEFAULT_USERNAME=${DEFAULT_USERNAME:-admin}
      - DEFAULT_PASSWORD=${DEFAULT_PASSWORD:-admin}
      - HOME_ASSISTANT_URL=http://localhost:8123
    network_mode: host
    depends_on:
      - homeassistant
```

</div>

## Security Notes | הערות אבטחה

<div dir="rtl">

### ⚠️ חשוב לאבטחה

1. **שנה סיסמת ברירת מחדל**: אל תשתמש ב- `admin/admin` בייצור!
2. **הגן על .env**: ודא תמיד ש-`.env` ברשימת `.gitignore`
3. **Token Security**: ה-Access Token מאוחסן בקובץ JSON פשוט - הגבל גישה לתיקייה `server/data/`
4. **Network Security**: הגרסה דורשת `network_mode: host` - הגבל גישה לרשת מקומית בלבד

### שינוי סיסמה

הסיסמה מתעדכנת אוטומטית כשמשתנים משתני הסביבה:

1. עדכן את `.env` עם הסיסמה החדשה
2. הפעל מחדש את הקונטיינר: `docker-compose restart smart-home`

</div>

## Troubleshooting | פתרון בעיות

<div dir="rtl">

### הדשבורד לא מתחבר ל-Home Assistant

1. **בדוק את ה-URL**: ודא ש-`HOME_ASSISTANT_URL` נכון
2. **Token תקף**: ודא שה-Access Token עדיין תקף ב-Home Assistant
3. **רשת**: אם משתמש ב-`network_mode: host`, ודא ש-HA נגיש ב-localhost
4. **Logs**: בדוק לוגים: `docker-compose logs smart-home`

### שגיאת כניסה

1. **סיסמה שגויה**: בדוק משתני סביבה ב-`.env`
2. **נתונים קיימים**: מחק `server/data/users.json` והפעל מחדש

### Port כבר בשימוש

אם פורט 3001 תפוס, שנה ב-`docker-compose.yml`:

```yaml
ports:
  - "3002:3001"  # משתמש בפורט 3002 חיצונית
```

</div>

## API Endpoints

- `POST /api/auth/login` - User login
- `GET/POST /api/config/widget` - Widget configuration
- `GET/POST /api/config/layout` - Dashboard layout
- `GET/POST /api/config/connection` - Home Assistant connection
- `GET /api/health` - Server health check

## License

MIT
