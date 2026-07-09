// The Perfect Mart — Admin catalog write access.
// All writes go through a Supabase Edge Function (admin-products), which holds
// the real database credential server-side and verifies the caller is really
// signed in as the admin account before touching the database. No secret is
// embedded in this file — authorization rides on the browser's real Supabase
// session, established by a genuine supabase.auth.signInWithPassword() login.
(function (global) {
  if (!window.PMSupabase) {
    console.error('assets/supabase.js must be loaded before supabase-admin.js');
    return;
  }
  const client = window.PMSupabase.client;

  async function hasAdminSession() {
    const { data: { session } } = await client.auth.getSession();
    return !!session;
  }

  async function adminSignIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  }

  async function adminSignOut() {
    await client.auth.signOut();
  }

  async function callFn(body) {
    const { data, error } = await client.functions.invoke('admin-products', { body });
    if (error) {
      let message = error.message || 'Request failed';
      try {
        const ctx = await error.context.json();
        if (ctx.error) message = ctx.error;
      } catch {}
      throw new Error(message);
    }
    return data;
  }

  async function fetchProductsAdmin({ search = '', category = '', limit = 50, offset = 0 } = {}) {
    const { data, count } = await callFn({ op: 'list', search, category, limit, offset });
    return { data: data || [], count: count || 0 };
  }

  async function fetchAllCategoriesAdmin() {
    const { data } = await callFn({ op: 'categories' });
    return data || [];
  }

  async function upsertProduct(product) {
    const { data } = await callFn({ op: 'upsert', product });
    return data;
  }

  async function deleteProduct(id) {
    await callFn({ op: 'delete', id });
  }

  async function fetchOrdersAdmin({ limit = 50, offset = 0, status = '' } = {}) {
    const { data, count } = await callFn({ op: 'orders', limit, offset, status });
    return { data: data || [], count: count || 0 };
  }

  async function updateOrderStatus(orderId, newStatus) {
    const { data } = await callFn({ op: 'update_order_status', order_id: orderId, new_status: newStatus });
    return data;
  }

  global.PMSupabaseAdmin = {
    hasAdminSession,
    adminSignIn,
    adminSignOut,
    fetchProductsAdmin,
    fetchAllCategoriesAdmin,
    upsertProduct,
    deleteProduct,
    fetchOrdersAdmin,
    updateOrderStatus,
  };
})(window);
