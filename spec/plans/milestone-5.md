# תוכנית Milestone 5: האפליקציה מכירה אותך

## מטרה
הרשמה וכניסה עם מייל וסיסמה (Supabase Auth, רמה 3), שם לתצוגה, התנתקות ומחיקת חשבון. בדיחה של משתמש מחובר נשמרת עם השם שלו. אורח ממשיך לקבל בדיחות כמו קודם.

## לפני הקוד, ביד, בדשבורד של Supabase
1. Authentication, Sign In / Providers: Allow new users to sign up דולק, ו-Confirm email כבוי.
2. Authentication, URL Configuration: Site URL הוא הכתובת ב-Vercel. ב-Redirect URLs אותה כתובת עם `/**`, ולהרצה במחשב גם `http://localhost:3000/**`.

## קבצים
| קובץ | תוכן |
|---|---|
| `db/add_joke_authors.sql` | migration `add_joke_authors`: `user_id` (uuid, references auth.users, on delete set null), `author_name` (text, check 1 עד 30 אחרי btrim), אינדקס על `user_id`. הנעילה לא משתנה |
| `lib/http.js` | JSON עם `Cache-Control: no-store`, תשובת 401 עם `auth_required`, קריאת גוף עם מגבלת גודל |
| `lib/supabase.js` | נוספות `hasToken`, `getUserFromRequest` (משתמש או null, זורקת כש-Supabase לא זמין), `displayName` (עד 30 תווים) |
| `api/config.js` | GET: `{ url, publishableKey }`. חסר משתנה, או מפתח סודי: 500 עם `auth_not_configured` |
| `api/joke.js` | עם טוקן: מזהים משתמש לפני OpenAI. טוקן לא מוכר: 401 בלי OpenAI. Supabase לא זמין: בדיחה בלי שמירה. שמירה עם `user_id` ו-`author_name`. תשובה `{ joke, id, author_name }` |
| `api/delete-account.js` | POST עם טוקן: מנקה `author_name`, ואז `auth.admin.deleteUser`. מחזירה `{ deleted: true }` |
| `auth.js` | כל הכניסה בדפדפן: ready, signUp, signIn, signOut (scope מקומי), session, token, onChange, הודעות בעברית, `flowType: 'pkce'` |
| `index.html` | הספרייה מ-jsDelivr בגרסה קבועה ואחריה `auth.js`; כפתור חשבון; חלון כניסה והרשמה; חלון "החשבון שלי"; שליחת טוקן בכל קריאה ל-`/api`; "נכתבה עכשיו בשבילך, [שם]" |
| `sw.js` | גרסת מטמון `joke-v3`, ו-`/auth.js` ברשימת הקבצים |

## כללים
- הטוקן בכותרת `Authorization`. מזהים משתמש רק עם `supabase.auth.getUser(token)`. מזהה או שם מהגוף לא נחשבים.
- כל טקסט מהשרת או מהמשתמש מוצג עם `textContent`.
- הדפדפן פונה ל-Supabase רק ב-`/auth/v1`, אף פעם לא ל-`/rest/v1`.
- `.env.example` לא משתנה: המפתח הציבורי אינו סוד.
- `laugh` ו-`top` נשארים כמו ב-Milestone 4 (מתחלפים ב-Milestone 6).

## נקודות עצירה
1. אחרי הצגת ה-SQL, הרצתו דרך המחבר, ו-`get_advisors` עם הסבר בעברית: עצירה.
2. אחרי הקוד והבדיקה, לפני הדחיפה: אתם מוסיפים ב-Vercel את `SUPABASE_PUBLISHABLE_KEY` (Config, כל הסביבות). את הערך אפשר להביא עם `get_publishable_keys`.
3. בסוף: עצירה לבדיקה ואישור מפורש.

## שלבים
1. תכנון: המסמך הזה, ו-`db/add_joke_authors.sql`.
2. בנייה: ה-migration, ואז הקוד.
3. הרצה: בכתובת Vercel, או `vercel dev`.
4. דחיפה: `git push` ל-main, אחרי אישורכם.

## תנאי השלמה
כמו ב-`spec/MILESTONES.md`, Milestone 5, שמונה סעיפים.
