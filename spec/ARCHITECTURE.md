# ARCHITECTURE: בדיחה בלחיצה

## 1. מבנה המערכת בשלוש שכבות

### צד לקוח
- index.html אחד, עם ה-CSS וה-JavaScript בתוכו. עברית, `lang="he"` ו-`dir="rtl"`.
- הלוגו, ארבעת הציורים של הדמות והרקע הם קבצי SVG בתיקיית assets. הדף מחליף ביניהם לפי `data-state` על הבועה: idle, think, joke, error.
- טופס עם תיבה (maxlength 100) וכפתור. בשליחה: POST ל-/api/joke, ואז הצגת הבדיחה או ההודעה.
- מתחת לבדיחה: כפתור "צחקתי" עם מונה (POST ל-/api/laugh, ננעל אחרי לחיצה), ורשימת "הכי מצחיקות" מ-/api/top, שנטענת מחדש אחרי כל צחוק, בלי polling.
- הדף מדבר רק עם /api. הוא לא מדבר עם Supabase ולא מחזיק אף מפתח.
- הטקסט שחוזר מוצג עם textContent, לא innerHTML.
- רושם את sw.js כ-service worker.

### לוגיקה
- שלוש Vercel Functions: api/joke.js, ‏api/laugh.js, ‏api/top.js, כל אחת עם `export default { async fetch(request) { ... } }`. רק הפונקציות בתיקיית api מדברות עם OpenAI ועם Supabase.
- api/joke.js מקבלת רק POST עם JSON: `{ "topic": "..." }`. מחזירה תמיד JSON: `{ "joke": "...", "id": "..." }` בהצלחה, `{ "error": "..." }` בשגיאה. היא שומרת כל בדיחה בטבלה. אם השמירה נכשלת, הבדיחה עדיין חוזרת (בלי id), והשגיאה נרשמת ב-console.error.
- api/laugh.js: POST עם `{ "id": "..." }`. בודקת שזה uuid וקוראת ל-`add_laugh` דרך rpc. מחזירה `{ "laughs": n }`.
- api/top.js: GET. מחזירה את חמש הבדיחות עם הכי הרבה צחוקים, רק עם צחוק אחד לפחות: `{ "jokes": [{ "id", "text", "laughs" }] }`.
- lib/supabase.js: הלקוח היחיד של Supabase (`@supabase/supabase-js`), עם `SUPABASE_URL` ו-`SUPABASE_SECRET_KEY` מ-process.env.
- חותכת את הנושא ל-100 תווים. נושא ריק או גוף שבור נחשבים "אין נושא".
- פונה ל-OpenAI, מחלצת את הטקסט, ומחזירה רק את הבדיחה.

### נתונים
Supabase (Postgres). טבלה אחת, public.jokes, נעולה: RLS פעיל בלי policy, והגישה רק ל-service_role, כלומר רק מהפונקציות בתיקיית api.

## 2. מבנה הנתונים
הטבלה public.jokes (migration בשם create_jokes, והקובץ db/create_jokes.sql):

| עמודה | סוג | הערות |
|---|---|---|
| id | uuid | מפתח ראשי, ברירת מחדל gen_random_uuid() |
| created_at | timestamptz | ברירת מחדל now() |
| topic | text | הנושא, יכול להיות ריק |
| text | text | חובה |
| laughs | integer | חובה, ברירת מחדל 0 |

- הרשאות: grant select, insert, update ל-service_role בלבד. revoke all מ-anon ומ-authenticated.
- הפונקציה public.add_laugh(joke_id uuid): מוסיפה 1 ל-laughs בפעולה אחת ומחזירה את המספר החדש, כך ששתי לחיצות במקביל לא דורסות זו את זו. security invoker, ‏search_path ריק, שמות מלאים. execute ל-service_role בלבד.

החוזה בין הדף לפונקציות:

| כיוון | הגוף | סטטוס |
|---|---|---|
| הדף אל הפונקציה | `{ "topic": "חתולים" }`, או `{ "topic": "" }` | POST |
| הפונקציה אל הדף, הצלחה | `{ "joke": "...", "id": "uuid" }` | 200 |
| הפונקציה אל הדף, שגיאה | `{ "error": "הודעה קצרה בעברית" }` | 405, 500 או 502 |
| הדף אל /api/laugh | `{ "id": "uuid" }` | POST |
| /api/laugh אל הדף | `{ "laughs": 3 }` | 200 |
| הדף אל /api/top | בלי גוף | GET |
| /api/top אל הדף | `{ "jokes": [{ "id", "text", "laughs" }] }` | 200 |

## 3. התחברות והרשאות
אין כניסה, רמה 0. כל גולש יכול לבקש בדיחה. ההגנה על העלות היא אורך נושא מוגבל, ומגבלת הוצאה בחשבון OpenAI.

## 4. שכבת ה-AI
- הקריאה: POST אל `https://api.openai.com/v1/responses`, מתוך הפונקציה בלבד, עם הכותרת `Authorization: Bearer <OPENAI_API_KEY>`.
- הגוף: `model` מ-OPENAI_MODEL או `gpt-5`, ‏`instructions` עם הפרומפט המרכזי, `input` עם הנושא, ‏`reasoning: { effort: "low" }` ו-`max_output_tokens`.
- הפרומפט המרכזי: "אתה כותב בדיחות קצרות בעברית. כתוב בדיחה אחת בלבד, עד ארבעה משפטים, נקייה ומתאימה לכל גיל. בלי הקדמה, בלי הסבר ובלי אימוג׳י. רק הבדיחה."
- ה-input: "נושא הבדיחה: [הנושא]". בלי נושא: "אין נושא. ספר בדיחה כללית על החיים."
- התשובה: לוקחים את `output_text` אם קיים. אחרת, את הטקסט מהפריטים מסוג `message` במערך `output`, בחלקים מסוג `output_text`. אין טקסט: שגיאה.
- שגיאה מ-OpenAI: הסטטוס והקוד נרשמים ב-console.error, והדף מקבל הודעה קצרה בעברית לפי הקוד: 401, נגמר הקרדיט, מגבלת הוצאה, 429, 404.
- לפני כתיבת הקוד בודקים בתיעוד העדכני של OpenAI ושל Vercel את מבנה הבקשה והתשובה.

## 5. אינטגרציות, APIs ואוטומציות
- OpenAI Responses API, מהפונקציה.
- Supabase לשמירה, מהפונקציות בתיקיית api בלבד.
- אין אוטומציות ואין שירותים נוספים.

## 6. מפתחות וסודות
| השם | איפה | סוג | מה הוא |
|---|---|---|---|
| OPENAI_API_KEY | Vercel, Environment Variables, ב-Production וב-Preview | Secret | מפתח ה-production, ‏joke-in-a-click. רק הפונקציה קוראת אותו |
| OPENAI_API_KEY | .env.local במחשב, רק בהרצה מקומית | קובץ שלא נכנס לריפו | מפתח dev נפרד, ‏joke-in-a-click-dev. הסטודנט מדביק אותו ביד |
| OPENAI_MODEL | Vercel, Environment Variables | Config, לא חובה | שם המודל. בלי המשתנה: gpt-5 |
| SUPABASE_URL | Vercel, Environment Variables | Config | כתובת הפרויקט ב-Supabase. לא סוד, אבל נשמרת רק בשרת |
| SUPABASE_SECRET_KEY | Vercel, Environment Variables, ב-Production וב-Preview | Secret | המפתח הסודי של Supabase. רק הפונקציות קוראות אותו. הסטודנט שם אותו ב-Vercel בעצמו, ו-Claude לא מבקש אותו |

- המפתח לא מופיע בשום קובץ שנכנס לריפו, ולא בצ׳אט עם Claude. היחיד: .env.local במחשב, למי שמריץ מקומית.
- מפתח ה-production נשמר ב-Vercel כבר ב-Milestone 1. אחרי כל שינוי במשתנה: Redeploy.
- .claude/settings.json חוסם ל-Claude את הקריאה של .env ושל .env.*. בריפו יש .env.example עם השורה OPENAI_API_KEY= בלבד. גם .env.local מכיל רק את השורה הזו, עם מפתח ה-dev. שם המודל לא נכנס לקובץ: בלי OPENAI_MODEL הקוד משתמש ב-gpt-5.
- הדפדפן לא מקבל אף מפתח. הוא פונה רק ל-/api (joke, laugh, top), ולא ל-Supabase.
- בריפו, .env.example כולל שתי שורות בלבד: OPENAI_API_KEY= ו-SUPABASE_SECRET_KEY=, בלי ערכים.
- .gitignore כולל `.env`, ‏`.env.*`, את החריגה `!.env.example`, ‏`.vercel` ו-`node_modules`. הוא נוצר לפני הקומיט הראשון.
- בחשבון OpenAI: קרדיט מראש, Auto recharge כבוי, ומגבלת הוצאה חודשית.

## 7. מבנה התיקיות של הקוד
```
index.html              המסך, עם ה-CSS וה-JavaScript
manifest.webmanifest    name, short_name, start_url, display: standalone, lang: he, dir: rtl, אייקונים
sw.js                   service worker, network-first, בלי /api
package.json            "type": "module", ו-dependency אחד: @supabase/supabase-js
.gitignore              .env, .env.*, !.env.example, .vercel, node_modules
.env.example            שורה אחת בלבד: OPENAI_API_KEY=, בלי ערך ובלי הערות
.claude/settings.json   חוסם ל-Claude את הקריאה של .env ושל .env.*
assets/logo.svg
assets/mascot-idle.svg, mascot-think.svg, mascot-joke.svg, mascot-error.svg
assets/bg-dots.svg, bg-doodles.svg
assets/icon.svg, icon-maskable.svg
assets/icon-192.png, icon-512.png, icon-512-maskable.png
api/joke.js             יוצרת בדיחה ב-OpenAI ושומרת אותה
api/laugh.js            מוסיפה צחוק (rpc ל-add_laugh)
api/top.js              חמש הבדיחות הכי מצחיקות
lib/supabase.js         הלקוח היחיד של Supabase, רק הפונקציות ב-api משתמשות בו
db/create_jokes.sql     ה-SQL של ה-migration create_jokes
spec/                   מסמכי האיפיון, ו-spec/plans
```

ה-service worker:
- באירוע install שומר במטמון את /, את ה-manifest, את קבצי ה-SVG מתיקיית assets ואת שני האייקונים.
- בכל בקשת GET מאותה כתובת: קודם רשת, ושומר עותק. אין רשת: מחזיר מהמטמון.
- בקשה ל-/api (כולל laugh ו-top), בקשה שאינה GET, או בקשה לכתובת אחרת: לא נוגע בה. כשמשנים את רשימת הקבצים, מעלים את גרסת המטמון (עכשיו joke-v2).

## הנחות והחלטות
- בלי ai-tests.md. במקומו, חמש בדיקות ידניות בתנאי ההשלמה של Milestone 2. המוצר קטן, והפלט הוא טקסט חופשי.
- שני גופנים מ-Google Fonts, Fredoka ו-Playpen Sans Hebrew, עם גיבוי ל-system-ui. ה-service worker לא שומר אותם, כי הם מכתובת אחרת.
- CSS ו-JavaScript בתוך index.html, כי יש מסך אחד.
- `reasoning: { effort: "low" }` כדי שהבדיחה תחזור מהר. אם התיעוד העדכני לא תומך בשדה הזה במודל שנבחר, מורידים אותו.
- הפונקציה כותבת console.log קצר לכל בדיחה (הנושא והמודל), כדי לראות פניות ב-Logs.
