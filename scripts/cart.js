// Mocha Lounge — demo cart (localStorage-backed)
(() => {
  const KEY = 'mochaCart';

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || { items: [] }; }
    catch { return { items: [] }; }
  };
  const write = (state) => localStorage.setItem(KEY, JSON.stringify(state));
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const add = (name, price) => {
    const state = read();
    const id = slug(name);
    const found = state.items.find(i => i.id === id);
    if (found) found.qty += 1;
    else state.items.push({ id, name, price: Number(price), qty: 1 });
    write(state);
    document.dispatchEvent(new CustomEvent('cart:change'));
  };
  const setQty = (id, qty) => {
    const state = read();
    const item = state.items.find(i => i.id === id);
    if (!item) return;
    if (qty <= 0) state.items = state.items.filter(i => i.id !== id);
    else item.qty = qty;
    write(state);
    document.dispatchEvent(new CustomEvent('cart:change'));
  };
  const remove = (id) => setQty(id, 0);
  const clear = () => { write({ items: [] }); document.dispatchEvent(new CustomEvent('cart:change')); };
  const total = (state = read()) => state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = (state = read()) => state.items.reduce((sum, i) => sum + i.qty, 0);

  window.MochaCart = { read, write, add, setQty, remove, clear, total, count };

  // ---------- DOM helpers (safe construction, no innerHTML) ----------
  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') node.className = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k === 'style') node.setAttribute('style', v);
      else if (k.startsWith('aria-')) node.setAttribute(k, v);
      else if (k in node) node[k] = v;
      else node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  };
  const clearNode = (n) => { while (n.firstChild) n.removeChild(n.firstChild); };

  // ---------- Menu page enhancement ----------
  document.querySelectorAll('.menu-row').forEach(row => {
    const nameEl = row.querySelector('.menu-row-name');
    const priceEl = row.querySelector('.menu-row-price');
    if (!nameEl || !priceEl) return;
    const name = (nameEl.firstChild?.textContent || nameEl.textContent).trim();
    const price = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0;
    const btn = el('button', {
      class: 'menu-add', type: 'button',
      'aria-label': `Add ${name} to order`
    }, '+');
    btn.addEventListener('click', () => {
      add(name, price);
      btn.classList.add('added');
      btn.textContent = '✓';
      setTimeout(() => { btn.classList.remove('added'); btn.textContent = '+'; }, 900);
    });
    row.appendChild(btn);
  });

  // ---------- FAB + Drawer ----------
  const fab = document.getElementById('cartFab');
  const fabCount = document.getElementById('cartFabCount');
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  const drawerBody = document.getElementById('cartBody');
  const drawerFooter = document.getElementById('cartFooter');
  const closeBtn = document.getElementById('cartClose');
  const cartTotalEl = document.getElementById('cartTotal');

  const openDrawer = () => { drawer?.classList.add('open'); overlay?.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeDrawer = () => { drawer?.classList.remove('open'); overlay?.classList.remove('open'); document.body.style.overflow = ''; };

  fab?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

  const renderEmpty = () => el('div', { class: 'cart-empty' },
    el('div', { class: 'display' }, '∅'),
    el('p', { style: 'font-family: var(--font-display); text-transform: uppercase; font-size: 1.1rem;' }, 'Cart is empty'),
    el('p', { class: 'mt-3', style: 'font-size: 0.9rem;' }, 'Add a drink, a sandwich, the pecan coffee cake.')
  );

  const renderItem = (i) => {
    const decBtn = el('button', { class: 'qty-btn', dataset: { act: 'dec' }, 'aria-label': 'Decrease' }, '−');
    const incBtn = el('button', { class: 'qty-btn', dataset: { act: 'inc' }, 'aria-label': 'Increase' }, '+');
    const rmBtn = el('button', { class: 'cart-remove', dataset: { act: 'rm' } }, 'Remove');
    return el('div', { class: 'cart-item', dataset: { id: i.id } },
      el('div', {},
        el('div', { class: 'cart-item-name' }, i.name),
        el('div', { class: 'qty-control' }, decBtn, el('span', { class: 'qty-val' }, String(i.qty)), incBtn, rmBtn)
      ),
      el('div', { class: 'cart-item-price' }, '$' + (i.price * i.qty).toFixed(2))
    );
  };

  const renderDrawer = () => {
    if (!fab) return;
    const state = read();
    const c = count(state);
    if (c > 0) { fab.classList.add('visible'); if (fabCount) fabCount.textContent = String(c); }
    else fab.classList.remove('visible');

    if (!drawerBody) return;
    clearNode(drawerBody);
    if (state.items.length === 0) {
      drawerBody.appendChild(renderEmpty());
      if (drawerFooter) drawerFooter.style.display = 'none';
      return;
    }
    if (drawerFooter) drawerFooter.style.display = '';
    state.items.forEach(i => drawerBody.appendChild(renderItem(i)));
    if (cartTotalEl) cartTotalEl.textContent = '$' + total(state).toFixed(2);
  };

  drawerBody?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.closest('.cart-item').dataset.id;
    const state = read();
    const item = state.items.find(i => i.id === id);
    if (!item) return;
    if (btn.dataset.act === 'inc') setQty(id, item.qty + 1);
    else if (btn.dataset.act === 'dec') setQty(id, item.qty - 1);
    else if (btn.dataset.act === 'rm') remove(id);
  });

  document.addEventListener('cart:change', () => {
    renderDrawer();
    fab?.classList.add('bump');
    setTimeout(() => fab?.classList.remove('bump'), 500);
  });

  renderDrawer();
})();
