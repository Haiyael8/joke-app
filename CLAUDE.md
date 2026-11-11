# בדיחה בלחיצה — הנחיות לפרויקט

אפיון המוצר נמצא ב-`spec/` (PRD, ARCHITECTURE, DESIGN, MILESTONES, MVP, tech-stack, course-stack, product-10-definitions). התוכניות של המיילסטונים ב-`spec/plans/`. תיקיית `assets/` נשארת בשורש, כי האפליקציה משתמשת בה.

## שפה
- האפליקציה בעברית, כולל RTL.
- ההדרכה והתקשורת איתי בעברית.

## הנחיה שוטפת
- בשלב ההקמה ובכל מיילסטון: להנחות אותי צעד אחר צעד מהו השלב הבא, בצורה עניינית, קצרה, מצומצמת וברורה.
- לפני שאתה שואל שאלות: קרא קודם את הקבצים, חדד מולי את הנקודות, ואז התחל.
- בסוף כל מיילסטון: לעצור ולחכות לבדיקה ולאישור מפורש שלי.
- בסוף כל שלב: לספק לי את הלינק החי ב-Vercel.

## מפתחות
- לא לבקש ממני אף מפתח, ולא לכתוב או לקרוא מפתח בשום קובץ.
- מפתח ה-production שמור ב-Vercel. מפתח ה-dev אני מדביק בעצמי ב-`.env.local`.
- המפתח הסודי של Supabase (`SUPABASE_SECRET_KEY`) אני שם ב-Vercel בעצמי. לא לבקש אותו, ולא לכתוב או לקרוא אותו בשום קובץ.
- `SUPABASE_PUBLISHABLE_KEY` (מ-Milestone 5) הוא מסוג Config, בכל הסביבות ב-Vercel. הוא לא סוד, ואת הערך אפשר להביא דרך המחבר של Supabase עם `get_publishable_keys`. הוא לא נכנס ל-`.env.example`.
- Client Secret של Google (בונוס) נשאר רק בדשבורד של Supabase: לא בקוד, לא בריפו ולא ב-Vercel.
- `.claude/settings.json` חוסם את הקריאה של `.env` ושל `.env.*`.

## נתונים
- Supabase לשמירה. רק הפונקציות בתיקיית `api` ניגשות לטבלאות, דרך `lib/supabase.js`. הדף מדבר רק עם `/api`, ואף פעם לא עם `/rest/v1`.
- כל טבלה נעולה: RLS בלי policy, `revoke all` מ-`anon` ומ-`authenticated`, והגישה רק ל-`service_role`. כל פונקציה בבסיס הנתונים: `revoke execute` מ-`public`, `anon` ו-`authenticated`, ו-`grant` ל-`service_role`.
- כל SQL נשמר קודם כקובץ בתיקייה `db`, מוצג לי, ורץ דרך המחבר של Supabase רק אחרי אישור.
- ב-Milestone 4 יש שתי נקודות עצירה: אחרי ה-SQL ו-`get_advisors`, ולפני הדחיפה (כשאני שם את המפתח ב-Vercel). ב-Milestones 5 ו-6: עצירה אחרי ה-SQL ו-`get_advisors`.

## כניסה והרשאות (מ-Milestone 5)
- הכניסה ב-Supabase Auth, ברמה 3 לפי `spec/course-stack.md`: משתמשים אמיתיים עם הרשמה עצמית. כניסה עם Google היא בונוס אחרי Milestone 6.
- הטוקן נשלח בכותרת `Authorization`. הפונקציות מזהות משתמש רק עם `supabase.auth.getUser(token)`. מזהה משתמש או שם שמגיעים מהדף לא נחשבים.
- הספרייה של Supabase בדפדפן משמשת לכניסה בלבד (`auth.js`). הכתובת והמפתח הציבורי מגיעים מ-`/api/config`.
- כל טקסט מהשרת או מהמשתמש מוצג עם `textContent`, אף פעם לא `innerHTML`. אין polling: רשימה נטענת כשנכנסים ללשונית ואחרי פעולה.

## מודל
- Sonnet להקמה ולכל המיילסטונים. Opus רק אם נתקעים בבאג עקשן.

## שלב ההקמה (פעם אחת)
1. סידור הקבצים: `spec/` עם המסמכים, `spec/plans/` לתוכניות, `assets/` בשורש.
2. לפני הקומיט הראשון: `.gitignore` (`.env`, `.env.*`, `!.env.example`, `.vercel`, `node_modules`), `.env.example` עם השורה `OPENAI_API_KEY=` בלבד, ו-`.claude/settings.json`.
3. ריפו ציבורי חדש בשם `joke-app` ב-GitHub (משתמש: Haiyael8), חיבור התיקייה, וקומיט ראשון. אם אין הרשאות שמורות: לבקש ממני להתחבר בעצמי.
4. הלינק החי ב-Vercel, לא ב-GitHub Pages. ב-Milestone 1 להנחות אותי לייבא את הריפו ל-Vercel ולשמור שם את המפתח. כל דחיפה מתעדכנת לבד.

## מיילסטונים
- לבנות מיילסטון אחרי מיילסטון לפי `spec/MILESTONES.md`. לכל מיילסטון שיחה חדשה תחת אותה תיקייה, בשם `milestone-N`.
- ארבעה שלבים לכל מיילסטון: תכנון, בנייה, הרצה (בכתובת Vercel, או `vercel dev` לפי בחירתי), דחיפה.
- אחרי תכנון או בנייה של כל מיילסטון: לתעד ב-`spec/plans/milestone-N.md` (milestone-1.md, milestone-2.md, וכן הלאה), בעברית.
