# ARCHITECTURE: בדיחה בלחיצה

## 1. מבנה המערכת בשלוש שכבות

### צד לקוח
- index.html אחד, עם ה-CSS וה-JavaScript בתוכו. עברית, `lang="he"` ו-`dir="rtl"`.
- הלוגו, ארבעת הציורים של הדמות והרקע הם קבצי SVG בתיקיית assets. הדף מחליף ביניהם לפי `data-state` על הבועה: idle, think, joke, error.
- טופס עם תיבה (maxlength 100) וכפתור. בשליחה: POST ל-/api/joke, ואז הצגת הבדיחה או ההודעה.
- Milestone 4: מתחת לבדיחה כפתור "צחקתי" עם מונה (POST ל-/api/laugh, ננעל אחרי לחיצה), ורשימת "הכי מצחיקות" מ-/api/top, שנטענת מחדש אחרי כל צחוק, בלי polling.
- אחרי Milestone 6: שלוש לשוניות בתחתית, בדיחה, קהילה ואהבתי, וכל אחת כתובת עם # (#joke, ‏#community, ‏#liked). מתחת לכל בדיחה רכיב הצבעה אחד, "אהבתי" ו"לא אהבתי". "צחקתי" ו"הכי מצחיקות" מוחלפים: "הכי מצחיקות" עוברת ללשונית הקהילה.
- הדף מדבר רק עם /api. הוא לא קורא ולא כותב אף טבלה.
- auth.js בשורש (Milestone 5): כל הכניסה בדפדפן (הרשמה, כניסה, התנתקות, שמירת הטוקן), עם @supabase/supabase-js מ-jsDelivr בגרסה קבועה. הספרייה בדפדפן משמשת לכניסה בלבד. הכתובת והמפתח הציבורי מגיעים מ-/api/config, ואין בדפדפן אף מפתח סודי.
- כל קריאה ל-/api שולחת את הטוקן בכותרת Authorization, אם יש. תשובת 401 עם auth_required כשנשלח טוקן: הדף מתנתק לבד.
- הטקסט שחוזר מהשרת או מהמשתמש מוצג עם textContent, אף פעם לא innerHTML.
- אין טעינה בטיימר (polling). רשימה נטענת כשנכנסים ללשונית, ואחרי פעולה.
- רושם את sw.js כ-service worker.

### לוגיקה
- Vercel Functions, כל אחת עם `export default { async fetch(request) { ... } }`. רק הפונקציות בתיקיית api מדברות עם OpenAI ועם Supabase.
  - עד Milestone 4: api/joke.js, ‏api/laugh.js, ‏api/top.js.
  - Milestone 5 מוסיף api/config.js ו-api/delete-account.js. Milestone 6 מוסיף api/vote.js ו-api/feed.js, ומוחק את api/laugh.js ואת api/top.js (feed.js מחליפה את top.js).
- api/joke.js מקבלת רק POST עם JSON: `{ "topic": "..." }`. מחזירה תמיד JSON: `{ "joke": "...", "id": "...", "author_name": ... }` בהצלחה, `{ "error": "..." }` בשגיאה. היא שומרת כל בדיחה בטבלה. אם השמירה נכשלת, הבדיחה עדיין חוזרת (בלי id), והשגיאה נרשמת ב-console.error. מ-Milestone 5: אם יש טוקן, מזהים את המשתמש לפני הקריאה ל-OpenAI. טוקן ש-Supabase לא מכיר: 401 עם auth_required, בלי לפנות ל-OpenAI. Supabase לא זמין: הבדיחה בכל זאת מגיעה, בלי שמירה. בשמירה: user_id ו-author_name מהטוקן, ו-author_name הוא null לאורח.
- api/laugh.js ו-api/top.js (Milestone 4, נמחקות ב-Milestone 6): laugh היא POST עם `{ "id": "..." }`, בודקת שזה uuid וקוראת ל-`add_laugh` דרך rpc, ומחזירה `{ "laughs": n }`. top היא GET שמחזירה את חמש הבדיחות עם הכי הרבה צחוקים, רק עם צחוק אחד לפחות: `{ "jokes": [{ "id", "text", "laughs" }] }`.
- api/config.js (Milestone 5): GET בלבד. מחזירה `{ url, publishableKey }` מ-SUPABASE_URL ומ-SUPABASE_PUBLISHABLE_KEY. אם אחד חסר, או שהמפתח במשתנה הוא מפתח סודי: 500 וקוד auth_not_configured. אף פעם לא מחזירה מפתח סודי.
- api/delete-account.js (Milestone 5): POST עם טוקן בלבד. קודם מנקה את author_name בבדיחות של המשתמש, ואז `supabase.auth.admin.deleteUser`. הבדיחות נשארות, בלי שם ובלי בעלים. מחזירה `{ deleted: true }`.
- api/vote.js (Milestone 6): POST עם טוקן בלבד. הגוף `{ id, value }`, ו-value הוא 1, ‏-1 או 0 בדיוק, כמספר. id חייב להיות uuid. קוראת ל-`cast_vote` דרך rpc, עם voter מהטוקן. user_id בגוף לא נחשב. בדיחה שלא קיימת: 404. מחזירה `{ likes, dislikes, my_vote }`.
- api/feed.js (Milestone 6): GET עם mode של new, top או liked. new ו-top גם לאורח. liked רק עם טוקן, אחרת 401. קוראת ל-`joke_feed` דרך rpc. כמות השורות: 20 ל-new, 10 ל-top, 50 ל-liked. מחזירה `{ jokes }`, ואף פעם לא user_id.
- lib/supabase.js: הלקוח היחיד של Supabase עם המפתח הסודי (`@supabase/supabase-js`), עם `SUPABASE_URL` ו-`SUPABASE_SECRET_KEY` מ-process.env. מ-Milestone 5 נוספות: `hasToken(request)`, ‏`getUserFromRequest(request, supabase)` שמחזירה את המשתמש או null וזורקת שגיאה כש-Supabase לא זמין, ו-`displayName(user)` שמחזירה את user_metadata.full_name, עד 30 תווים.
- lib/http.js (Milestone 5): עזרים קטנים. תשובת JSON עם Cache-Control: no-store, תשובת 401 עם `code: "auth_required"`, וקריאת גוף עם מגבלת גודל.
- חותכת את הנושא ל-100 תווים. נושא ריק או גוף שבור נחשבים "אין נושא".
- פונה ל-OpenAI, מחלצת את הטקסט, ומחזירה רק את הבדיחה.

### נתונים
Supabase (Postgres) ו-Supabase Auth. טבלאות נעולות: public.jokes, ומ-Milestone 6 גם public.votes. RLS פעיל בלי policy, והגישה רק ל-service_role, כלומר רק מהפונקציות בתיקיית api. המשתמשים נמצאים ב-auth.users.

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

### Milestone 5: בדיחה מחוברת למשתמש (migration בשם add_joke_authors, והקובץ db/add_joke_authors.sql)
שתי עמודות חדשות ב-public.jokes, שתיהן לא חובה כי אורח לא מחובר:

| עמודה | סוג | הערות |
|---|---|---|
| user_id | uuid | references auth.users (id) on delete set null |
| author_name | text | null, או בין 1 ל-30 תווים אחרי btrim (check) |

- אינדקס על user_id. הנעילה של הטבלה לא משתנה, ולא מוחקים ולא משנים עמודות קיימות.

### Milestone 6: הצבעות (migration בשם create_votes, והקובץ db/create_votes.sql)
הטבלה public.votes:

| עמודה | סוג | הערות |
|---|---|---|
| user_id | uuid | חובה, references auth.users (id) on delete cascade |
| joke_id | uuid | חובה, references public.jokes (id) on delete cascade |
| value | smallint | חובה, check שהוא -1 או 1 |
| voted_at | timestamptz | חובה, ברירת מחדל now() |

- המפתח הראשי: (user_id, joke_id). זו השורה שמבטיחה קול אחד לכל משתמש לכל בדיחה. אינדקס על joke_id.
- הנעילה: RLS דולק בלי policy, ‏revoke all מ-anon ומ-authenticated, ו-grant select, insert, update, delete ל-service_role.
- `public.cast_vote(voter uuid, target uuid, new_value smallint)`, ב-plpgsql. ‏1 או -1: insert עם on conflict (user_id, joke_id) do update של value ו-voted_at. ‏0: מוחקת את ההצבעה. כל ערך אחר: שגיאה. מחזירה שורה אחת: likes, ‏dislikes ו-my_vote של הבדיחה.
- `public.joke_feed(viewer uuid, mode text, max_rows integer default 20)`, ב-sql, stable. מחזירה id, ‏created_at, ‏topic, ‏text, ‏author_name, ‏likes, ‏dislikes ו-my_vote. שלושה מצבים: new לפי created_at מהחדש, ‏top רק בדיחות עם like אחד לפחות, לפי likes פחות dislikes ואז לפי likes, ו-liked רק בדיחות ש-viewer סימן בהן 1, לפי voted_at. viewer הוא null לאורח. max_rows בין 1 ל-50.
- בשתי הפונקציות: security invoker, ‏`set search_path = ''`, ושמות מלאים כמו public.votes. ‏revoke execute מ-public, ‏anon ו-authenticated, ו-grant execute ל-service_role.
- העמודה laughs והפונקציה add_laugh נשארות בבסיס הנתונים. לא מוחקים נתונים. האפליקציה מפסיקה להשתמש בהן.

### כללים לכל SQL
- כל פונקציה בבסיס הנתונים: revoke execute מ-public, ‏anon ו-authenticated, ו-grant execute ל-service_role.
- כל SQL נשמר קודם כקובץ בתיקייה db, מוצג, ורץ דרך המחבר של Supabase רק אחרי אישור.

החוזה בין הדף לפונקציות, אחרי Milestone 6:

| הפונקציה | בקשה | טוקן | תשובה |
|---|---|---|---|
| /api/config | GET | לא | { url, publishableKey } |
| /api/joke | POST { topic } | רשות | { joke, id, author_name } |
| /api/feed?mode=new או top | GET | רשות | { jokes: [{ id, topic, text, author_name, likes, dislikes, my_vote, created_at }] } |
| /api/feed?mode=liked | GET | חובה | כמו למעלה |
| /api/vote | POST { id, value } | חובה | { likes, dislikes, my_vote } |
| /api/delete-account | POST | חובה | { deleted: true } |

- שגיאה: `{ error: "הודעה קצרה בעברית" }`. כשצריך להתחבר: 401 עם `{ error, code: "auth_required" }`.
- כל התשובות עם Cache-Control: no-store, כי הן תלויות במי ששואל.
- עד Milestone 4 החוזה היה: /api/joke מחזירה { joke, id }, ‏/api/laugh מחזירה { laughs }, ו-/api/top מחזירה { jokes: [{ id, text, laughs }] }.

## 3. התחברות והרשאות
- Milestones 1 עד 4: אין כניסה, רמה 0. כל גולש יכול לבקש בדיחה. ההגנה על העלות היא אורך נושא מוגבל, ומגבלת הוצאה בחשבון OpenAI.
- מ-Milestone 5: רמה 3 לפי course-stack.md, משתמשים אמיתיים עם הרשמה עצמית, ב-Supabase Auth. הרשמה וכניסה עם מייל וסיסמה, שם לתצוגה, התנתקות ומחיקת חשבון. כניסה עם Google היא בונוס, אחרי Milestone 6.
- אורח ממשיך לבקש בדיחות ולקרוא את הקהילה. כדי לדרג צריך חשבון.
- הטוקן נשלח בכותרת Authorization. כל פונקציה שצריכה לדעת מי שואל מזהה את המשתמש רק עם `supabase.auth.getUser(token)`. מזהה משתמש או שם שמגיעים מהדף לא נחשבים.
- הגדרות ידניות בדשבורד של Supabase: Allow new users to sign up דולק, ו-Confirm email כבוי. ב-URL Configuration: ב-Site URL הכתובת ב-Vercel, וב-Redirect URLs אותה כתובת עם /** בסוף (ולמי שמריץ במחשב גם http://localhost:3000/**).
- flowType של pkce בלקוח, כדי שהבונוס של Google יעבוד.
- בונוס Google: auth.js מוסיף google() עם signInWithOAuth. בשרת לא משתנה כלום. ה-Client Secret של Google נשאר רק בדשבורד של Supabase.

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
- Supabase לשמירה ולכניסה (Supabase Auth). הפונקציות בתיקיית api הן היחידות שניגשות לטבלאות. הדפדפן פונה אל /auth/v1 של Supabase לכניסה בלבד, ואף פעם אל /rest/v1.
- בונוס: Google כספק כניסה, דרך Supabase.
- אין אוטומציות ואין שירותים נוספים.

## 6. מפתחות וסודות
| השם | איפה | סוג | מה הוא |
|---|---|---|---|
| OPENAI_API_KEY | Vercel, Environment Variables, ב-Production וב-Preview | Secret | מפתח ה-production, ‏joke-in-a-click. רק הפונקציה קוראת אותו |
| OPENAI_API_KEY | .env.local במחשב, רק בהרצה מקומית | קובץ שלא נכנס לריפו | מפתח dev נפרד, ‏joke-in-a-click-dev. הסטודנט מדביק אותו ביד |
| OPENAI_MODEL | Vercel, Environment Variables | Config, לא חובה | שם המודל. בלי המשתנה: gpt-5 |
| SUPABASE_URL | Vercel, Environment Variables | Config | כתובת הפרויקט ב-Supabase. לא סוד, אבל נשמרת רק בשרת |
| SUPABASE_SECRET_KEY | Vercel, Environment Variables, ב-Production וב-Preview | Secret | המפתח הסודי של Supabase. רק הפונקציות קוראות אותו. הסטודנט שם אותו ב-Vercel בעצמו, ו-Claude לא מבקש אותו |
| SUPABASE_PUBLISHABLE_KEY | Vercel, Environment Variables, כל הסביבות | Config. חדש ב-Milestone 5 | המפתח הציבורי של Supabase. לא סוד. /api/config מחזירה אותו לדף. את הערך Claude יכול להביא דרך המחבר, עם get_publishable_keys |
| Client Secret של Google | רק בדשבורד של Supabase, בספק Google | בונוס | לא בקוד, לא בריפו ולא ב-Vercel |

- המפתח לא מופיע בשום קובץ שנכנס לריפו, ולא בצ׳אט עם Claude. היחיד: .env.local במחשב, למי שמריץ מקומית.
- מפתח ה-production נשמר ב-Vercel כבר ב-Milestone 1. אחרי כל שינוי במשתנה: Redeploy.
- .claude/settings.json חוסם ל-Claude את הקריאה של .env ושל .env.*. בריפו יש .env.example עם השורה OPENAI_API_KEY= בלבד. גם .env.local מכיל רק את השורה הזו, עם מפתח ה-dev. שם המודל לא נכנס לקובץ: בלי OPENAI_MODEL הקוד משתמש ב-gpt-5.
- הדפדפן לא מקבל אף מפתח סודי. הוא פונה ל-/api, ולספריית הכניסה של Supabase רק בנתיב /auth/v1, עם המפתח הציבורי מ-/api/config.
- בריפו, .env.example כולל שתי שורות בלבד: OPENAI_API_KEY= ו-SUPABASE_SECRET_KEY=, בלי ערכים. הוא לא משתנה ב-Milestone 5: המפתח הציבורי אינו סוד, ולכן הוא לא בקובץ.
- .gitignore כולל `.env`, ‏`.env.*`, את החריגה `!.env.example`, ‏`.vercel` ו-`node_modules`. הוא נוצר לפני הקומיט הראשון.
- בחשבון OpenAI: קרדיט מראש, Auto recharge כבוי, ומגבלת הוצאה חודשית.

## 7. מבנה התיקיות של הקוד
```
index.html              המסך, עם ה-CSS וה-JavaScript
manifest.webmanifest    name, short_name, start_url, display: standalone, lang: he, dir: rtl, אייקונים
sw.js                   service worker, network-first, בלי /api
auth.js                 (Milestone 5) כל הכניסה בדפדפן: ready, signUp, signIn, signOut, session, token, onChange, google (בונוס)
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
api/laugh.js            מוסיפה צחוק (rpc ל-add_laugh). נמחקת ב-Milestone 6
api/top.js              חמש הבדיחות הכי מצחיקות. נמחקת ב-Milestone 6, ו-feed.js מחליפה אותה
api/config.js           (Milestone 5) { url, publishableKey }
api/delete-account.js   (Milestone 5) מחיקת חשבון
api/vote.js             (Milestone 6) הצבעה, rpc ל-cast_vote
api/feed.js             (Milestone 6) רשימות new, top ו-liked, rpc ל-joke_feed
lib/supabase.js         הלקוח היחיד של Supabase עם המפתח הסודי, ועוזרי הטוקן. רק הפונקציות ב-api משתמשות בו
lib/http.js             (Milestone 5) עזרי תשובה וקריאת גוף
db/create_jokes.sql     ה-SQL של ה-migration create_jokes
db/add_joke_authors.sql (Milestone 5) ה-SQL של add_joke_authors
db/create_votes.sql     (Milestone 6) ה-SQL של create_votes
spec/                   מסמכי האיפיון, ו-spec/plans
```

ה-service worker:
- באירוע install שומר במטמון את /, את /auth.js (מ-Milestone 5), את ה-manifest, את קבצי ה-SVG מתיקיית assets ואת שני האייקונים.
- בכל בקשת GET מאותה כתובת: קודם רשת, ושומר עותק. אין רשת: מחזיר מהמטמון.
- בקשה ל-/api (כולל כל הפונקציות), בקשה שאינה GET, או בקשה לכתובת אחרת: לא נוגע בה. כשמשנים את רשימת הקבצים, מעלים את גרסת המטמון (joke-v2 ב-Milestone 4, ובכל Milestone אחריו גרסה חדשה).

## הנחות והחלטות
- בלי ai-tests.md. במקומו, חמש בדיקות ידניות בתנאי ההשלמה של Milestone 2. המוצר קטן, והפלט הוא טקסט חופשי.
- שני גופנים מ-Google Fonts, Fredoka ו-Playpen Sans Hebrew, עם גיבוי ל-system-ui. ה-service worker לא שומר אותם, כי הם מכתובת אחרת.
- CSS ו-JavaScript בתוך index.html, כי יש מסך אחד.
- `reasoning: { effort: "low" }` כדי שהבדיחה תחזור מהר. אם התיעוד העדכני לא תומך בשדה הזה במודל שנבחר, מורידים אותו.
- הפונקציה כותבת console.log קצר לכל בדיחה (הנושא והמודל), כדי לראות פניות ב-Logs.
