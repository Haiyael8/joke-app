# תוכנית Milestone 4: האפליקציה זוכרת

## מטרה
כל בדיחת AI נשמרת ב-Supabase, אפשר ללחוץ "צחקתי", ורשימת "הכי מצחיקות" מתעדכנת אחרי כל צחוק.

## מצב התחלתי (נבדק)
- פרויקט Supabase אחד, `joke-app` (`mwkiwxruejvdypipnoyp`), פעיל. אין צורך לשאול באיזה לעבוד.
- ב-Vercel כבר שמורים `OPENAI_API_KEY` ו-`SUPABASE_SECRET_KEY`. `SUPABASE_URL` נוסף בנפרד (לא סוד).
- `sw.js` כבר בגרסה `joke-v2`, והוא לא נוגע ב-`/api`.
- `.env.example` צריך שתי שורות. אני חסום מלגעת בו, ולכן זה נעשה ביד.

## קבצים
| קובץ | תוכן |
|---|---|
| `db/create_jokes.sql` | ה-migration `create_jokes`: הטבלה `public.jokes`, RLS בלי policy, הרשאות ל-`service_role` בלבד, והפונקציה `public.add_laugh` |
| `lib/supabase.js` | הלקוח היחיד, מ-`@supabase/supabase-js`. `SUPABASE_URL` ו-`SUPABASE_SECRET_KEY` מ-`process.env` |
| `package.json` | הוספת `@supabase/supabase-js` ב-dependencies |
| `api/joke.js` | שומרת כל בדיחה ומחזירה `{ joke, id }`. כשל בשמירה: הבדיחה עדיין חוזרת, והשגיאה ב-`console.error` |
| `api/laugh.js` | POST עם `id`, בדיקת uuid, `rpc('add_laugh')`, מחזירה `{ laughs }` |
| `api/top.js` | GET: חמש הבדיחות עם הכי הרבה צחוקים, רק עם `laughs >= 1` |
| `index.html` | כפתור "צחקתי" עם מונה (ננעל אחרי לחיצה) ורשימת "הכי מצחיקות" שנטענת מחדש אחרי כל צחוק, בלי polling |

## נקודות עצירה
1. אחרי הצגת ה-SQL והרצתו, והרצת `get_advisors` עם הסבר בעברית: עצירה, ואתם בודקים שהטבלה נעולה.
2. אחרי כתיבת הקוד ובדיקתו, לפני ה-push: עצירה. המפתח הסודי כבר ב-Vercel ואני לא מבקש אותו.

## שלבים
1. תכנון: המסמך הזה, ו-`db/create_jokes.sql`.
2. בנייה: ה-migration, ואז הקוד.
3. הרצה: בכתובת Vercel, או `vercel dev`.
4. דחיפה: `git push` ל-main, אחרי אישורכם.

## תנאי השלמה
כמו ב-`spec/MILESTONES.md`, Milestone 4, שמונה סעיפים.
