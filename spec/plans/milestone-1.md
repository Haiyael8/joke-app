# תוכנית Milestone 1: Walking Skeleton

## מטרה
הדף והפונקציה באוויר ב-Vercel, באותה כתובת, ומדברים זה עם זה. עוד בלי AI.

## מצב התחלתי (נבדק)
- קיימים מההקמה: `.gitignore`, ‏`.env.example`, ‏`.claude/settings.json`.
- הריפו מחובר ל-`https://github.com/Haiyael8/joke-app.git`, יש קומיט ראשון.

## קבצים לבנייה
| קובץ | תוכן |
|---|---|
| `index.html` | המסך הראשי לפי DESIGN.md: לוגו, הסבר, תווית, תיבה (עד 100 תווים), כפתור, בועה עם הדמות, שורת תחתית. ארבעה מצבים (idle, think, joke, error) לפי `data-state`. הבדיחה מוצגת עם `textContent` |
| `api/joke.js` | `export default { fetch }`. POST בלבד, מחזירה `{ joke: "בדיחה זמנית מהשרת: [הנושא]. המפתח: נמצא/חסר" }`. אף פעם לא המפתח עצמו. `console.log` אחד לכל בקשה. בלי CORS ובלי OPTIONS |
| `package.json` | `"type": "module"`, בלי dependencies |

## שלבים
1. תכנון: המסמך הזה.
2. בנייה: הקבצים שלמעלה.
3. הרצה: בכתובת Vercel (או `vercel dev`, לבחירתך).
4. דחיפה: `git push` ל-main, ואז ב-Vercel: New Project, Import לריפו, Framework Preset: Other, Deploy.

## ביד אחרי הפריסה הראשונה
- OpenAI, API keys: מפתח production בשם `joke-in-a-click`.
- Vercel, Environment Variables: `OPENAI_API_KEY`, סוג Secret, בסביבות Production ו-Preview. אחר כך Redeploy.
- רשות, הרצה מקומית: מפתח dev בשם `joke-in-a-click-dev`, מודבק ביד ב-`.env.local`, ואז `vercel dev`.

## תנאי השלמה
1. הכתובת נפתחת בטלפון, בעברית, RTL, בעיצוב של DESIGN.md.
2. לחיצה מציגה "בדיחה זמנית מהשרת" עם הנושא ו"המפתח: נמצא".
3. ב-Network: בקשת POST אחת ל-`/api/joke`, באותה כתובת.
4. ב-Logs של Vercel יש שורה לכל לחיצה.
5. אין כותרות CORS ואין טיפול ב-OPTIONS.
6. ב-GitHub אין `.env` ואין `.env.local`. יש `.env.example` ו-`.claude/settings.json`.
7. מקומית: אותה תוצאה ב-`http://localhost:3000`.
