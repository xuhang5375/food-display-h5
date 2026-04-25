var currentPage='home',isAuthorized=localStorage.getItem('food_display_admin')==='1',adminPassword='920615',selectedTag='',editProductId=null,selectedImages=[],selectedVideo=null,pendingVideoThumb=null,activeCategory='',isLoading=false;
var formName='',formPrice='',formDesc='';

document.addEventListener('DOMContentLoaded',async function(){
  var params=new URLSearchParams(window.location.search),id=params.get('id');
  if(id){loadPage('home');setTimeout(function(){showDetail(parseInt(id))},100);return;}
  loadPage('home');
});

function showToast(m,d){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(function(){t.classList.remove('show')},d||2000);}
function switchTab(p){
  document.getElementById('floatingBackBtn').style.display='none';
  isInDetail=false;
  document.querySelectorAll('.nav-item').forEach(function(i){i.classList.remove('active');if(i.dataset.page===p)i.classList.add('active')});currentPage=p;loadPage(p);}
function loadPage(p){
  if(isLoading){console.log('[loadPage] isLoading=true, forcing reset');isLoading=false;}
  var c=document.getElementById('mainContainer');
  console.log('[loadPage] switching to', p, 'isAuthorized:', isAuthorized);
  if(p==='home')renderHome(c);
  else if(p==='admin'){if(!isAuthorized)renderPwd(c);else renderAdmin(c);}
}

var TAG_META={
  '\u9ed1\u5343\u5c42':{icon:'🐂',title:'\u9ed1\u5343\u5c42'},
  '\u767d\u5343\u5c42':{icon:'🐂',title:'\u767d\u5343\u5c42'},
  '\u53f6\u7247':{icon:'🐂',title:'\u6bdb\u80a0\u53f6\u7247'},
  '\u6bdb\u80a0\u53f6\u7247':{icon:'🐂',title:'\u6bdb\u80a0\u53f6\u7247'},
  '\u6574\u809a':{icon:'🐂',title:'\u6574\u809a'},
  '\u8fb9\u89d2\u6599':{icon:'🐂',title:'\u8fb9\u89d2\u6599'},
  '\u867e\u6ed1':{icon:'🦐',title:'\u867e\u6ed1'},
  '\u5176\u4ed6':{icon:'📦',title:'\u5176\u4ed6'}
};
var TAG_ORDER=['黑千层','白千层','毛肚叶片','整肚','边角料','虾滑','其他'];

async function renderHome(c){
  isLoading=true;
  c.innerHTML='<div style="text-align:center;padding:60px 20px;color:#999"><div style="font-size:32px;margin-bottom:10px">⏳</div>加载中...</div>';
  
  var allProducts=[];
  try{allProducts=await getProducts();}catch(e){allProducts=[];showToast('商品加载失败: '+(e.message||e.name||'网络错误'),5000);console.error("[DEBUG] getProducts error:", e);}
  console.log("[DEBUG] got products:", allProducts.length);
  var byTag={};
  for(var i=0;i<allProducts.length;i++){
    var p=allProducts[i],t=p.tag||'\u5176\u4ed6';
    if(!byTag[t])byTag[t]=[];
    byTag[t].push(p);
  }
  for(var t in byTag){byTag[t].sort(function(a,b){return(parseFloat(a.price)||0)-(parseFloat(b.price)||0);});}
  var totalCount=allProducts.length;
  var sidebarH='<div class="cat-sidebar">';
  sidebarH+='<button class="sidebar-btn'+(activeCategory===''?' active':'')+'" onclick="setCategory(\'\')"><span class="sidebar-icon">📋</span><span class="sidebar-label">\u5168\u90e8</span><span class="sidebar-count">'+totalCount+'</span></button>';
  for(var ci=0;ci<TAG_ORDER.length;ci++){
    var tag=TAG_ORDER[ci],cnt=byTag[tag]?byTag[tag].length:0;
    if(cnt===0)continue;
    var meta=TAG_META[tag]||{icon:'📦',title:tag};
    sidebarH+='<button class="sidebar-btn'+(activeCategory===tag?' active':'')+'" onclick="setCategory(\''+tag+'\')"><span class="sidebar-icon">'+meta.icon+'</span><span class="sidebar-label">'+tag+'</span><span class="sidebar-count">'+cnt+'</span></button>';
  }
  sidebarH+='</div>';
  var contentW='<div class="home-content">';
  if(activeCategory===''){
    for(var ti=0;ti<TAG_ORDER.length;ti++){
      var tag=TAG_ORDER[ti],arr=byTag[tag]||[];
      if(arr.length===0)continue;
      var meta=TAG_META[tag]||{icon:'📦',title:tag};
      contentW+=renderSec(meta.icon,meta.title,arr);
    }
    if(Object.keys(byTag).length===0){contentW+='<div class="empty"><span class="empty-icon">📦</span><p>\u6682\u65e0\u5546\u54c1</p><p style="font-size:12px;color:#bbb;margin-top:10px">\u8bf7\u5230\u7ba1\u7406\u9875\u9762\u6dfb\u52a0\u5546\u54c1</p></div>';}
  } else {
    var arr=byTag[activeCategory]||[];
    if(arr.length>0){var meta=TAG_META[activeCategory]||{icon:'📦',title:activeCategory};contentW+=renderSec(meta.icon,meta.title,arr);}
    else{contentW+='<div class="empty"><span class="empty-icon">📦</span><p>\u8be5\u5206\u7c7b\u6682\u65e0\u5546\u54c1</p></div>';}
  }
  contentW+='</div>';
  c.innerHTML=sidebarH+contentW;
}

function setCategory(tag){activeCategory=tag;var c=document.getElementById('mainContainer');renderHome(c);window.scrollTo(0,0);}

function renderSec(icon,title,ps){
  var showHeader=activeCategory==='';
  var h='<div class="category-section">';
  if(showHeader){h+='<div class="category-header"><span class="category-icon">'+icon+'</span><span class="category-title">'+title+'</span><span class="category-count">'+ps.length+'\u6b3e</span></div>';}
  h+='<div class="product-grid">';
  for(var i=0;i<ps.length;i++){
    var p=ps[i];
    // \u5217\u8868\u9875\u4f18\u5148\u663e\u793a\u5546\u54c1\u56fe\u7247\uff0c\u5982\u679c\u6709\u89c6\u9891\u4e14\u56fe\u7247\u662f\u89c6\u9891\u7f29\u7565\u56fe\u5219\u8df3\u8fc7
    var img='';
    if(p.images&&p.images.length>0){
      for(var j=0;j<p.images.length;j++){
        // \u89c6\u9891\u7f29\u7565\u56feURL\u5305\u542b thumb_\uff0c\u5982\u679c\u6709\u89c6\u9891\u4e14\u56fe\u7247\u662f\u7f29\u7565\u56fe\uff0c\u8df3\u8fc7\u627e\u4e0b\u4e00\u5f20
        if(p.video && p.images[j].indexOf('thumb_')>-1) continue;
        img=p.images[j];break;
      }
    }
    if(!img)img=p.coverImage||p.cover_image||'';
    h+='<div class="product-card" onclick="showDetail('+p.id+')"><div class="media-area">';
    if(img)h+='<img src="'+img+'" alt="'+p.name+'" onerror="this.style.display=\'none\'">';
    if(p.video)h+='<div class="play-btn">▶</div>';
    h+='</div><div class="info-area"><div class="product-name">'+p.name+'</div>';
    if(p.tag && showHeader)h+='<span class="product-tag">'+p.tag+'</span>';
    h+='<div class="product-price">¥'+p.price+'</div></div></div>';
  }
  return h+'</div></div>';
}

async function showDetail(id){
  isInDetail=true;
  document.getElementById('floatingBackBtn').style.display='block';
  var p=await getProductById(id);if(!p)return;
  var c=document.getElementById('mainContainer');
  var allImgs=(p.images&&p.images.length>0)?p.images:((p.coverImage||p.cover_image)?[p.coverImage||p.cover_image]:[]);
  var backBtn=activeCategory?
    '<button class="detail-btn" onclick="setCategory(\''+activeCategory+'\')" style="background:#f0f0f0;color:#333;margin-bottom:10px">← '+activeCategory+'</button>':
    '<button class="detail-btn" onclick="switchTab(\'home\')" style="background:#f0f0f0;color:#333;margin-bottom:10px">← \u8fd4\u56de\u9996\u9875</button>';
  var h='';
  if(p.video){
    h+='<div class="detail-video-section">';
    h+='<div class="detail-video-wrapper" id="detailVideoWrapper">';
    console.log('[\u89c6\u9891] \u5546\u54c1ID='+id+' video\u5b57\u6bb5\u503c:', p.video);
    h+='<video id="detailVideo" src="'+p.video+'" playsinline preload="metadata" style="width:100%;max-height:70vw;display:block;background:#000;object-fit:contain" onerror="console.error(\'[\u89c6\u9891] \u52a0\u8f7d\u5931\u8d25:\',this.error);document.getElementById(\'detailPlayOverlay\').innerHTML=\'<span style=&quot;font-size:12px&quot;>\u89c6\u9891\u52a0\u8f7d\u5931\u8d25</span>\'"></video>';
    h+='<div class="detail-video-play-btn" id="detailPlayOverlay" onclick="toggleDetailVideo()"><span class="play-icon">▶</span></div>';
    h+='<button class="video-replay-btn" id="detailReplayBtn" onclick="replayVideo()" style="display:none">🔄 \u91cd\u65b0\u64ad\u653e</button>';
    h+='<button class="video-fullscreen-btn" onclick="toggleVideoFullscreen()">⛶ \u5168\u5c4f</button>';
    h+='</div><div class="detail-video-label">🎥 \u5546\u54c1\u89c6\u9891</div></div>';
  }
  if(allImgs.length>0){
    h+='<div class="detail-gallery"><div class="gallery-track" id="galleryTrack">';
    for(var i=0;i<allImgs.length;i++){h+='<div class="gallery-slide"><img src="'+allImgs[i]+'" alt="'+p.name+'" loading="lazy" onerror="this.parentElement.style.display=\'none\'"></div>';}
    h+='</div>';
    if(allImgs.length>1){
      h+='<div class="gallery-dots" id="galleryDots">';
      for(var i=0;i<allImgs.length;i++){h+='<span class="gallery-dot'+(i===0?' active':'')+'" onclick="slideGallery('+i+')"></span>';}
      h+='</div>';
    }
    h+='</div>';
  }
  var unit=p.unit||'\u4ef6';
  h+='<div class="detail-content">'+backBtn+'<div class="detail-name">'+p.name+'</div><div class="detail-price">¥'+p.price+'<span class="price-unit">/'+unit+'</span></div>';
  if(p.tag)h+='<span class="detail-tag">'+p.tag+'</span>';
  if(p.description)h+='<div class="detail-desc">'+p.description+'</div>';
  h+='<div class="detail-actions">';
  h+='<button class="detail-btn share" onclick="shareProduct('+p.id+')">📤 \u5206\u4eab</button>';
  h+='<button class="detail-btn copy" onclick="copyPrice('+p.price+')">📋 \u590d\u5236\u4ef7\u683c</button>';
  h+='</div><div style="margin-top:15px"><button class="detail-btn copy" onclick="switchTab(\'home\')" style="width:100%">← \u8fd4\u56de\u9996\u9875</button></div></div>';
  c.innerHTML=h;window.scrollTo(0,0);
  if(p.video){
    var vidEl=document.getElementById('detailVideo');
    if(vidEl){
      vidEl.addEventListener('ended',function(){
        var o=document.getElementById('detailPlayOverlay');
        var r=document.getElementById('detailReplayBtn');
        if(o)o.style.display='none';
        if(r){r.style.display='flex';r.onclick=function(){replayVideo();};}
      });
    }
  }
  if(allImgs.length>1)initGallerySwipe();
}

function slideGallery(idx){
  var dots=document.querySelectorAll('.gallery-dot');
  var total=dots.length;if(total===0)return;
  if(idx<0)idx=0;if(idx>=total)idx=total-1;
  galleryCurrentSlide=idx;
  var track=document.getElementById('galleryTrack');
  if(track)track.style.transform='translateX(-'+(idx*100)+'%)';
  for(var i=0;i<dots.length;i++){dots[i].classList.toggle('active',i===idx);}
}

var galleryTouchStartX=0,galleryTouchStartY=0,galleryCurrentSlide=0;
function initGallerySwipe(){
  var track=document.getElementById('galleryTrack');
  if(!track)return;
  track.addEventListener('touchstart',function(e){galleryTouchStartX=e.touches[0].clientX;galleryTouchStartY=e.touches[0].clientY;},{passive:true});
  track.addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-galleryTouchStartX;
    var dy=e.changedTouches[0].clientY-galleryTouchStartY;
    if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>40){if(dx<0)slideGallery(galleryCurrentSlide+1);else slideGallery(galleryCurrentSlide-1);}
  },{passive:true});
}

function toggleDetailVideo(){
  var v=document.getElementById('detailVideo');
  var o=document.getElementById('detailPlayOverlay');
  var r=document.getElementById('detailReplayBtn');
  if(!v)return;
  if(v.paused||v.ended){v.play();if(o)o.style.display='none';if(r)r.style.display='none';}
  else{v.pause();if(o)o.style.display='flex';}
}

function replayVideo(){
  var v=document.getElementById('detailVideo');
  var o=document.getElementById('detailPlayOverlay');
  var r=document.getElementById('detailReplayBtn');
  if(!v)return;
  v.currentTime=0;v.play();
  if(o)o.style.display='none';
  if(r)r.style.display='none';
}

function toggleVideoFullscreen(){
  var v=document.getElementById('detailVideo');
  if(!v)return;
  if(document.fullscreenElement){document.exitFullscreen();}
  else if(v.requestFullscreen){v.requestFullscreen();}
  else if(v.webkitRequestFullscreen){v.webkitRequestFullscreen();}
  else if(v.msRequestFullscreen){v.msRequestFullscreen();}
}

function copyPrice(v){var i=document.createElement('input');i.value=v;document.body.appendChild(i);i.select();document.execCommand('copy');document.body.removeChild(i);showToast('\u5df2\u590d\u5236\u4ef7\u683c ¥'+v);}
async function shareProduct(id){var p=await getProductById(id),t=p?p.name+' - ¥'+p.price:'\u98df\u6750\u5c55\u793a',u=window.location.href.split('?')[0]+'?id='+id;if(navigator.share)navigator.share({title:t,text:p?p.description:'\u65b0\u9c9c\u597d\u98df\u6750',url:u}).catch(function(){});else{copyToClipboard(u);showToast('\u94fe\u63a5\u5df2\u590d\u5236\uff0c\u53ef\u53d1\u9001\u7ed9\u597d\u53cb');}}
function sharePage(){var u=window.location.href.split('?')[0];if(navigator.share)navigator.share({title:'\u98df\u6750\u5c55\u793a',text:'\u7cbe\u9009\u6bdb\u809a\u3001\u867e\u6ed1\u7b49\u4f18\u8d28\u98df\u6750',url:u}).catch(function(){});else{copyToClipboard(u);showToast('\u94fe\u63a5\u5df2\u590d\u5236');}}
function copyToClipboard(t){var i=document.createElement('input');i.value=t;document.body.appendChild(i);i.select();document.execCommand('copy');document.body.removeChild(i);}

function renderPwd(c){
  c.innerHTML='<div class="password-modal"><div class="password-box"><div class="password-title">🔒 \u7ba1\u7406\u5458\u9a8c\u8bc1</div><input type="password" class="password-input" id="pwdInput" placeholder="\u8bf7\u8f93\u5165\u5bc6\u7801" maxlength="20"><button class="password-btn" onclick="verifyPwd()">\u8fdb\u5165\u7ba1\u7406</button></div></div>';
  document.getElementById('pwdInput').focus();
  document.getElementById('pwdInput').addEventListener('keyup',function(e){if(e.key==='Enter')verifyPwd();});
}
function verifyPwd(){var v=document.getElementById('pwdInput').value.trim();if(v===adminPassword){isAuthorized=true;localStorage.setItem('food_display_admin','1');loadPage('admin');}else{showToast('\u5bc6\u7801\u9519\u8bef');document.getElementById('pwdInput').value='';document.getElementById('pwdInput').focus();}}

async function renderAdmin(c){
  c.innerHTML='<div style="text-align:center;padding:40px;color:#999">⏳ \u52a0\u8f7d\u4e2d...</div>';
  var ps=await getProducts();
  ps.sort(function(a,b){return(parseFloat(a.price)||0)-(parseFloat(b.price)||0);});
  var h='<button class="submit-btn" style="margin-bottom:15px;background:#ff9800;font-size:16px;padding:14px 24px" onclick="showAddProduct()">➕ \u6dfb\u52a0\u5546\u54c1</button>';
  h+='<div class="admin-header"><div class="admin-title">⚙️ \u5546\u54c1\u7ba1\u7406\uff08'+ps.length+'\u4ef6\uff09</div><button class="header-btn" onclick="logoutAdmin()">\u9000\u51fa</button></div>';
  if(ps.length===0){h+='<div class="empty"><span class="empty-icon">📦</span><p>\u6682\u65e0\u5546\u54c1</p></div>';}
  else{h+='<div class="admin-list">';
    for(var i=0;i<ps.length;i++){
      var p=ps[i],img=p.coverImage||(p.images&&p.images[0])||p.cover_image||'';
      h+='<div class="admin-item">';
      if(img)h+='<img src="'+img+'" alt="'+p.name+'" onerror="this.style.display=\'none\'">';
      h+='<div class="admin-item-info"><div><div class="admin-item-name">'+p.name+'</div>';
      if(p.tag)h+='<div class="admin-item-tag">'+p.tag+'</div>';
      h+='</div><div class="admin-item-price">¥'+p.price+'</div>';
      h+='<div class="admin-item-actions">';
      h+='<button class="admin-action-btn edit" onclick="editProduct('+p.id+')">\u7f16\u8f91</button>';
      h+='<button class="admin-action-btn delete" onclick="deleteProductConfirm('+p.id+')">\u5220\u9664</button>';
      h+='</div></div></div>';
    }
    h+='</div>';
  }
  c.innerHTML=h;
}
function logoutAdmin(){isAuthorized=false;localStorage.removeItem('food_display_admin');switchTab('home');}
async function deleteProductConfirm(id){if(confirm('\u786e\u5b9a\u8981\u5220\u9664\u8fd9\u4e2a\u5546\u54c1\u5417\uff1f')){await deleteProduct(id);showToast('\u5220\u9664\u6210\u529f');loadPage('admin');}}
async function editProduct(id){var p=await getProductById(id);if(p)showAddProduct(p);}

// ============================================================
// \u6838\u5fc3\uff1a\u8868\u5355\u91cd\u5efa\u51fd\u6570\uff08\u6240\u6709\u4fee\u6539\u8868\u5355\u7684\u64cd\u4f5c\u90fd\u8c03\u7528\u8fd9\u4e2a\uff09
// ============================================================
function rebuildForm(){
  var nameVal=formName;
  var priceVal=formPrice;
  var descVal=formDesc;
  var isEdit=editProductId!==null;
  var tags=['黑千层','白千层','毛肚叶片','整肚','边角料','虾滑','其他'];
  var tagH='<div class="tag-list">';
  for(var i=0;i<tags.length;i++){var act=selectedTag===tags[i]?' active':'';tagH+='<span class="tag-item'+act+'" onclick="selectTag(this,\''+tags[i]+'\')">'+tags[i]+'</span>';}
  tagH+='</div>';
  var imgH='';
  for(var j=0;j<selectedImages.length;j++){imgH+='<div class="image-preview-item"><img src="'+selectedImages[j]+'" onerror="this.style.display=\'none\'"><button class="delete-btn" onclick="removeImage('+j+')">×</button><button class="set-cover-btn" onclick="setCover('+j+')">\u5c01\u9762</button></div>';}
  var vidH='';
  if(selectedVideo || pendingVideoThumb){
    var thumbSrc=pendingVideoThumb||'';
    var vidLabel=typeof selectedVideo==='string'?selectedVideo:(selectedVideo?selectedVideo.name:'');
    vidH='<div class="video-preview" id="videoPreview">';
    if(thumbSrc&&thumbSrc.indexOf('data:')===0){
      vidH+='<div class="video-thumb-img-wrap"><img src="'+thumbSrc+'" class="video-thumb-img" alt="\u89c6\u9891\u9884\u89c8"></div>';
    } else {
      vidH+='<div class="video-thumb-placeholder"><div class="video-thumb-icon">🎬</div><div class="video-thumb-name">'+(vidLabel||'\u5df2\u9009\u62e9\u89c6\u9891')+'</div></div>';
    }
    vidH+='<button class="delete-btn" onclick="removeVideo()">×</button></div>';
  }
  var c=document.getElementById('mainContainer');
  c.innerHTML='<div class="modal-overlay show" id="addModal"><div class="modal">'+
    '<div class="modal-header"><h3>'+(isEdit?'✏️ \u7f16\u8f91\u5546\u54c1':'➕ \u6dfb\u52a0\u5546\u54c1')+'</h3><button class="modal-close" onclick="closeModal()">×</button></div>'+
    '<div class="modal-body">'+
    '<div class="form-item"><label class="form-label">\u5546\u54c1\u540d\u79f0 *</label><input class="form-input" id="fName" placeholder="\u5982\uff1a\u7cbe\u54c1\u9ed1\u5343\u5c42" value="'+nameVal+'" oninput="formName=this.value"></div>'+
    '<div class="form-item"><label class="form-label">\u4ef7\u683c\uff08\u5143\uff09*</label><input class="form-input" id="fPrice" type="number" placeholder="\u5982\uff1a88" value="'+priceVal+'" oninput="formPrice=this.value"></div>'+
    '<div class="form-item"><label class="form-label">\u5546\u54c1\u7c7b\u522b</label>'+tagH+'</div>'+
    '<div class="form-item"><label class="form-label">\u5546\u54c1\u63cf\u8ff0</label><textarea class="form-input" id="fDesc" placeholder="\u63cf\u8ff0\u5546\u54c1\u7279\u70b9..." oninput="formDesc=this.value">'+descVal+'</textarea></div>'+
    '<div class="form-item"><label class="form-label">\u5546\u54c1\u56fe\u7247\uff08\u6700\u591a9\u5f20\uff0c\u81ea\u52a8\u538b\u7f29\uff09</label>'+imgH+'<div class="upload-area" onclick="document.getElementById(\'imgInput\').click()"><div class="upload-icon">📷</div><div class="upload-text">\u70b9\u51fb\u4e0a\u4f20\u56fe\u7247</div></div><input type="file" id="imgInput" accept="image/*" multiple style="display:none" onchange="handleImageUpload(this)"></div>'+
    '<div class="form-item"><label class="form-label">\u5546\u54c1\u89c6\u9891\uff08\u53ef\u9009\uff0c\u81ea\u52a8\u63d0\u53d6\u7f29\u7565\u56fe\uff09</label>'+vidH+'<div class="upload-area" onclick="document.getElementById(\'vidInput\').click()"><div class="upload-icon">🎬</div><div class="upload-text">\u70b9\u51fb\u4e0a\u4f20\u89c6\u9891</div></div><input type="file" id="vidInput" accept="video/*" style="display:none" onchange="handleVideoUpload(this)"></div>'+
    '<button class="submit-btn" onclick="saveProduct()">'+(isEdit?'💾 \u4fdd\u5b58\u4fee\u6539':'✅ \u6dfb\u52a0\u5546\u54c1')+'</button>'+
    '</div></div></div>';
}

function showAddProduct(product){
  editProductId=product?product.id:null;
  selectedImages=product?(product.images||[]):[];
  selectedVideo=product?(product.video||null):null;
  pendingVideoThumb=null;
  selectedTag=product?(product.tag||''):'';
  formName=product?(product.name||''):'';
  formPrice=product?(product.price||''):'';
  formDesc=product?(product.description||''):'';
  rebuildForm();
}

function selectTag(el,tag){
  selectedTag=tag;
  rebuildForm();
}

function removeImage(idx){selectedImages.splice(idx,1);rebuildForm();}
function setCover(idx){if(selectedImages[idx]){var t=selectedImages[idx];selectedImages.splice(idx,1);selectedImages.unshift(t);}rebuildForm();}
function removeVideo(){selectedVideo=null;pendingVideoThumb=null;rebuildForm();}
function closeModal(){var overlay=document.getElementById('addModal');if(overlay)overlay.classList.remove('show');editProductId=null;selectedImages=[];selectedVideo=null;pendingVideoThumb=null;selectedTag='';}

function goBackHome(){switchTab('home');}

/* \u56fe\u7247\u538b\u7f29\uff1a\u6700\u5927\u8fb91200px\uff0cJPEG\u8d28\u91cf0.7 */
function compressImage(file,callback){
  var reader=new FileReader();
  reader.onload=function(e){
    var img=new Image();
    img.onload=function(){
      var MAX=1200;
      var w=img.naturalWidth||img.width;
      var h=img.naturalHeight||img.height;
      var scale=(w>MAX||h>MAX)?Math.min(MAX/w,MAX/h):1;
      var nw=Math.round(w*scale),nh=Math.round(h*scale);
      var canvas=document.createElement('canvas');
      canvas.width=nw;canvas.height=nh;
      canvas.getContext('2d').drawImage(img,0,0,nw,nh);
      canvas.toBlob(function(blob){
        if(!blob){callback(e.target.result);return;}
        var fr=new FileReader();
        fr.onload=function(ev){callback(ev.target.result);};
        fr.readAsDataURL(blob);
      },'image/jpeg',0.7);
    };
    img.onerror=function(){callback(e.target.result);};
    img.src=e.target.result;
  };
  reader.onerror=function(){callback(null);};
  reader.readAsDataURL(file);
}

/* \u89c6\u9891\u7b2c\u4e00\u5e27\u9884\u89c8\u56fe */
function extractVideoThumb(file,callback){
  var reader=new FileReader();
  reader.onload=function(e){
    var video=document.createElement('video');
    video.preload='metadata';video.muted=true;video.playsInline=true;
    var url=URL.createObjectURL(file);
    video.onloadeddata=function(){video.currentTime=Math.min(1,video.duration*0.1);};
    video.onseeked=function(){
      var canvas=document.createElement('canvas');
      canvas.width=320;canvas.height=240;
      canvas.getContext('2d').drawImage(video,0,0,320,240);
      URL.revokeObjectURL(url);
      canvas.toBlob(function(blob){if(!blob){callback(null);return;}var fr=new FileReader();fr.onload=function(ev){callback(ev.target.result);};fr.readAsDataURL(blob);},'image/jpeg',0.6);
    };
    video.onerror=function(){URL.revokeObjectURL(url);callback(null);};
    video.src=url;video.load();
  };
  reader.onerror=function(){callback(null);};
  reader.readAsDataURL(file);
}

/* \u5904\u7406\u56fe\u7247\u4e0a\u4f20 */
function handleImageUpload(input){
  if(!input.files||input.files.length===0)return;
  var filesToRead=[];
  for(var i=0;i<input.files.length&&selectedImages.length<9;i++){filesToRead.push(input.files[i]);}
  if(filesToRead.length===0){showToast('\u56fe\u7247\u5df2\u8fbe\u4e0a\u9650\uff089\u5f20\uff09');return;}
  var loaded=0,newImages=[];
  var checkDone=function(){
    for(var k=0;k<newImages.length;k++)selectedImages.push(newImages[k]);
    rebuildForm();
  };
  for(var j=0;j<filesToRead.length;j++){
    (function(file){
      compressImage(file,function(result){
        if(result)newImages.push(result);
        loaded++;
        if(loaded===filesToRead.length){
          if(newImages.length>0)checkDone();else showToast('\u56fe\u7247\u538b\u7f29\u5931\u8d25');
        }
      });
    })(filesToRead[j]);
  }
}

/* \u5904\u7406\u89c6\u9891\u4e0a\u4f20\uff1a\u53ea\u63d0\u53d6\u7f29\u7565\u56fe\uff0c\u4e0d\u52a0\u5165\u56fe\u7247\u5217\u8868\uff0c\u4fdd\u5b58\u65f6\u624d\u4e0a\u4f20 */
function handleVideoUpload(input){
  if(!input.files||!input.files[0])return;
  var file=input.files[0];
  selectedVideo=file;
  extractVideoThumb(file,function(thumb){
    pendingVideoThumb=thumb||null;
    rebuildForm();
    showToast('\u89c6\u9891\u5df2\u9009\u62e9\uff1a'+file.name);
  });
}

/* \u4fdd\u5b58\u5546\u54c1\uff1a\u56fe\u7247\u5df2\u538b\u7f29\u4e3abase64\u5b58DB\uff1b\u89c6\u9891\u4e0a\u4f20\u5230COS\u540e\u5b58URL */
async function saveProduct(){
  var name=document.getElementById('fName').value.trim();
  var price=document.getElementById('fPrice').value.trim();
  var desc=document.getElementById('fDesc').value.trim();
  if(!name){showToast('\u8bf7\u8f93\u5165\u5546\u54c1\u540d\u79f0');return;}
  if(!price||isNaN(price)){showToast('\u8bf7\u8f93\u5165\u6b63\u786e\u7684\u4ef7\u683c');return;}
  if(selectedImages.length===0){showToast('\u8bf7\u81f3\u5c11\u4e0a\u4f20\u4e00\u5f20\u56fe\u7247');return;}

  var btn=document.querySelector('.submit-btn');
  if(btn){btn.disabled=true;btn.textContent='\u4fdd\u5b58\u4e2d...'}

  // \u6784\u5efa\u5546\u54c1\u6570\u636e\uff1a\u56fe\u7247\u5b58base64\u6570\u7ec4\uff0c\u89c6\u9891URL\u5f85\u5b9a
  var product={
    name:name,
    price:parseFloat(price),
    description:desc,
    tag:selectedTag,
    images:selectedImages,
    coverImage:selectedImages[0],
    video:''
  };

  // \u5982\u679c\u9009\u4e86\u89c6\u9891\u6587\u4ef6\uff0c\u5148\u4e0a\u4f20\u5230 COS
  if(selectedVideo && (typeof selectedVideo !== 'string')){
    var file=selectedVideo;
    var ext=file.name.split('.').pop()||'mp4';
    var cosPath='video-'+Date.now()+'.'+ext;
    console.log('[\u89c6\u9891] \u5f00\u59cb\u4e0a\u4f20:', cosPath, (file.size/1048576).toFixed(1)+'MB');
    var up=await uploadToCOS(cosPath,file,file.type||'video/mp4');
    if(up&&up.url){
      product.video=up.url;
      console.log('[\u89c6\u9891] \u4e0a\u4f20\u6210\u529f:', up.url);
    } else {
      console.error('[\u89c6\u9891] \u4e0a\u4f20\u5931\u8d25');
    }
  } else if(typeof selectedVideo === 'string' && selectedVideo.indexOf('cos.')>-1){
    // \u7f16\u8f91\u65f6 selectedVideo \u5df2\u662f COS URL
    product.video=selectedVideo;
  }

  if(editProductId){
    await updateProduct(editProductId,product);
    showToast('\u4fee\u6539\u6210\u529f');
  } else {
    await createProduct(product);
    showToast('\u6dfb\u52a0\u6210\u529f');
  }
  setTimeout(function(){
    editProductId=null;
    selectedImages=[];
    selectedVideo=null;
    pendingVideoThumb=null;
    selectedTag='';
    loadPage('admin');
  },1500);
}

