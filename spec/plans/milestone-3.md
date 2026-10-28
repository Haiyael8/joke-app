# תוכנית Milestone 3: התקנה בטלפון

## מטרה
מתקינים את האפליקציה במסך הבית, והיא נפתחת במסך מלא בלי שורת כתובת.

## מצב התחלתי (נבדק)
- האייקונים כבר ב-`assets/`: `icon-192.png`, ‏`icon-512.png`, ‏`icon-512-maskable.png`, וגם `icon.svg`.
- ב-`index.html` אין manifest, `theme-color` או רישום service worker.
- אין `vercel.json`. Vercel מגיש קבצים סטטיים משורש הפרויקט, כך ש-`/sw.js` ו-`/manifest.webmanifest` זמינים כמו שהם.

## קבצים
| קובץ | תוכן |
|---|---|
| `manifest.webmanifest` (חדש) | `name: "בדיחה בלחיצה"`, ‏`short_name`, ‏`start_url: "/"`, ‏`display: standalone`, ‏`lang: he`, ‏`dir: rtl`, ‏`theme_color` ו-`background_color` שניהם `#FFE15A`, ושלושה אייקונים (השלישי `purpose: maskable`) |
| `sw.js` (חדש) | install: שמירת `/`, ה-manifest, כל ה-SVG והאייקונים במטמון `joke-v1`. activate: מחיקת מטמונים ישנים. fetch: network-first, שומר עותק, ובלי רשת מחזיר מהמטמון. לא נוגע בבקשה ל-`/api`, בבקשה שאינה GET ובבקשה לכתובת אחרת (למשל Google Fonts). `skipWaiting` ו-`clients.claim` כדי ששינוי יופיע ברענון |
| `index.html` | ‏`<link rel="manifest">`, ‏`<meta name="theme-color">`, אייקון (`icon.svg`, ו-`apple-touch-icon` ל-iPhone), ורישום `/sw.js` אחרי `load` |

## החלטות
- network-first ולא cache-first: כל push מופיע ברענון הבא, בלי ניהול גרסאות ידני.
- `/api` מוחרג כבר בראש מטפל ה-fetch, ולכן אף פעם לא נשמר במטמון (תנאי השלמה 4).
- אין מצב offline מלא: בלי רשת אפשר לפתוח את הדף, אבל בדיחה חדשה דורשת רשת.

## שלבים
1. תכנון: המסמך הזה.
2. בנייה: שלושת הקבצים.
3. הרצה: בכתובת Vercel (או `vercel dev`, לבחירתך).
4. דחיפה: `git push` ל-main. בלי Redeploy.

## תנאי השלמה
1. במחשב, DevTools ואז Application ואז Manifest: אין שגיאות, ושני האייקונים מופיעים.
2. בטלפון: "התקנת אפליקציה" או "הוספה למסך הבית" מופיע, והאפליקציה נפתחת בלי שורת כתובת.
3. בתוך האפליקציה המותקנת מגיעה בדיחה חדשה בכל לחיצה.
4. ב-Application ואז Cache Storage אין אף כתובת של `/api`.
5. שינוי קטן בטקסט, push, ורענון: השינוי מופיע.
