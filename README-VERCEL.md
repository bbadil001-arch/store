# الوَتِين — Vercel

هذا المشروع Static وجاهز للرفع إلى GitHub ثم Vercel.

## إعداد Vercel

- Framework Preset: Other
- Build Command: فارغ
- Output Directory: `.`
- Install Command: فارغ

## بعد النشر

بدّل رابط الموقع في:

- `index.html` داخل canonical و Open Graph
- صفحات الفئات والمقالات
- `sitemap.xml`
- Supabase Authentication → URL Configuration

في Supabase افتح `Authentication → URL Configuration`، ثم عيّن:

- Site URL: `https://www.watin.shop`
- Redirect URLs:

`https://www.watin.shop/admin.html`

`https://www.watin.shop/account.html`

`https://www.watin.shop/account.html?mode=reset`

بعد تحديث المشروع، شغّل ملف `supabase-schema.sql` كاملاً داخل SQL Editor لإضافة حسابات العملاء والعناوين والطلبات الآمنة.

لا تضع Service Role Key داخل ملفات الموقع. المفتاح الموجود في `supabase-config.js` هو Publishable Key.
