// Order page — render cart, handle fake checkout
(() => {
  if (!window.MochaCart) return;
  const { read, total, remove, clear } = window.MochaCart;

  const summaryEl = document.getElementById('orderSummary');
  const totalEl = document.getElementById('orderTotal');
  const subtotalEl = document.getElementById('orderSubtotal');
  const taxEl = document.getElementById('orderTax');
  const placeBtn = document.getElementById('placeOrder');
  const checkoutShell = document.getElementById('checkoutShell');
  const successShell = document.getElementById('successShell');
  const successTotal = document.getElementById('successTotal');
  const successId = document.getElementById('successId');
  const successLocation = document.getElementById('successLocation');

  const TAX_RATE = 0.07;

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

  const renderEmpty = () => {
    const link = el('a', { href: 'menu.html', class: 'btn btn-primary btn-arrow', style: 'margin-top:1.5rem; display:inline-flex;' }, 'Browse Menu');
    return el('div', { class: 'cart-empty', style: 'padding: 4rem 2rem;' },
      el('div', { style: 'font-family: var(--font-display); font-size: 3rem; color: var(--line-2); margin-bottom: 1rem;' }, '∅'),
      el('p', { style: 'font-family: var(--font-display); text-transform: uppercase; font-size: 1.1rem;' }, 'No items yet'),
      el('p', { class: 'mt-3', style: 'font-size: 0.9rem; color: var(--text-dim);' }, 'Head back to the menu to add a few things.'),
      link
    );
  };

  const renderLine = (i) => {
    const rmBtn = el('button', { class: 'cart-remove', dataset: { act: 'rm' }, 'aria-label': `Remove ${i.name}` }, '×');
    return el('div', { class: 'summary-line', dataset: { id: i.id } },
      el('span', {}, el('span', { class: 'qty-tag' }, '×' + i.qty), document.createTextNode(i.name)),
      el('span', { style: 'display:flex; align-items:center; gap: 0.6rem;' },
        el('span', { style: 'color: var(--amber-deep);' }, '$' + (i.price * i.qty).toFixed(2)),
        rmBtn
      )
    );
  };

  const render = () => {
    if (!summaryEl) return;
    const state = read();
    clearNode(summaryEl);
    if (state.items.length === 0) {
      summaryEl.appendChild(renderEmpty());
      if (placeBtn) {
        placeBtn.disabled = true;
        placeBtn.style.opacity = '0.5';
        placeBtn.style.cursor = 'not-allowed';
      }
      if (totalEl) totalEl.textContent = '$0.00';
      if (subtotalEl) subtotalEl.textContent = '$0.00';
      if (taxEl) taxEl.textContent = '$0.00';
      return;
    }
    state.items.forEach(i => summaryEl.appendChild(renderLine(i)));
    const sub = total(state);
    const tax = sub * TAX_RATE;
    if (subtotalEl) subtotalEl.textContent = '$' + sub.toFixed(2);
    if (taxEl) taxEl.textContent = '$' + tax.toFixed(2);
    if (totalEl) totalEl.textContent = '$' + (sub + tax).toFixed(2);
    if (placeBtn) {
      placeBtn.disabled = false;
      placeBtn.style.opacity = '';
      placeBtn.style.cursor = '';
    }
  };

  summaryEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act="rm"]');
    if (!btn) return;
    const id = btn.closest('.summary-line').dataset.id;
    remove(id);
    render();
  });

  document.addEventListener('cart:change', render);
  render();

  const form = document.getElementById('orderForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const state = read();
    if (state.items.length === 0) return;
    const data = new FormData(form);
    const location = data.get('location') === 'dupont'
      ? 'Dupont Road · 4635 E Dupont Rd'
      : 'Covington Road · 6511 Covington Rd';
    const sub = total(state);
    const grand = sub * (1 + TAX_RATE);
    const orderId = 'ML-' + Date.now().toString(36).toUpperCase().slice(-6);
    if (successId) successId.textContent = 'Order #' + orderId;
    if (successLocation) successLocation.textContent = location;
    if (successTotal) successTotal.textContent = '$' + grand.toFixed(2);
    if (checkoutShell) checkoutShell.style.display = 'none';
    if (successShell) successShell.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clear();
  });
})();
