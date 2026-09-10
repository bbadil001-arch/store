const db = window.AlwatinDB;
const loading = document.getElementById('accountLoading');
const guest = document.getElementById('accountGuest');
const dashboard = document.getElementById('accountDashboard');
const resetPanel = document.getElementById('passwordReset');
let currentUser = null;
let currentAddresses = [];

function setMessage(id, text, error = false) {
  const node = document.getElementById(id);
  node.textContent = text;
  node.classList.toggle('error', error);
}

async function runForm(form, messageId, action, success) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setMessage(messageId, '');
  try { await action(new FormData(form)); setMessage(messageId, success); }
  catch (error) { setMessage(messageId, error?.message || 'تعذر تنفيذ العملية. حاول مرة أخرى.', true); }
  finally { button.disabled = false; }
}

function renderAddresses(rows = []) {
  currentAddresses = rows;
  const list = document.getElementById('addressList');
  list.innerHTML = rows.length ? rows.map(row => `<article class="address-item"><div><strong></strong><span></span><small dir="ltr"></small></div><div><button type="button" data-edit-address="${row.id}">تعديل</button><button type="button" data-delete-address="${row.id}">حذف</button></div></article>`).join('') : '<p class="empty-note">لم تحفظ أي عنوان بعد.</p>';
  list.querySelectorAll('.address-item').forEach((item, index) => {
    item.querySelector('strong').textContent = rows[index].label;
    item.querySelector('span').textContent = `${rows[index].city} — ${rows[index].address}`;
    item.querySelector('small').textContent = rows[index].phone;
  });
}

function renderOrders(rows = []) {
  const labels = { new: 'جديد', confirmed: 'مؤكد', shipping: 'قيد التوصيل', completed: 'مكتمل', cancelled: 'ملغى' };
  document.getElementById('ordersList').innerHTML = rows.length ? rows.map(row => `<article class="order-item"><div><strong dir="ltr">${row.order_number}</strong><span>${new Date(row.created_at).toLocaleDateString('ar-MA')}</span></div><div><b>${Number(row.total).toFixed(0)} MAD</b><small>${labels[row.status] || row.status}</small></div></article>`).join('') : '<p class="empty-note">لم تسجّل أي طلبات بعد.</p>';
}

async function loadCustomerData() {
  const [profiles, addresses, orders] = await Promise.all([
    db.select('customer_profiles', `?user_id=eq.${currentUser.id}&limit=1`),
    db.select('customer_addresses', `?user_id=eq.${currentUser.id}&order=is_default.desc,created_at.desc`),
    db.select('orders', '?select=id,order_number,status,total,created_at&order=created_at.desc')
  ]);
  const profile = profiles[0] || {};
  document.querySelector('#profileForm [name="fullName"]').value = profile.full_name || currentUser.user_metadata?.full_name || '';
  document.querySelector('#profileForm [name="phone"]').value = profile.phone || '';
  renderAddresses(addresses);
  renderOrders(orders);
}

async function initialize() {
  if (!db) { loading.hidden = true; guest.hidden = false; return; }
  currentUser = await db.getUser();
  loading.hidden = true;
  if (new URLSearchParams(location.search).get('mode') === 'reset' && currentUser) {
    resetPanel.hidden = false;
    return;
  }
  if (!currentUser) { guest.hidden = false; return; }
  dashboard.hidden = false;
  document.getElementById('accountEmail').textContent = currentUser.email || '';
  try { await loadCustomerData(); }
  catch (error) { console.warn('Account data could not be loaded.', error); }
}

document.getElementById('accountLoginForm').addEventListener('submit', event => {
  event.preventDefault();
  runForm(event.currentTarget, 'accountLoginMessage', async data => { await db.signInWithPassword(data.get('email'), data.get('password')); location.reload(); }, 'تم تسجيل الدخول.');
});

document.getElementById('profileForm').addEventListener('submit', event => {
  event.preventDefault();
  runForm(event.currentTarget, 'profileMessage', async data => {
    await db.upsert('customer_profiles', { user_id: currentUser.id, full_name: data.get('fullName'), phone: data.get('phone'), updated_at: new Date().toISOString() }, 'user_id');
    await db.updateAuthUser({ full_name: data.get('fullName') });
  }, 'تم حفظ معلوماتك بنجاح.');
});

document.getElementById('addressForm').addEventListener('submit', event => {
  event.preventDefault();
  runForm(event.currentTarget, 'addressMessage', async data => {
    const value = { user_id: currentUser.id, label: data.get('label'), city: data.get('city'), address: data.get('address'), phone: data.get('phone'), is_default: data.get('isDefault') === 'on', updated_at: new Date().toISOString() };
    if (data.get('id')) await db.update('customer_addresses', `?id=eq.${data.get('id')}`, value);
    else await db.insert('customer_addresses', value);
    event.currentTarget.reset();
    event.currentTarget.elements.label.value = 'العنوان الرئيسي';
    await loadCustomerData();
  }, 'تم حفظ العنوان بنجاح.');
});

document.getElementById('passwordForm').addEventListener('submit', event => {
  event.preventDefault();
  runForm(event.currentTarget, 'passwordMessage', async data => {
    if (data.get('password') !== data.get('confirmation')) throw new Error('كلمتا المرور غير متطابقتين.');
    await db.updatePassword(data.get('password')); event.currentTarget.reset();
  }, 'تم تحديث كلمة المرور.');
});

document.getElementById('resetForm').addEventListener('submit', event => {
  event.preventDefault();
  runForm(event.currentTarget, 'resetMessage', async data => {
    if (data.get('password') !== data.get('confirmation')) throw new Error('كلمتا المرور غير متطابقتين.');
    await db.updatePassword(data.get('password'));
    history.replaceState({}, '', './account.html');
  }, 'تم تعيين كلمة المرور الجديدة. يمكنك الآن استخدام حسابك.');
});

document.addEventListener('click', async event => {
  const edit = event.target.closest('[data-edit-address]');
  if (edit) {
    const row = currentAddresses.find(entry => entry.id === edit.dataset.editAddress);
    if (!row) return;
    const form = document.getElementById('addressForm');
    for (const key of ['id', 'label', 'city', 'address', 'phone']) form.elements[key].value = row[key] || '';
    form.elements.isDefault.checked = Boolean(row.is_default);
    form.scrollIntoView({ behavior: 'smooth' });
  }
  const remove = event.target.closest('[data-delete-address]');
  if (remove && confirm('هل تريد حذف هذا العنوان؟')) {
    await db.remove('customer_addresses', `?id=eq.${remove.dataset.deleteAddress}`);
    await loadCustomerData();
  }
});

document.getElementById('accountLogout').addEventListener('click', async () => { await db.signOut(); location.href = './'; });
initialize();
