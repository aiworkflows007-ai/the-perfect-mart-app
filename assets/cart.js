// GreenMart shared cart/orders state — persisted via localStorage, shared across all customer-app screens.
(function (global) {
  const CART_KEY = 'gm_cart_v1';
  const ORDERS_KEY = 'gm_orders_v1';
  const ADDRESS_KEY = 'gm_address_v1';

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getCart() {
    return readJSON(CART_KEY, []);
  }
  function saveCart(cart) {
    writeJSON(CART_KEY, cart);
    renderCartBadges();
  }
  function addToCart(product, qty) {
    qty = qty || 1;
    const cart = getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id: product.id, name: product.name, price: Number(product.price), image: product.image || '', unit: product.unit || '', qty: qty });
    }
    saveCart(cart);
    return cart;
  }
  function setQty(id, qty) {
    let cart = getCart();
    if (qty <= 0) {
      cart = cart.filter(i => i.id !== id);
    } else {
      const item = cart.find(i => i.id === id);
      if (item) item.qty = qty;
    }
    saveCart(cart);
    return cart;
  }
  function removeFromCart(id) {
    return setQty(id, 0);
  }
  function clearCart() {
    saveCart([]);
  }
  function cartCount() {
    return getCart().reduce((sum, i) => sum + i.qty, 0);
  }
  function cartSubtotal() {
    return getCart().reduce((sum, i) => sum + i.qty * Number(i.price), 0);
  }
  function formatMoney(n) {
    return '$' + Number(n).toFixed(2);
  }

  function getAddress() {
    return readJSON(ADDRESS_KEY, { label: 'Home', line: '452 Green Valley Road, Apartment 4B', city: 'Brooklyn, NY 11201' });
  }
  function setAddress(addr) {
    writeJSON(ADDRESS_KEY, addr);
  }

  function getOrders() {
    return readJSON(ORDERS_KEY, []);
  }
  function getLatestOrder() {
    const orders = getOrders();
    return orders.length ? orders[orders.length - 1] : null;
  }
  function placeOrder(meta) {
    const cart = getCart();
    if (!cart.length) return null;
    const subtotal = cartSubtotal();
    const handling = subtotal > 0 ? 1.2 : 0;
    const tax = Math.round(subtotal * 0.081 * 100) / 100;
    const total = Math.round((subtotal + handling + tax) * 100) / 100;
    const order = Object.assign({
      id: 'GM' + Date.now().toString().slice(-8),
      placedAt: new Date().toISOString(),
      items: cart,
      subtotal: subtotal,
      handling: handling,
      tax: tax,
      total: total,
      status: 'Placed',
      address: getAddress()
    }, meta || {});
    const orders = getOrders();
    orders.push(order);
    writeJSON(ORDERS_KEY, orders);
    clearCart();
    return order;
  }

  function renderCartBadges() {
    const count = cartCount();
    document.querySelectorAll('[data-cart-badge]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', renderCartBadges);

  global.GMCart = {
    getCart, saveCart, addToCart, setQty, removeFromCart, clearCart,
    cartCount, cartSubtotal, formatMoney,
    getAddress, setAddress,
    getOrders, getLatestOrder, placeOrder,
    renderCartBadges
  };
})(window);
