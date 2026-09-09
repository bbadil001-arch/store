const KEY = 'alwatin-admin-state';
const ORDER_KEY = 'alwatin-orders';
const categories = { caftan: 'قفطان', djellaba: 'جلابة', jabador: 'جبادور', gandoura: 'قندورة', kandrissi: 'سروال قندريسي', accessories: 'إكسسوارات' };
const statuses = { new: 'جديد', confirmed: 'مؤكد', shipping: 'قيد التوصيل', completed: 'مكتمل', cancelled: 'ملغى' };
const seedProducts = [
  [1,'caftan',690,'قفطان رجالي مغربي','Caftan marocain pour homme',"Men's Moroccan Caftan",'assets/caftan-men-cream.png'],
  [2,'djellaba',390,'جلابة مغربية للعيد','Djellaba marocaine Aid','Moroccan Eid Djellaba','assets/djellaba-ivory.png'],
  [3,'jabador',520,'جبادور رجالي','Jabador homme',"Men's Jabador",'assets/jabador-olive.png'],
  [4,'gandoura',310,'قندورة رجالية','Gandoura homme',"Men's Gandoura",'assets/gandoura-blue.png'],
  [5,'kandrissi',890,'سروال قندريسي','Sarouel kandrissi','Kandrissi Trousers','assets/kandrissi-sand.png'],
  [6,'accessories',180,'بلغة مغربية','Babouche marocaine','Moroccan Babouche','assets/babouche-tan.png']
].map(([id,category,price,ar,fr,en,image]) => ({ id, category, price, comparePrice: 0, stock: 15, sku: `AW-${category.toUpperCase()}-${id}`, image, sizes: category === 'accessories' ? ['40','41','42','43','44','45'] : ['S','M','L','XL'], active: true, featured: id < 4, name: { ar, fr, en }, desc: { ar: 'إطلالة مغربية أصيلة لكل مناسبة.', fr: 'Une tenue marocaine authentique pour chaque occasion.', en: 'Authentic Moroccan style for every occasion.' }, seoTitle: ar, seoDescription: 'لباس مغربي رجالي أنيق من الوَتِين.' }));
const defaults = {
  settings: { storeName: 'الوَتِين', tagline: 'لباس مغربي تقليدي', phone: '', whatsapp: '', email: '', payment: 'cod', deliveryFee: 35, freeDeliveryFrom: 800, deliveryTime: '24 إلى 72 ساعة', deliveryAreas: 'جميع المدن المغربية', currency: 'MAD', defaultLanguage: 'ar', languagesAr: true, languagesFr: true, languagesEn: true, instagram: '', facebook: '' },
  content: { heroAr: 'أناقة مغربية، حتى لباب دارك.', heroFr: 'L’élégance marocaine, à votre porte.', heroEn: 'Moroccan elegance, delivered to your door.', homeDescription: 'اكتشف الجلابة، الجبادور، القندورة والقفطان المغربي الرجالي.', seoTitle: 'الوَتِين | لباس مغربي تقليدي رجالي', seoDescription: 'اكتشف اللباس المغربي الرجالي مع الدفع عند الاستلام.', seoKeywords: 'جلابة مغربية، جبادور رجالي، قندورة مغربية، قفطان رجالي، سروال قندريسي' }
};
const copy = value => JSON.parse(JSON.stringify(value));
let state = loadState();
let remoteUser = null;

function loadState() { try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved?.products) return { products: saved.products, settings: { ...defaults.settings, ...saved.settings }, content: { ...defaults.content, ...saved.content } }; } catch {} return { products: copy(seedProducts), settings: copy(defaults.settings), content: copy(defaults.content) }; }
function orders() { try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]'); } catch { return []; } }
function save(message) { localStorage.setItem(KEY, JSON.stringify(state)); toast(message); }
function esc(value = '') { return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[char])); }
function money(value) { return `${Number(value || 0).toLocaleString('fr-FR')} MAD`; }
function toast(message) { const node = document.getElementById('toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 2200); }

function showView(name) {
  document.querySelectorAll('.admin-view').forEach(view => view.classList.toggle('active', view.id === `view-${name}`));
  document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === name));
  document.getElementById('viewTitle').textContent = { overview: 'نظرة عامة', products: 'المنتوجات', orders: 'الطلبات', settings: 'إعدادات المتجر', content: 'المحتوى و SEO', backup: 'نسخ البيانات' }[name] || 'نظرة عامة';
  document.getElementById('adminSidebar').classList.remove('open');
  if (name === 'overview') renderOverview(); if (name === 'products') renderProducts(); if (name === 'orders') renderOrders();
}
function renderOverview() {
  const list = orders();
  document.getElementById('statProducts').textContent = state.products.length;
  document.getElementById('statActive').textContent = state.products.filter(item => item.active).length;
  document.getElementById('statCategories').textContent = new Set(state.products.map(item => item.category)).size;
  document.getElementById('statOrders').textContent = list.length;
  document.getElementById('recentProducts').innerHTML = state.products.slice(0, 5).map(item => `<div class="mini-row"><img src="${esc(item.image)}" alt=""><div><strong>${esc(item.name.ar)}</strong><small>${money(item.price)} · ${esc(categories[item.category])}</small></div><span class="pill ${item.active ? '' : 'off'}">${item.active ? 'مفعل' : 'مخفي'}</span></div>`).join('') || '<p class="view-muted">ما كاين حتى منتوج.</p>';
}
function renderProducts() {
  const search = document.getElementById('productSearch').value.toLowerCase(); const category = document.getElementById('categoryFilter').value;
  const list = state.products.filter(item => (!search || Object.values(item.name).some(name => name.toLowerCase().includes(search)) || item.sku.toLowerCase().includes(search)) && (category === 'all' || category === item.category));
  document.getElementById('productCount').textContent = `${list.length} منتوج`;
  document.getElementById('productTableBody').innerHTML = list.map(item => `<tr><td><div class="product-cell"><img src="${esc(item.image)}" alt=""><div><strong>${esc(item.name.ar)}</strong><small>${esc(item.sku)}</small></div></div></td><td>${esc(categories[item.category])}</td><td>${money(item.price)}</td><td>${item.stock}</td><td><span class="pill ${item.active ? '' : 'off'}">${item.active ? 'ظاهر' : 'مخفي'}</span></td><td><div class="row-actions"><button class="icon-action" data-action="edit" data-id="${item.id}">✎</button><button class="icon-action delete" data-action="delete" data-id="${item.id}">×</button></div></td></tr>`).join('') || '<tr><td colspan="6"><div class="empty-panel">ما لقاينا حتى منتوج.</div></td></tr>';
}
function fillForm(id) {
  const form = document.getElementById('productForm'); const item = state.products.find(product => String(product.id) === String(id)); const product = item || { id: '', category: 'djellaba', price: 0, comparePrice: 0, stock: 0, sku: `AW-${Date.now()}`, image: 'assets/djellaba-ivory.png', colors: [], pleats: '', sizes: ['S','M','L','XL'], active: true, featured: false, name: { ar: '', fr: '', en: '' }, desc: { ar: '', fr: '', en: '' }, seoTitle: '', seoDescription: '' };
  document.getElementById('dialogTitle').textContent = item ? 'تعديل المنتوج' : 'إضافة منتوج'; form.reset();
  const fields = { id: product.id, category: product.category, price: product.price, comparePrice: product.comparePrice, stock: product.stock, sku: product.sku, image: product.image, colors: (product.colors || []).join(', '), pleats: product.pleats || '', sizes: product.sizes.join(', '), nameAr: product.name.ar, nameFr: product.name.fr, nameEn: product.name.en, descAr: product.desc.ar, descFr: product.desc.fr, descEn: product.desc.en, seoTitle: product.seoTitle, seoDescription: product.seoDescription };
  Object.entries(fields).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value ?? ''; }); form.elements.active.checked = product.active; form.elements.featured.checked = product.featured; document.getElementById('productDialog').showModal();
  updateImagePreview(product.image);
}
function updateImagePreview(source) { const image = document.getElementById('imagePreview'); const text = document.getElementById('imagePreviewText'); if (source) { image.src = source; image.hidden = false; text.hidden = true; image.onerror = () => { image.hidden = true; text.hidden = false; text.textContent = 'تعذر عرض الصورة'; }; } else { image.hidden = true; text.hidden = false; text.textContent = 'مازال ما تختارت حتى صورة'; } }
function productFromForm(form) { const data = Object.fromEntries(new FormData(form).entries()); return { id: data.id || Date.now(), category: data.category, price: Number(data.price || 0), comparePrice: Number(data.comparePrice || 0), stock: Number(data.stock || 0), sku: data.sku, image: data.image, colors: data.colors.split(',').map(item => item.trim()).filter(Boolean), pleats: data.pleats || '', sizes: data.sizes.split(',').map(item => item.trim()).filter(Boolean), active: data.active === 'on', featured: data.featured === 'on', name: { ar: data.nameAr, fr: data.nameFr, en: data.nameEn }, desc: { ar: data.descAr, fr: data.descFr, en: data.descEn }, seoTitle: data.seoTitle || data.nameAr, seoDescription: data.seoDescription || data.descAr }; }
function renderOrders() {
  const filter = document.getElementById('orderStatusFilter').value; const list = orders().filter(item => filter === 'all' || item.status === filter); const target = document.getElementById('ordersContainer');
  if (!list.length) { target.innerHTML = '<div class="empty-panel"><div class="empty-icon">▤</div><h3>ما كايناش طلبات حالياً</h3><p>منين يوصل أول طلب من المتجر، غادي يبان هنا بالتفاصيل ديالو.</p></div>'; return; }
  target.innerHTML = `<div class="orders-list">${list.map(order => `<article class="order-card"><div class="order-top"><div><strong>${esc(order.id)}</strong><small>${new Date(order.createdAt).toLocaleString('fr-MA')}</small></div><select data-order-status="${esc(order.id)}">${Object.entries(statuses).map(([key,label]) => `<option value="${key}" ${order.status === key ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="order-customer"><strong>${esc(order.customer.name)}</strong><a href="tel:${esc(order.customer.phone)}">${esc(order.customer.phone)}</a><span>${esc(order.customer.address)}</span></div><div class="order-items">${order.items.map(item => { const product = state.products.find(entry => String(entry.id) === String(item.id)); return `<span>${esc(product?.name.ar || item.name || 'منتوج')} × ${item.qty} <b>${esc(item.size || 'M')}</b></span>`; }).join('')}</div><div class="order-bottom"><span>الدفع عند الاستلام</span><strong>${money(order.total)}</strong></div></article>`).join('')}</div>`;
}
function fillSettings() { const form = document.getElementById('settingsForm'); Object.entries(state.settings).forEach(([key,value]) => { if (form.elements[key]) form.elements[key].type === 'checkbox' ? form.elements[key].checked = Boolean(value) : form.elements[key].value = value; }); }
function fillContent() { const form = document.getElementById('contentForm'); Object.entries(state.content).forEach(([key,value]) => { if (form.elements[key]) form.elements[key].value = value; }); }
function dataFrom(form) { return Object.fromEntries(new FormData(form).entries()); }
function exportData() { const data = { version: 1, exportedAt: new Date().toISOString(), ...state, orders: orders() }; const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `alwatin-backup-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(url); toast('تهبطات نسخة البيانات'); }
function renderAll() { renderOverview(); renderProducts(); renderOrders(); fillSettings(); fillContent(); }

function remoteProduct(product) {
  return { slug: `alwatin-${product.id}`, category: product.category, name_ar: product.name.ar, name_fr: product.name.fr, name_en: product.name.en, description_ar: product.desc.ar, description_fr: product.desc.fr, description_en: product.desc.en, seo_title: product.seoTitle || product.name.ar, seo_description: product.seoDescription || product.desc.ar, image_url: product.image, price: product.price, compare_price: product.comparePrice || 0, stock: product.stock || 0, sizes: product.sizes || [], colors: product.colors || [], pleats: product.pleats || '', sku: product.sku, active: product.active, featured: product.featured };
}
function localProduct(row, index) {
  return { id: row.id || index + 1, category: row.category, price: Number(row.price), comparePrice: Number(row.compare_price || 0), stock: Number(row.stock || 0), sku: row.sku, image: row.image_url, colors: row.colors || [], pleats: row.pleats || '', sizes: row.sizes || [], active: row.active, featured: row.featured, name: { ar: row.name_ar, fr: row.name_fr, en: row.name_en }, desc: { ar: row.description_ar || '', fr: row.description_fr || '', en: row.description_en || '' }, seoTitle: row.seo_title || '', seoDescription: row.seo_description || '' };
}
async function syncProductRemote(product) { if (!remoteUser || !window.AlwatinDB) return; await AlwatinDB.upsert('products', remoteProduct(product), 'sku'); }
async function syncSettingsRemote() { if (!remoteUser || !window.AlwatinDB) return; const s = state.settings; await AlwatinDB.upsert('store_settings', { id: true, store_name: s.storeName, tagline: s.tagline, phone: s.phone, whatsapp: s.whatsapp, email: s.email, payment: s.payment, delivery_fee: s.deliveryFee, free_delivery_from: s.freeDeliveryFrom, delivery_time: s.deliveryTime, delivery_areas: s.deliveryAreas, currency: s.currency, default_language: s.defaultLanguage, languages: ['ar','fr','en'].filter(lang => s[`languages${lang[0].toUpperCase()}${lang.slice(1)}`]), instagram: s.instagram, facebook: s.facebook }, 'id'); }
async function hydrateRemote() {
  if (!remoteUser || !window.AlwatinDB) return;
  try {
    const rows = await AlwatinDB.select('products', '?select=*&order=created_at.desc');
    if (rows.length) state.products = rows.map(localProduct);
    else for (const product of state.products) await syncProductRemote(product);
    const settings = await AlwatinDB.select('store_settings', '?select=*&id=eq.true&limit=1');
    if (settings[0]) { const s = settings[0]; state.settings = { ...state.settings, storeName: s.store_name, tagline: s.tagline, phone: s.phone, whatsapp: s.whatsapp, email: s.email, payment: s.payment, deliveryFee: s.delivery_fee, freeDeliveryFrom: s.free_delivery_from, deliveryTime: s.delivery_time, deliveryAreas: s.delivery_areas, currency: s.currency, defaultLanguage: s.default_language, instagram: s.instagram, facebook: s.facebook }; }
    const remoteOrders = await AlwatinDB.select('orders', '?select=*,order_items(*)&order=created_at.desc');
    if (Array.isArray(remoteOrders)) localStorage.setItem('alwatin-orders', JSON.stringify(remoteOrders.map(order => ({ id: order.order_number, createdAt: order.created_at, customer: { name: order.customer_name, phone: order.phone, address: `${order.city ? `${order.city} — ` : ''}${order.address}` }, items: (order.order_items || []).map(item => ({ id: item.product_id, size: item.size, qty: item.quantity, unitPrice: item.unit_price, name: item.product_name })), total: order.total, status: order.status, language: order.language, remoteId: order.id }))));
    localStorage.setItem(KEY, JSON.stringify(state)); renderAll(); document.getElementById('saveStatus').textContent = 'متصل بـ Supabase';
  } catch (error) { document.getElementById('saveStatus').textContent = 'في انتظار قاعدة البيانات'; toast('تأكد من تشغيل supabase-schema.sql'); }
}
async function bootstrapAdmin() {
  renderAll();
  if (!window.AlwatinDB) return;
  const user = await AlwatinDB.getUser();
  if (!user) { document.getElementById('authDialog').showModal(); return; }
  if (user.email !== AlwatinDB.config.adminEmail) { await AlwatinDB.signOut(); document.getElementById('authDialog').showModal(); return; }
  remoteUser = user; document.getElementById('logoutButton').hidden = false; await hydrateRemote();
}

document.addEventListener('click', event => {
  const view = event.target.closest('[data-view]'); if (view) showView(view.dataset.view);
  const action = event.target.closest('[data-action]'); if (!action) return;
  if (action.dataset.action === 'new-product') fillForm();
  if (action.dataset.action === 'edit') fillForm(action.dataset.id);
  if (action.dataset.action === 'delete' && confirm('واش متأكد بغيتي تحذف هاد المنتوج؟')) { state.products = state.products.filter(item => String(item.id) !== String(action.dataset.id)); save('تحذف المنتوج'); renderAll(); }
  if (action.dataset.action === 'save-settings') { const data = dataFrom(document.getElementById('settingsForm')); state.settings = { ...state.settings, ...data, deliveryFee: Number(data.deliveryFee || 0), freeDeliveryFrom: Number(data.freeDeliveryFrom || 0), languagesAr: data.languagesAr === 'on', languagesFr: data.languagesFr === 'on', languagesEn: data.languagesEn === 'on' }; save('تحفظات إعدادات المتجر'); syncSettingsRemote().catch(() => toast('تعذر حفظ الإعدادات في Supabase')); }
  if (action.dataset.action === 'save-content') { state.content = { ...state.content, ...dataFrom(document.getElementById('contentForm')) }; save('تحفظات إعدادات المحتوى'); }
  if (action.dataset.action === 'export') exportData();
  if (action.dataset.action === 'reset' && confirm('واش متأكد بغيتي ترجع البيانات الأصلية؟')) { state = { products: copy(seedProducts), settings: copy(defaults.settings), content: copy(defaults.content) }; save('ترجعات البيانات الأصلية'); renderAll(); }
});
document.getElementById('productForm').addEventListener('submit', async event => { event.preventDefault(); const form = event.target; const submit = document.getElementById('submitProduct'); const file = form.elements.imageFile.files[0]; submit.disabled = true; submit.textContent = file ? 'جاري رفع الصورة...' : 'جاري الحفظ...'; try { if (file && remoteUser && window.AlwatinDB) form.elements.image.value = await AlwatinDB.uploadImage(file); const product = productFromForm(form); const index = state.products.findIndex(item => String(item.id) === String(product.id)); if (index < 0) state.products.unshift(product); else state.products[index] = product; document.getElementById('productDialog').close(); save(index < 0 ? 'تزادو المنتوج' : 'تحدّث المنتوج'); renderAll(); await syncProductRemote(product); } catch { toast('تحفظ محلياً. تأكد من Storage ومخطط Supabase'); } finally { submit.disabled = false; submit.textContent = 'حفظ المنتوج'; } });
document.getElementById('productSearch').addEventListener('input', renderProducts); document.getElementById('categoryFilter').addEventListener('change', renderProducts); document.getElementById('orderStatusFilter').addEventListener('change', renderOrders); document.getElementById('menuButton').addEventListener('click', () => document.getElementById('adminSidebar').classList.toggle('open'));
document.getElementById('productForm').elements.image.addEventListener('input', event => updateImagePreview(event.target.value)); document.getElementById('productForm').elements.imageFile.addEventListener('change', event => { const file = event.target.files[0]; if (file) updateImagePreview(URL.createObjectURL(file)); });
document.addEventListener('change', async event => { const select = event.target.closest('[data-order-status]'); if (!select) return; const list = orders(); const order = list.find(item => item.id === select.dataset.orderStatus); if (order) { order.status = select.value; localStorage.setItem(ORDER_KEY, JSON.stringify(list)); renderOrders(); renderOverview(); if (remoteUser && order.remoteId) { try { await AlwatinDB.update('orders', `?id=eq.${encodeURIComponent(order.remoteId)}`, { status: order.status, updated_at: new Date().toISOString() }); } catch { toast('تبدلات محلياً فقط'); } } else toast('تبدلات حالة الطلب'); } });
document.getElementById('importFile').addEventListener('change', event => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(reader.result); if (!Array.isArray(data.products)) throw Error(); state = { products: data.products, settings: { ...defaults.settings, ...data.settings }, content: { ...defaults.content, ...data.content } }; if (data.orders) localStorage.setItem(ORDER_KEY, JSON.stringify(data.orders)); save('ترجعات البيانات بنجاح'); renderAll(); } catch { toast('الملف غير صالح'); } }; reader.readAsText(file); });
document.getElementById('authForm').addEventListener('submit', async event => { event.preventDefault(); const email = new FormData(event.target).get('email'); const message = document.getElementById('authMessage'); try { await AlwatinDB.sendMagicLink(email); message.textContent = 'تصيفط الرابط للإيميل ديالك. حلّو باش تدخل للوحة التحكم.'; } catch (error) { message.textContent = error?.message || 'تعذر إرسال الرابط. تأكد من إعدادات Supabase.'; } });
document.getElementById('logoutButton').addEventListener('click', async () => { await AlwatinDB.signOut(); location.reload(); });
fillSettings(); fillContent(); renderAll(); bootstrapAdmin();
