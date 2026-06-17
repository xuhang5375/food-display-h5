// cache-bust: 20260427-1420
// js/data.js [20260427150000] - Supabase DB + COS Upload v3
// Upload: Tencent COS XML API | Read: Tencent COS CDN | DB: Supabase REST
 | CDN-FORCE-20260427-1659

var SUPABASE_URL = 'https://infsqrfqksvqzlapvott.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_2z92LEUAiZf6smg9aiufFg_p16OStvD';

// 鑵捐浜?COS 閰嶇疆
// 鈿狅笍 璇锋浛鎹负浣犺嚜宸辩殑鑵捐浜戝瘑閽ワ紝鎴栭€氳繃鐜鍙橀噺娉ㄥ叆
var COS_SECRET_ID = '[YOUR_COS_SECRET_ID]';
var COS_SECRET_KEY = '[YOUR_COS_SECRET_KEY]';
var COS_BUCKET = '799195375-1306702381';
var COS_REGION = 'ap-guangzhou';
var COS_HOST = COS_BUCKET + '.cos.' + COS_REGION + '.myqcloud.com';
var COS_BASE_URL = 'https://' + COS_HOST;
var COS_FOLDER = 'product-media';

// --- COS 绛惧悕宸ュ叿鍑芥暟锛堟祻瑙堝櫒绔?Web Crypto API锛?--

function _arrayBufferToHex(buf) {
  return Array.from(new Uint8Array(buf)).map(function(b) {
    return b.toString(16).padStart(2, '0');
  }).join('');
}

async function _hmacSha1(key, data) {
  var enc = new TextEncoder();
  var k = await crypto.subtle.importKey(
    'raw', enc.encode(key),
    { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  var sig = await crypto.subtle.sign('HMAC', k, enc.encode(data));
  return _arrayBufferToHex(sig);
}

async function _sha1(data) {
  var enc = new TextEncoder();
  var hash = await crypto.subtle.digest('SHA-1', enc.encode(data));
  return _arrayBufferToHex(hash);
}

// 鐢熸垚 COS XML API v1 Authorization
async function _cosAuth(httpMethod, objectKey) {
  var now = Math.floor(Date.now() / 1000);
  var keyTime = now + ';' + (now + 3600);
  var formatStr = httpMethod.toLowerCase() + '\n/' + objectKey + '\n\nhost=' + COS_HOST.toLowerCase() + '\n';
  var sha1Format = await _sha1(formatStr);
  var stringToSign = 'sha1\n' + keyTime + '\n' + sha1Format + '\n';
  var signature = await _hmacSha1(COS_SECRET_KEY, stringToSign);
  return 'q-sign-algorithm=sha1&q-ak=' + COS_SECRET_ID +
    '&q-sign-time=' + keyTime + '&q-key-time=' + keyTime +
    '&q-header-list=host&q-url-param-list=&q-signature=' + signature;
}

// --- Supabase REST API ---

async function supabaseFetch(path, method, body) {
  var apiKey = SUPABASE_ANON_KEY;
  var opts = {
    method: method || 'GET',
    headers: {
      'apikey': apiKey,
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  
  // 娣诲姞瓒呮椂鎺у埗
  var controller = new AbortController();
  var timeoutId = setTimeout(function() { controller.abort(); }, 15000);
  opts.signal = controller.signal;
  
  try {
    var r = await fetch(SUPABASE_URL + '/rest/v1' + path, opts);
    clearTimeout(timeoutId);
    if (r.status === 204) return [];
    var j = await r.json();
    if (!r.ok) { console.error('Supabase error', r.status, j); return []; }
    return Array.isArray(j) ? j : (j.data || []);
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('Supabase fetch error:', e);
    return [];
  }
}

// --- COS 涓婁紶 ---

async function uploadToCOS(path, file, contentType) {
  var objectKey = COS_FOLDER + '/' + path;
  var url = COS_BASE_URL + '/' + objectKey;
  var isVideo = (contentType || '').indexOf('video') > -1;
  // 瑙嗛鐢?5 鍒嗛挓瓒呮椂锛屽浘鐗囩敤 60 绉?  var timeoutMs = isVideo ? 300000 : 60000;
  var sizeMB = file.size ? (file.size / 1048576).toFixed(1) : '?';

  console.log('[COS] 寮€濮嬩笂浼?, path, sizeMB + 'MB', contentType, '瓒呮椂:' + (timeoutMs/1000) + 's');

  var putAuth = await _cosAuth('PUT', objectKey);

  var controller = new AbortController();
  var timeoutId = setTimeout(function() {
    console.error('[COS] 涓婁紶瓒呮椂锛佹枃浠跺ぇ灏?', sizeMB + 'MB');
    controller.abort();
  }, timeoutMs);

  try {
    var r = await fetch(url, {
      method: 'PUT',
      signal: controller.signal,
      headers: {
        'Authorization': putAuth,
        'Content-Type': contentType || 'application/octet-stream'
      },
      body: file
    });
    clearTimeout(timeoutId);
    if (!r.ok) {
      var err = await r.text().catch(function() { return ''; });
      console.error('[COS] 涓婁紶澶辫触 HTTP', r.status, err);
      return null;
    }
    console.log('[COS] 涓婁紶鎴愬姛:', url);
    return url;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      console.error('[COS] 涓婁紶琚腑姝紙瓒呮椂锛夋枃浠跺ぇ灏?', sizeMB + 'MB');
    } else {
      console.error('[COS] 涓婁紶寮傚父:', e.name, e.message);
    }
    return null;
  }
}

// 鑾峰彇鍏紑璁块棶 URL锛堝吋瀹规棫鏁版嵁锛?function getStoragePublicUrl(path) {
  if (!path) return '';
  if (path.indexOf('http') === 0) return path;
  if (path.indexOf('cos.') > -1) return path;
  var key = path.indexOf('product-media/') === 0 ? path : ('product-media/' + path);
  return COS_BASE_URL + '/' + key;
}

// 鍏煎鏃ф帴鍙ｅ悕
async function uploadToStorage(path, file, contentType) {
  return uploadToCOS(path, file, contentType);
}

// --- 鍟嗗搧 CRUD ---

async function getProducts() {
  var rows = await supabaseFetch('/products?select=id,name,price,unit,tag,description,cover_image,video,images,created_at&order=created_at.asc', 'GET');
  return rows.map(function(r) {
    var imgs = r.images || [];
    // 杞崲姣忓紶鍥撅細COS 璺緞 鈫?瀹屾暣 URL锛宐ase64/http 鐩撮€?    var images = imgs.map(function(img) {
      if (!img) return '';
      if (img.indexOf('http') === 0 || img.indexOf('data:') === 0) return img;
      return getStoragePublicUrl(img);
    }).filter(function(u) { return !!u; });
    return {
      id: r.id,
      name: r.name,
      price: r.price,
      unit: r.unit || '\u4ef6',
      tag: r.tag || '',
      description: r.description || '',
      coverImage: getStoragePublicUrl(r.cover_image),
      images: images,
      video: getStoragePublicUrl(r.video),
      createdAt: r.created_at
    };
  });
}

async function getProduct(id) {
  var rows = await supabaseFetch('/products?id=eq.' + id + '&select=id,name,price,unit,tag,description,cover_image,video,images,created_at', 'GET');
  if (!rows.length) return null;
  var r = rows[0];
  var imgs = r.images || [];
  var images = imgs.map(function(img) {
    if (!img) return '';
    if (img.indexOf('http') === 0 || img.indexOf('data:') === 0) return img;
    return getStoragePublicUrl(img);
  }).filter(function(u) { return !!u; });
  return {
    id: r.id,
    name: r.name,
    price: r.price,
    unit: r.unit || '\u4ef6',
    tag: r.tag || '',
    description: r.description || '',
    coverImage: getStoragePublicUrl(r.cover_image),
    images: images,
    video: getStoragePublicUrl(r.video),
    createdAt: r.created_at
  };
}

async function createProduct(data) {
  var body = {
    name: data.name,
    price: parseFloat(data.price) || 0,
    unit: data.unit || '\u4ef6',
    tag: data.tag || '',
    description: data.description || '',
    cover_image: data.coverImage || (data.images && data.images[0]) || '',
    video: data.video || '',
    images: data.images || []
  };
  return await supabaseFetch('/products', 'POST', body);
}

async function updateProduct(id, data) {
  var updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.price !== undefined) updates.price = parseFloat(data.price) || 0;
  if (data.unit !== undefined) updates.unit = data.unit;
  if (data.tag !== undefined) updates.tag = data.tag;
  if (data.description !== undefined) updates.description = data.description;
  if (data.coverImage !== undefined) updates.cover_image = data.coverImage;
  if (data.video !== undefined) updates.video = data.video;
  if (data.images !== undefined) updates.images = data.images;
  return await supabaseFetch('/products?id=eq.' + id, 'PATCH', updates);
}

async function deleteProduct(id) {
  return await supabaseFetch('/products?id=eq.' + id, 'DELETE', null);
}

var getProductById = getProduct;

window.AppData = {
  getProducts: getProducts,
  getProduct: getProduct,
  createProduct: createProduct,
  updateProduct: updateProduct,
  deleteProduct: deleteProduct,
  uploadToCOS: uploadToCOS,
  uploadToStorage: uploadToCOS,
  getStoragePublicUrl: getStoragePublicUrl
};
