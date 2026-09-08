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

أضف رابط لوحة التحكم الجديد إلى Redirect URLs:

`https://www.watin.shop/admin.html`

لا تضع Service Role Key داخل ملفات الموقع. المفتاح الموجود في `supabase-config.js` هو Publishable Key.
