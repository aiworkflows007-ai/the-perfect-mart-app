// The Perfect Mart — shared Supabase client + public (read-only) product helpers.
// Uses the public anon key, which is safe to embed client-side: RLS policies on
// the `products` table restrict anonymous reads to is_active = true rows only.
(function (global) {
  const SUPABASE_URL = 'https://htgqkoriimvekvihxmvb.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Z3Frb3JpaW12ZWt2aWh4bXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NTcxNTcsImV4cCI6MjA5NzIzMzE1N30.LQXJi17hej102dgGZ-5RhcftdSKlf74obL5zHSoreIA';

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const PLACEHOLDER_IMAGE = 'https://placehold.co/300x300/eaf0e3/6f7a6a?text=No+Image';

  function money(n) {
    return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async function fetchActiveProducts({ search = '', category = '', limit = 20, offset = 0 } = {}) {
    let query = client
      .from('pm_products')
      .select('id,name,category,item_code,selling_price,mrp,stock_quantity,stock_unit,image_url', { count: 'exact' })
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);
    if (search) query = query.ilike('name', `%${search}%`);
    if (category) query = query.eq('category', category);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  async function fetchProductById(id) {
    const { data, error } = await client.from('pm_products').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function fetchCategories() {
    const { data, error } = await client
      .from('pm_products')
      .select('category')
      .eq('is_active', true)
      .limit(5000);
    if (error) throw error;
    return Array.from(new Set((data || []).map((r) => r.category))).sort();
  }

  // Place a real order into Supabase (pm_orders + pm_order_items)
  async function placeOrder(cart, meta) {
    if (!cart || !cart.length) throw new Error('Cart is empty');
    const subtotal = cart.reduce((s, i) => s + i.qty * Number(i.price), 0);
    const handling = subtotal > 0 ? 1.2 : 0;
    const tax = Math.round(subtotal * 0.081 * 100) / 100;
    const total = Math.round((subtotal + handling + tax) * 100) / 100;
    const orderNumber = 'PM' + Date.now().toString().slice(-8);

    const { data: order, error: orderError } = await client
      .from('pm_orders')
      .insert({
        order_number: orderNumber,
        customer_name: (meta && meta.customer_name) || null,
        customer_phone: (meta && meta.customer_phone) || null,
        delivery_address: (meta && meta.address) || null,
        source: (meta && meta.source) || 'app',
        status: 'pending',
        subtotal: subtotal,
        delivery_fee: 0,
        handling_fee: handling,
        tax: tax,
        total: total,
        payment_method: (meta && meta.payment_method) || 'cod',
        payment_status: 'pending',
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const items = cart.map((i) => ({
      order_id: order.id,
      product_id: i.id,
      name: i.name,
      unit_price: Number(i.price),
      quantity: i.qty,
      unit: i.unit || null,
      image_url: i.image || null,
    }));
    const { error: itemsError } = await client.from('pm_order_items').insert(items);
    if (itemsError) throw itemsError;

    return { id: order.id, order_number: orderNumber, total };
  }

  global.PMSupabase = {
    client,
    PLACEHOLDER_IMAGE,
    money,
    fetchActiveProducts,
    fetchProductById,
    fetchCategories,
    placeOrder,
  };
})(window);
