// Compact product details, sharing, saved favourites and size-aware cart entries.
const productTranslations = {
  ar: {
    size: 'المقاس', colors: 'الألوان', pleats: 'تفاصيل الخياطة', backShop: 'العودة إلى المتجر', productDetails: 'تفاصيل المنتج',
    favourite: 'حفظ في المفضلة', unfavourite: 'إزالة من المفضلة', shareProduct: 'مشاركة المنتج',
    linkCopied: 'تم نسخ رابط المنتج.', copyLink: 'رابط المنتج', noReviews: 'لا توجد تقييمات بعد',
    viewOutfit: 'الإطلالة', viewCollar: 'التفاصيل العلوية', viewFabric: 'تفاصيل القماش', viewLower: 'التفاصيل السفلية',
    previousPhoto: 'الصورة السابقة', nextPhoto: 'الصورة التالية', galleryLabel: 'صور المنتج',
    detailCodText: 'اطلب الآن وادفع عند التوصيل.', unavailableProduct: 'هذا المنتج غير متوفر.',
    viewProduct: 'عرض المنتج', chosenSize: 'المقاس المحدد', imageCounter: 'الصورة', buyNow: 'شراء الآن',
    languageLabel: 'اختيار اللغة', navLabel: 'القائمة الرئيسية', categoryLabel: 'تصنيفات المنتجات'
  },
  fr: {
    size: 'Taille', colors: 'Couleurs', pleats: 'Détails de couture', backShop: 'Retour à la boutique', productDetails: 'Détails du produit',
    favourite: 'Ajouter aux favoris', unfavourite: 'Retirer des favoris', shareProduct: 'Partager le produit',
    linkCopied: 'Lien du produit copié.', copyLink: 'Lien du produit', noReviews: 'Aucun avis pour le moment',
    viewOutfit: 'La tenue', viewCollar: 'Détails du haut', viewFabric: 'Détails du tissu', viewLower: 'Détails du bas',
    previousPhoto: 'Photo précédente', nextPhoto: 'Photo suivante', galleryLabel: 'Photos du produit',
    detailCodText: 'Commandez maintenant, payez à réception.', unavailableProduct: 'Ce produit est indisponible.',
    viewProduct: 'Voir le produit', chosenSize: 'Taille sélectionnée', imageCounter: 'Photo',
    languageLabel: 'Choisir la langue', navLabel: 'Navigation principale', categoryLabel: 'Catégories de produits'
  },
  en: {
    size: 'Size', colors: 'Colors', pleats: 'Tailoring details', backShop: 'Back to shop', productDetails: 'Product details',
    favourite: 'Save to favourites', unfavourite: 'Remove from favourites', shareProduct: 'Share product',
    linkCopied: 'Product link copied.', copyLink: 'Product link', noReviews: 'No reviews yet',
    viewOutfit: 'The outfit', viewCollar: 'Upper details', viewFabric: 'Fabric detail', viewLower: 'Lower details',
    previousPhoto: 'Previous photo', nextPhoto: 'Next photo', galleryLabel: 'Product photos',
    detailCodText: 'Order now, pay when it arrives.', unavailableProduct: 'This product is unavailable.',
    viewProduct: 'View product', chosenSize: 'Selected size', imageCounter: 'Photo',
    languageLabel: 'Choose language', navLabel: 'Main navigation', categoryLabel: 'Product categories'
  }
};
for (const lang of ['ar', 'fr', 'en']) Object.assign(translations[lang], productTranslations[lang]);

const productPage = document.getElementById('productPage');
const homePage = document.getElementById('home');
let currentProductId = null;
let galleryIndex = 0;
let homeScrollY = 0;
const selectedSizes = new Map();
let favouriteIds = new Set();
try {
  const saved = JSON.parse(localStorage.getItem('alwatin-favourites') || '[]');
  if (Array.isArray(saved)) favouriteIds = new Set(saved.map(String).filter(id => products.some(product => String(product.id) === id)));
} catch { /* Favourites remain usable for this visit when storage is unavailable. */ }

const productIcons = {
  back: '<path d="m14 6-6 6 6 6"/>',
  next: '<path d="m10 6 6 6-6 6"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
  truck: '<path d="M2 5h12v13H2zM14 10h4l4 4v4h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'
};
const productIcon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${productIcons[name]}</svg>`;
const galleryViews = [
  { key: 'outfit', label: 'viewOutfit' },
  { key: 'collar', label: 'viewCollar' },
  { key: 'fabric', label: 'viewFabric' },
  { key: 'lower', label: 'viewLower' }
];

function productUrl(product) {
  const url = new URL(window.location.href);
  url.searchParams.set('product', product.category);
  url.searchParams.set('lang', currentLang);
  url.hash = '';
  return url;
}

function sizesFor(product) {
  return Array.isArray(product.sizes) && product.sizes.length ? product.sizes : product.category === 'accessories' ? ['40', '41', '42', '43', '44', '45'] : ['S', 'M', 'L', 'XL'];
}

function sizeFor(product) {
  return selectedSizes.get(product.id) || (product.category === 'accessories' ? '42' : 'M');
}

function renderProductPage() {
  if (currentProductId === null) return;
  const product = products.find(item => String(item.id) === String(currentProductId));
  if (!product) {
    productPage.innerHTML = `<div class="product-unavailable"><h1>${t('unavailableProduct')}</h1><a class="btn primary" href="#shop" data-product-back>${t('backShop')}</a></div>`;
    return;
  }
  const size = sizeFor(product);
  try {
    const stored = JSON.parse(localStorage.getItem('alwatin-favourites') || '[]');
    if (Array.isArray(stored)) favouriteIds = new Set(stored.map(String));
  } catch { /* Keep in-memory favourites. */ }
  const favouriteKey = String(product.id);
  const saved = favouriteIds.has(favouriteKey);
  const views = product.category === 'accessories' ? [galleryViews[0], galleryViews[2]] : galleryViews;
  galleryIndex = Math.min(galleryIndex, views.length - 1);
  const view = views[galleryIndex];
  productPage.setAttribute('aria-label', product.label[currentLang]);
  productPage.innerHTML = `
    <article class="product-detail" aria-labelledby="detailTitle">
      <div class="detail-gallery" aria-label="${t('galleryLabel')}">
        <div class="detail-stage">
          <div class="gallery-shot view-${view.key}" id="detailShot"><img src="${product.image || productImages[product.category]}" alt="${product.label[currentLang]} — ${t(view.label)}" width="1024" height="1536" /></div>
          <a class="detail-round detail-back" href="#shop" data-product-back aria-label="${t('backShop')}">${productIcon('back')}</a>
          <div class="detail-tools">
            <button class="detail-round ${saved ? 'is-saved' : ''}" type="button" id="favouriteProduct" aria-label="${t(saved ? 'unfavourite' : 'favourite')}" aria-pressed="${saved}">${productIcon('heart')}</button>
            <button class="detail-round" type="button" id="shareProduct" aria-label="${t('shareProduct')}">${productIcon('share')}</button>
          </div>
          <div class="gallery-controls">
            <button class="detail-round" type="button" data-gallery-step="-1" aria-label="${t('previousPhoto')}">${productIcon('back')}</button>
            <span id="galleryCounter" aria-live="polite">${galleryIndex + 1} / ${views.length}</span>
            <button class="detail-round" type="button" data-gallery-step="1" aria-label="${t('nextPhoto')}">${productIcon('next')}</button>
          </div>
        </div>
        <div class="detail-thumbnails" role="group" aria-label="${t('galleryLabel')}">
          ${views.map((entry, index) => `<button class="detail-thumbnail ${index === galleryIndex ? 'selected' : ''}" type="button" data-gallery-index="${index}" aria-pressed="${index === galleryIndex}" aria-label="${t(entry.label)}"><span class="gallery-shot view-${entry.key}"><img src="${product.image || productImages[product.category]}" alt="" width="120" height="150" /></span></button>`).join('')}
        </div>
      </div>
      <div class="detail-information">
        <p class="detail-category">${categoryLabels[currentLang][product.category]}</p>
        <h1 id="detailTitle">${product.label[currentLang]}</h1>
        <div class="detail-price-row"><strong class="detail-price" dir="ltr">${product.price} MAD</strong><span class="detail-cod-badge">${t('codBadge')}</span></div>
        <div class="detail-reviews"><span class="empty-stars" aria-hidden="true">☆☆☆☆☆</span><span>${t('noReviews')}</span></div>
        <p class="detail-description">${product.desc[currentLang]}</p>
        ${product.colors?.length ? `<div class="detail-attribute"><strong>${t('colors')}</strong><span>${product.colors.join(' · ')}</span></div>` : ''}
        ${product.pleats ? `<div class="detail-attribute"><strong>${t('pleats')}</strong><span>${product.pleats}</span></div>` : ''}
        <fieldset class="detail-sizes"><legend>${t('size')}</legend><div class="size-options" dir="ltr">${sizesFor(product).map(value => `<label class="size-option"><input type="radio" name="productSize" value="${value}" ${size === value ? 'checked' : ''} /><span>${value}</span></label>`).join('')}</div></fieldset>
        <button class="btn primary detail-add" id="detailAdd" type="button" data-add="${product.id}" data-size="${size}">${t('buyNow')}</button>
        <div class="detail-delivery">${productIcon('truck')}<div><strong>${t('codTitle')}</strong><p>${t('detailCodText')}</p><small>${t('deliveryTitle')}</small></div></div>
        <p class="detail-image-note">${t('demoImages')}</p>
        <p class="detail-status" id="detailStatus" role="status" aria-live="polite"></p>
        <label class="share-link-field" id="shareLinkField" hidden><span>${t('copyLink')}</span><input id="shareLinkInput" type="url" readonly /></label>
      </div>
    </article>`;
  document.title = `${product.label[currentLang]} | Alwatin`;
}

function syncProductRoute({scroll = false} = {}) {
  const url = new URL(window.location.href);
  const slug = url.searchParams.get('product');
  const product = products.find(item => item.category === slug);
  const nextId = slug ? (product?.id || -1) : null;
  if (nextId !== currentProductId) galleryIndex = 0;
  currentProductId = nextId;
  const isProduct = currentProductId !== null;
  homePage.hidden = isProduct;
  productPage.hidden = !isProduct;
  document.body.classList.toggle('product-route', isProduct);
  applyLanguage(url.searchParams.get('lang') || currentLang);
  if (scroll) {
    window.scrollTo({top: 0, behavior: 'instant'});
    if (isProduct) productPage.focus({preventScroll: true});
  }
}

function navigateProduct(id) {
  const product = products.find(item => String(item.id) === String(id));
  if (!product) return;
  if (currentProductId === null) homeScrollY = window.scrollY;
  history.pushState({alwatinProduct: true}, '', productUrl(product));
  syncProductRoute({scroll: true});
}

function navigateHome(anchor = 'shop') {
  const url = new URL(window.location.href);
  url.searchParams.delete('product');
  url.hash = anchor;
  history.pushState({}, '', url);
  syncProductRoute();
  document.getElementById(anchor)?.scrollIntoView();
}

function selectGallery(index) {
  const product = products.find(item => String(item.id) === String(currentProductId));
  if (!product) return;
  const views = product.category === 'accessories' ? [galleryViews[0], galleryViews[2]] : galleryViews;
  galleryIndex = (index + views.length) % views.length;
  const shot = document.getElementById('detailShot');
  shot.className = `gallery-shot view-${views[galleryIndex].key}`;
  shot.querySelector('img').alt = `${product.label[currentLang]} — ${t(views[galleryIndex].label)}`;
  document.getElementById('galleryCounter').textContent = `${galleryIndex + 1} / ${views.length}`;
  productPage.querySelectorAll('[data-gallery-index]').forEach(button => {
    const selected = Number(button.dataset.galleryIndex) === galleryIndex;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

async function shareCurrentProduct() {
  const product = products.find(item => String(item.id) === String(currentProductId));
  if (!product) return;
  const url = productUrl(product).href;
  if (navigator.share) {
    try { await navigator.share({title: product.label[currentLang], url}); return; }
    catch (error) { if (error.name === 'AbortError') return; }
  }
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url);
    document.getElementById('detailStatus').textContent = t('linkCopied');
  } catch {
    document.getElementById('shareLinkField').hidden = false;
    const input = document.getElementById('shareLinkInput');
    input.value = url;
    input.focus();
    input.select();
  }
}

document.addEventListener('click', event => {
  const link = event.target.closest('[data-product-link]');
  if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
    event.preventDefault();
    navigateProduct(link.dataset.productLink);
    return;
  }
  if (event.target.closest('[data-product-back]')) {
    event.preventDefault();
    if (history.state?.alwatinProduct) history.back();
    else navigateHome();
    return;
  }
  const anchor = event.target.closest('a[href^="#"]');
  if (anchor && currentProductId !== null && !event.metaKey && !event.ctrlKey) {
    event.preventDefault(); navigateHome(anchor.getAttribute('href').slice(1)); return;
  }
  const thumb = event.target.closest('[data-gallery-index]');
  if (thumb) selectGallery(Number(thumb.dataset.galleryIndex));
  const step = event.target.closest('[data-gallery-step]');
  if (step) selectGallery(galleryIndex + Number(step.dataset.galleryStep));
  const heart = event.target.closest('#favouriteProduct');
  if (heart) {
    const key = String(currentProductId);
    if (favouriteIds.has(key)) favouriteIds.delete(key);
    else favouriteIds.add(key);
    const saved = favouriteIds.has(key);
    heart.classList.toggle('is-saved', saved);
    heart.setAttribute('aria-pressed', String(saved));
    heart.setAttribute('aria-label', t(saved ? 'unfavourite' : 'favourite'));
    try { localStorage.setItem('alwatin-favourites', JSON.stringify([...favouriteIds])); } catch { /* Session state is retained. */ }
  }
  if (event.target.closest('#shareProduct')) shareCurrentProduct();
});

productPage.addEventListener('change', event => {
  if (event.target.name !== 'productSize') return;
  const product = products.find(item => String(item.id) === String(currentProductId));
  if (!product || !sizesFor(product).includes(event.target.value)) return;
  selectedSizes.set(product.id, event.target.value);
  document.getElementById('detailAdd').dataset.size = event.target.value;
});

async function loadRemoteCatalog() {
  if (!window.AlwatinDB) return;
  try {
    const rows = await AlwatinDB.select('products', '?select=*&active=eq.true&order=created_at.desc');
    if (!rows.length) return;
    const fallbackProducts = products.filter(product => ['modern-trousers', 'arabic-shirt'].includes(product.category));
    products = rows.map(row => ({ id: row.id, category: row.category, price: Number(row.price), comparePrice: Number(row.compare_price || 0), stock: Number(row.stock || 0), sku: row.sku, image: row.image_url, sizes: row.sizes || [], colors: row.colors || [], pleats: row.pleats || '', active: row.active, featured: row.featured, label: { ar: row.name_ar, fr: row.name_fr, en: row.name_en }, name: { ar: row.name_ar, fr: row.name_fr, en: row.name_en }, desc: { ar: row.description_ar || '', fr: row.description_fr || '', en: row.description_en || '' }, seoTitle: row.seo_title, seoDescription: row.seo_description }));
    fallbackProducts.forEach(fallback => { if (!products.some(product => product.category === fallback.category)) products.push(fallback); });
    applyLanguage(currentLang);
    if (currentProductId !== null) syncProductRoute();
  } catch { /* Keep the built-in catalog until Supabase tables are ready. */ }
}

languageSelect.addEventListener('change', () => {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', currentLang);
  history.replaceState(history.state, '', url);
});
window.addEventListener('popstate', () => {
  if (cartPanel.classList.contains('open')) closeCart();
  syncProductRoute();
  if (currentProductId === null) window.scrollTo({top: homeScrollY, behavior: 'instant'});
});

languageSelect.setAttribute('data-i18n-label', 'languageLabel');
document.querySelector('.nav').setAttribute('data-i18n-label', 'navLabel');
categoryFilters.setAttribute('data-i18n-label', 'categoryLabel');
syncProductRoute();
loadRemoteCatalog();
