// js/data.js - Supabase 数据库存储模块
var SUPABASE_URL = 'https://infsqrfqksvqzlapvott.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZnNxcmZxa3N2cXpsYXB2b3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MjA3NTgsImV4cCI6MjA5MTI5Njc1OH0.PQ-z3w4GIbfkiM7LfEXQ8dLINjkIRSKAPeXg8-Yu1T8';
var STORAGE_KEY = 'food_display_products_cache';

// ─── 低层 fetch ───────────────────────────────────────────────────────────────
async function supabaseFetch(path, method, body) {
  var opts = {
    method: method || 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  var r = await fetch(SUPABASE_URL + '/rest/v1' + path, opts);
  if (r.status === 204) return [];
  var j = await r.json();
  if (!r.ok) { console.error('Supabase error', r.status, j); return []; }
  return Array.isArray(j) ? j : (j.data || []);
}

// ─── 公开 API ────────────────────────────────────────────────────────────────

async function getProducts() {
  var rows = await supabaseFetch('/products?select=*&order=created_at.asc', 'GET');
  return rows.map(function(r) {
    return {
      id: r.id,
      name: r.name || '',
      price: parseFloat(r.price) || 0,
      tag: r.tag || '其他',
      description: r.description || '',
      coverImage: r.cover_image || (r.images && r.images[0]) || '',
      images: r.images || [],
      video: r.video || '',
      createdAt: r.created_at || ''
    };
  });
}

async function getProductById(id) {
  var rows = await supabaseFetch('/products?id=eq.' + id + '&select=*', 'GET');
  if (rows.length === 0) return null;
  var r = rows[0];
  return {
    id: r.id,
    name: r.name || '',
    price: parseFloat(r.price) || 0,
    tag: r.tag || '其他',
    description: r.description || '',
    coverImage: r.cover_image || (r.images && r.images[0]) || '',
    images: r.images || [],
    video: r.video || '',
    createdAt: r.created_at || ''
  };
}

async function addProduct(product) {
  var body = {
    name: product.name || '',
    price: parseFloat(product.price) || 0,
    tag: product.tag || '其他',
    description: product.description || '',
    cover_image: product.coverImage || (product.images && product.images[0]) || '',
    images: product.images || [],
    video: product.video || '',
    created_at: new Date().toISOString()
  };
  var rows = await supabaseFetch('/products', 'POST', body);
  return rows.length > 0 ? rows[0] : null;
}

async function updateProduct(id, updates) {
  var body = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.price !== undefined) body.price = parseFloat(updates.price);
  if (updates.tag !== undefined) body.tag = updates.tag;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.coverImage !== undefined) body.cover_image = updates.coverImage;
  if (updates.images !== undefined) body.images = updates.images;
  if (updates.video !== undefined) body.video = updates.video;
  await supabaseFetch('/products?id=eq.' + id, 'PATCH', body);
}

async function deleteProduct(id) {
  await supabaseFetch('/products?id=eq.' + id, 'DELETE');
}

// 默认示例数据（本地缓存，首次加载时用）
function getDefaultProducts() {
  return [
    { id: 1, name: '精品黑千层', price: 88, tag: '黑千层', description: '精选优质黑毛肚，口感脆嫩', coverImage: 'https://img.freepik.com/free-photo/fresh-beef-tripas_1339-1623.jpg?w=400', images: ['https://img.freepik.com/free-photo/fresh-beef-tripas_1339-1623.jpg?w=400'], video: '', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 2, name: '白千层', price: 78, tag: '白千层', description: '白色毛肚，口感细腻', coverImage: 'https://img.freepik.com/free-photo/raw-meat-marbled-beef_1339-1527.jpg?w=400', images: ['https://img.freepik.com/free-photo/raw-meat-marbled-beef_1339-1527.jpg?w=400'], video: '', createdAt: '2024-01-02T00:00:00.000Z' },
    { id: 3, name: '虾滑', price: 45, tag: '虾滑', description: '纯手工打制虾滑，Q弹爽滑', coverImage: 'https://img.freepik.com/free-photo/fresh-shrimp-prawns_1339-1625.jpg?w=400', images: ['https://img.freepik.com/free-photo/fresh-shrimp-prawns_1339-1625.jpg?w=400'], video: '', createdAt: '2024-01-03T00:00:00.000Z' },
    { id: 4, name: '整肚', price: 128, tag: '整肚', description: '完整毛肚，保留最好口感', coverImage: 'https://img.freepik.com/free-photo/raw-meat-steak-beef_1339-1532.jpg?w=400', images: ['https://img.freepik.com/free-photo/raw-meat-steak-beef_1339-1532.jpg?w=400'], video: '', createdAt: '2024-01-04T00:00:00.000Z' },
    { id: 5, name: '边角料A', price: 35, tag: '边角料', description: '边角料实惠装', coverImage: '', images: [], video: '', createdAt: '2024-01-05T00:00:00.000Z' },
    { id: 6, name: '叶片毛肚', price: 68, tag: '叶片', description: '叶片状毛肚，薄切易熟', coverImage: '', images: [], video: '', createdAt: '2024-01-06T00:00:00.000Z' }
  ];
}
