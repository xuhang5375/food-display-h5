var currentPage='home',isAuthorized=localStorage.getItem('food_display_admin')==='1',adminPassword='920615',selectedTag='',editProductId=null,selectedImages=[],selectedVideo='',activeCategory='',isLoading=false;

document.addEventListener('DOMContentLoaded',async function(){
  var params=new URLSearchParams(window.location.search),id=params.get('id');
  if(id){loadPage('home');setTimeout(function(){showDetail(parseInt(id))},100);return;}
  loadPage('home');
});

function showToast(m,d){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(function(){t.classList.remove('show')},d||2000);}
function switchTab(p){document.querySelectorAll('.nav-item').forEach(function(i){i.classList.remove('active');if(i.dataset.page===p)i.classList.add('active')});currentPage=p;loadPage(p);}

function loadPage(p){
  if(isLoading)return;
  var c=document.getElementById('mainContainer');
  if(p==='home')renderHome(c);
  else if(p==='admin'){if(!isAuthorized)renderPwd(c);else renderAdmin(c);}
}

var TAG_META={
  '黑千层':{icon:'🐂',title:'黑千层'},
  '白千层':{icon:'🐂',title:'白千层'},
  '叶片':{icon:'🐂',title:'叶片'},
  '整肚':{icon:'🐂',title:'整肚'},
  '边角料':{icon:'🐂',title:'边角料'},
  '虾滑':{icon:'🦐',title:'虾滑'},
  '其他':{icon:'📦',title:'其他'}
};
var TAG_ORDER=['黑千层','白千层','叶片','整肚','边角料','虾滑','其他'];

async function renderHome(c){
  isLoading=true;
  c.innerHTML='<div style="text-align:center;padding:60px 20px;color:#999"><div style="font-size:32px;margin-bottom:10px">⏳</div>加载中...</div>';
  var allProducts=[];
  try{
    allProducts=await getProducts();
  } catch(e){
    console.error('getProducts failed',e);
    allProducts=[];
  }
  isLoading=false;
  var byTag={};
  for(var i=0;i<allProducts.length;i++){
    var p=allProducts[i],t=p.tag||'其他';
    if(!byTag[t])byTag[t]=[];
    byTag[t].push(p);
  }
  for(var t in byTag){
    byTag[t].sort(function(a,b){return(parseFloat(a.price)||0)-(parseFloat(b.price)||0);});
  }
  var totalCount=allProducts.length;
  var sidebarH='<div class="cat-sidebar">';
  sidebarH+='<button class="sidebar-btn'+(activeCategory===''?' active':'')+'" onclick="setCategory(\'\')"><span class="sidebar-icon">📋</span><span class="sidebar-label">全部</span><span class="sidebar-count">'+totalCount+'</span></button>';
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
    if(Object.keys(byTag).length===0){
      contentW+='<div class="empty"><span class="empty-icon">📦</span><p>暂无商品</p><p style="font-size:12px;color:#bbb;margin-top:10px">请到管理页面添加商品</p></div>';
    }
  } else {
    var arr=byTag[activeCategory]||[];
    if(arr.length>0){
      var meta=TAG_META[activeCategory]||{icon:'📦',title:activeCategory};
      contentW+=renderSec(meta.icon,meta.title,arr);
    } else {
      contentW+='<div class="empty"><span class="empty-icon">📦</span><p>该分类暂无商品</p></div>';
    }
  }
  contentW+='</div>';
  c.innerHTML=sidebarH+contentW;
}

function setCategory(tag){
  activeCategory=tag;
  var c=document.getElementById('mainContainer');
  renderHome(c);
  window.scrollTo(0,0);
}

function renderSec(icon,title,ps){
  var showHeader=activeCategory==='';
  var h='<div class="category-section">';
  if(showHeader){
    h+='<div class="category-header"><span class="category-icon">'+icon+'</span><span class="category-title">'+title+'</span><span class="category-count">'+ps.length+'款</span></div>';
  }
  h+='<div class="product-grid">';
  for(var i=0;i<ps.length;i++){
    var p=ps[i],img=p.coverImage||(p.images&&p.images[0])||p.cover_image||'';
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
  var p=await getProductById(id);if(!p)return;
  var c=document.getElementById('mainContainer'),img=p.coverImage||(p.images&&p.images[0])||p.cover_image||'';
  var backBtn='';
  if(activeCategory){
    backBtn='<button class="detail-btn" onclick="setCategory(\''+activeCategory+'\')" style="background:#f0f0f0;color:#333;margin-bottom:10px">← '+activeCategory+'</button>';
  } else {
    backBtn='<button class="detail-btn" onclick="switchTab(\'home\')" style="background:#f0f0f0;color:#333;margin-bottom:10px">← 返回首页</button>';
  }
  var h='<div class="detail-media">';
  if(img)h+='<img src="'+img+'" alt="'+p.name+'">';
  h+='</div><div class="detail-content">'+backBtn+'<div class="detail-name">'+p.name+'</div><div class="detail-price">¥'+p.price+'</div>';
  if(p.tag)h+='<span class="detail-tag">'+p.tag+'</span>';
  if(p.description)h+='<div class="detail-desc">'+p.description+'</div>';
  h+='<div class="detail-actions">';
  h+='<button class="detail-btn share" onclick="shareProduct('+p.id+')">📤 分享</button>';
  h+='<button class="detail-btn copy" onclick="copyPrice('+p.price+')">📋 复制价格</button>';
  h+='</div>';
  h+='<div style="margin-top:15px"><button class="detail-btn copy" onclick="switchTab(\'home\')" style="width:100%">← 返回首页</button></div>';
  h+='</div>';
  c.innerHTML=h;window.scrollTo(0,0);
}

function copyPrice(v){var i=document.createElement('input');i.value=v;document.body.appendChild(i);i.select();document.execCommand('copy');document.body.removeChild(i);showToast('已复制价格 ¥'+v);}
async function shareProduct(id){var p=await getProductById(id),t=p?p.name+' - ¥'+p.price:'食材展示',u=window.location.href.split('?')[0]+'?id='+id;if(navigator.share)navigator.share({title:t,text:p?p.description:'新鲜好食材',url:u}).catch(function(){});else{copyToClipboard(u);showToast('链接已复制，可发送给好友');}}
function sharePage(){var u=window.location.href.split('?')[0];if(navigator.share)navigator.share({title:'食材展示 - 新鲜好食材',text:'精选毛肚、虾滑等优质食材',url:u}).catch(function(){});else{copyToClipboard(u);showToast('链接已复制，可发送给好友');}}
function copyToClipboard(t){var i=document.createElement('input');i.value=t;document.body.appendChild(i);i.select();document.execCommand('copy');document.body.removeChild(i);}

function renderPwd(c){
  c.innerHTML='<div class="password-modal"><div class="password-box"><div class="password-title">🔒 管理员验证</div><input type="password" class="password-input" id="pwdInput" placeholder="请输入密码" maxlength="20"><button class="password-btn" onclick="verifyPwd()">进入管理</button></div></div>';
  document.getElementById('pwdInput').focus();
  document.getElementById('pwdInput').addEventListener('keyup',function(e){if(e.key==='Enter')verifyPwd()});
}
function verifyPwd(){var v=document.getElementById('pwdInput').value.trim();if(v===adminPassword){isAuthorized=true;localStorage.setItem('food_display_admin','1');loadPage('admin');}else{showToast('密码错误');document.getElementById('pwdInput').value='';document.getElementById('pwdInput').focus();}}

async function renderAdmin(c){
  c.innerHTML='<div style="text-align:center;padding:40px;color:#999">⏳ 加载中...</div>';
  var ps=await getProducts();
  ps.sort(function(a,b){return(parseFloat(a.price)||0)-(parseFloat(b.price)||0);});
  var h='<button class="submit-btn" style="margin-bottom:15px;background:#ff9800;font-size:16px;padding:14px 24px" onclick="showAddProduct()">➕ 添加商品</button>';
  h+='<div class="admin-header"><div class="admin-title">⚙️ 商品管理（'+ps.length+'件）</div><button class="header-btn" onclick="logoutAdmin()">退出</button></div>';
  if(ps.length===0){h+='<div class="empty"><span class="empty-icon">📦</span><p>暂无商品</p></div>';}
  else{
    h+='<div class="admin-list">';
    for(var i=0;i<ps.length;i++){
      var p=ps[i],img=p.coverImage||(p.images&&p.images[0])||p.cover_image||'';
      h+='<div class="admin-item">';
      if(img)h+='<img src="'+img+'" alt="'+p.name+'" onerror="this.style.display=\'none\'">';
      h+='<div class="admin-item-info"><div><div class="admin-item-name">'+p.name+'</div>';
      if(p.tag)h+='<div class="admin-item-tag">'+p.tag+'</div>';
      h+='</div><div class="admin-item-price">¥'+p.price+'</div>';
      h+='<div class="admin-item-actions">';
      h+='<button class="admin-action-btn edit" onclick="editProduct('+p.id+')">编辑</button>';
      h+='<button class="admin-action-btn delete" onclick="deleteProductConfirm('+p.id+')">删除</button>';
      h+='</div></div></div>';
    }
    h+='</div>';
  }
  c.innerHTML=h;
}
function logoutAdmin(){isAuthorized=false;localStorage.removeItem('food_display_admin');switchTab('home');}
async function deleteProductConfirm(id){if(confirm('确定要删除这个商品吗？')){await deleteProduct(id);showToast('删除成功');loadPage('admin');}}
async function editProduct(id){var p=await getProductById(id);if(p)showAddProduct(p);}

function showAddProduct(product){
  editProductId=product?product.id:null;
  selectedImages=product?(product.images||[]):[];
  selectedVideo=product?(product.video||''):'';
  selectedTag=product?(product.tag||''):'';
  var isEdit=editProductId!==null;
  var tags=['黑千层','白千层','叶片','整肚','边角料','虾滑','其他'];
  var tagH='<div class="tag-list">';
  for(var i=0;i<tags.length;i++){var act=selectedTag===tags[i]?' active':'';tagH+='<span class="tag-item'+act+'" onclick="selectTag(this,\''+tags[i]+'\')">'+tags[i]+'</span>';}
  tagH+='</div>';
  var imgH='';
  for(var j=0;j<selectedImages.length;j++){imgH+='<div class="image-preview-item"><img src="'+selectedImages[j]+'" onerror="this.style.display=\'none\'"><button class="delete-btn" onclick="removeImage('+j+')">×</button><button class="set-cover-btn" onclick="setCover('+j+')">封面</button></div>';}
  var vidH=selectedVideo?'<div class="video-preview"><div class="video-thumb-placeholder"><div class="video-thumb-icon">🎬</div><div class="video-thumb-name">'+selectedVideo+'</div></div><button class="delete-btn" onclick="removeVideo()">×</button></div>':'';
  var c=document.getElementById('mainContainer');
  var pName=product?product.name:'';
  var pPrice=product?product.price:'';
  var pDesc=product?product.description:'';
  c.innerHTML='<div class="modal-overlay show" id="addModal"><div class="modal">'+
    '<div class="modal-header"><h3>'+(isEdit?'✏️ 编辑商品':'➕ 添加商品')+'</h3><button class="modal-close" onclick="closeModal()">×</button></div>'+
    '<div class="modal-body">'+
    '<div class="form-item"><label class="form-label">商品名称 *</label><input class="form-input" id="fName" placeholder="如：精品黑千层" value="'+pName+'"></div>'+
    '<div class="form-item"><label class="form-label">价格（元）*</label><input class="form-input" id="fPrice" type="number" placeholder="如：88" value="'+pPrice+'"></div>'+
    '<div class="form-item"><label class="form-label">商品类别</label>'+tagH+'</div>'+
    '<div class="form-item"><label class="form-label">商品描述</label><textarea class="form-input" id="fDesc" placeholder="描述商品特点...">'+pDesc+'</textarea></div>'+
    '<div class="form-item"><label class="form-label">商品图片（最多9张，自动压缩）</label>'+imgH+'<div class="upload-area" onclick="document.getElementById(\'imgInput\').click()"><div class="upload-icon">📷</div><div class="upload-text">点击上传图片</div></div><input type="file" id="imgInput" accept="image/*" multiple style="display:none" onchange="handleImageUpload(this)"></div>'+
    '<div class="form-item"><label class="form-label">商品视频（可选，自动提取缩略图）</label>'+vidH+'<div class="upload-area" onclick="document.getElementById(\'vidInput\').click()"><div class="upload-icon">🎬</div><div class="upload-text">点击上传视频</div></div><input type="file" id="vidInput" accept="video/*" style="display:none" onchange="handleVideoUpload(this)"></div>'+
    '<button class="submit-btn" onclick="saveProduct()">'+(isEdit?'💾 保存修改':'✅ 添加商品')+'</button>'+
    '</div></div></div>';
}

function selectTag(el,tag){
  var nameVal='',priceVal='',descVal='';
  var nameEl=document.getElementById('fName');
  var priceEl=document.getElementById('fPrice');
  var descEl=document.getElementById('fDesc');
  if(nameEl)nameVal=nameEl.value;
  if(priceEl)priceVal=priceEl.value;
  if(descEl)descVal=descEl.value;
  selectedTag=tag;
  var isEdit=editProductId!==null;
  var tags=['黑千层','白千层','叶片','整肚','边角料','虾滑','其他'];
  var tagH='<div class="tag-list">';
  for(var i=0;i<tags.length;i++){var act=selectedTag===tags[i]?' active':'';tagH+='<span class="tag-item'+act+'" onclick="selectTag(this,\''+tags[i]+'\')">'+tags[i]+'</span>';}
  tagH+='</div>';
  var imgH='';
  for(var j=0;j<selectedImages.length;j++){imgH+='<div class="image-preview-item"><img src="'+selectedImages[j]+'" onerror="this.style.display=\'none\'"><button class="delete-btn" onclick="removeImage('+j+')">×</button><button class="set-cover-btn" onclick="setCover('+j+')">封面</button></div>';}
  var vidH=selectedVideo?'<div class="video-preview"><div class="video-thumb-placeholder"><div class="video-thumb-icon">🎬</div><div class="video-thumb-name">'+selectedVideo+'</div></div><button class="delete-btn" onclick="removeVideo()">×</button></div>':'';
  var c=document.getElementById('mainContainer');
  c.innerHTML='<div class="modal-overlay show" id="addModal"><div class="modal">'+
    '<div class="modal-header"><h3>'+(isEdit?'✏️ 编辑商品':'➕ 添加商品')+'</h3><button class="modal-close" onclick="closeModal()">×</button></div>'+
    '<div class="modal-body">'+
    '<div class="form-item"><label class="form-label">商品名称 *</label><input class="form-input" id="fName" placeholder="如：精品黑千层" value="'+nameVal+'"></div>'+
    '<div class="form-item"><label class="form-label">价格（元）*</label><input class="form-input" id="fPrice" type="number" placeholder="如：88" value="'+priceVal+'"></div>'+
    '<div class="form-item"><label class="form-label">商品类别</label>'+tagH+'</div>'+
    '<div class="form-item"><label class="form-label">商品描述</label><textarea class="form-input" id="fDesc" placeholder="描述商品特点...">'+descVal+'</textarea></div>'+
    '<div class="form-item"><label class="form-label">商品图片（最多9张，自动压缩）</label>'+imgH+'<div class="upload-area" onclick="document.getElementById(\'imgInput\').click()"><div class="upload-icon">📷</div><div class="upload-text">点击上传图片</div></div><input type="file" id="imgInput" accept="image/*" multiple style="display:none" onchange="handleImageUpload(this)"></div>'+
    '<div class="form-item"><label class="form-label">商品视频（可选，自动提取缩略图）</label>'+vidH+'<div class="upload-area" onclick="document.getElementById(\'vidInput\').click()"><div class="upload-icon">🎬</div><div class="upload-text">点击上传视频</div></div><input type="file" id="vidInput" accept="video/*" style="display:none" onchange="handleVideoUpload(this)"></div>'+
    '<button class="submit-btn" onclick="saveProduct()">'+(isEdit?'💾 保存修改':'✅ 添加商品')+'</button>'+
    '</div></div></div>';
}
function removeImage(idx){selectedImages.splice(idx,1);showAddProductRestore();}
function setCover(idx){if(selectedImages[idx]){var t=selectedImages[idx];selectedImages.splice(idx,1);selectedImages.unshift(t);showAddProductRestore();}}
function removeVideo(){selectedVideo='';showAddProductRestore();}

/* 图片压缩：最大边1200px，JPEG质量0.7 */
function compressImage(file,callback){
  var reader=new FileReader();
  reader.onload=function(e){
    var img=new Image();
    img.onload=function(){
      var MAX=1200;
      var w=img.naturalWidth||img.width;
      var h=img.naturalHeight||img.height;
      if(w<=MAX&&h<=MAX){
        var canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        var ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0);
        canvas.toBlob(function(blob){
          if(!blob){callback(e.target.result);return;}
          var fr=new FileReader();
          fr.onload=function(ev){callback(ev.target.result);};
          fr.readAsDataURL(blob);
        },'image/jpeg',0.7);
      } else {
        var scale=Math.min(MAX/w,MAX/h);
        var nw=Math.round(w*scale);
        var nh=Math.round(h*scale);
        var canvas=document.createElement('canvas');
        canvas.width=nw;canvas.height=nh;
        var ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,nw,nh);
        canvas.toBlob(function(blob){
          if(!blob){callback(e.target.result);return;}
          var fr=new FileReader();
          fr.onload=function(ev){callback(ev.target.result);};
          fr.readAsDataURL(blob);
        },'image/jpeg',0.7);
      }
    };
    img.onerror=function(){callback(e.target.result);};
    img.src=e.target.result;
  };
  reader.onerror=function(){callback(null);};
  reader.readAsDataURL(file);
}

/* 压缩视频第一帧作为预览图（视频本身不存base64） */
function extractVideoThumb(file,callback){
  var reader=new FileReader();
  reader.onload=function(e){
    var video=document.createElement('video');
    video.preload='metadata';
    video.muted=true;
    video.playsInline=true;
    var url=URL.createObjectURL(file);
    video.onloadeddata=function(){
      video.currentTime=Math.min(1,video.duration*0.1);
    };
    video.onseeked=function(){
      var canvas=document.createElement('canvas');
      canvas.width=320;canvas.height=240;
      var ctx=canvas.getContext('2d');
      ctx.drawImage(video,0,0,320,240);
      URL.revokeObjectURL(url);
      canvas.toBlob(function(blob){
        if(!blob){callback(null);return;}
        var fr=new FileReader();
        fr.onload=function(ev){callback(ev.target.result);};
        fr.readAsDataURL(blob);
      },'image/jpeg',0.6);
    };
    video.onerror=function(){
      URL.revokeObjectURL(url);
      callback(null);
    };
    video.src=url;
    video.load();
  };
  reader.onerror=function(){callback(null);};
  reader.readAsDataURL(file);
}

function showAddProductRestore(){
  var nameEl=document.getElementById('fName');
  var priceEl=document.getElementById('fPrice');
  var descEl=document.getElementById('fDesc');
  var nameVal=nameEl?nameEl.value:'';
  var priceVal=priceEl?priceEl.value:'';
  var descVal=descEl?descEl.value:'';
  var isEdit=editProductId!==null;
  var tags=['黑千层','白千层','叶片','整肚','边角料','虾滑','其他'];
  var tagH='<div class="tag-list">';
  for(var i=0;i<tags.length;i++){var act=selectedTag===tags[i]?' active':'';tagH+='<span class="tag-item'+act+'" onclick="selectTag(this,\''+tags[i]+'\')">'+tags[i]+'</span>';}
  tagH+='</div>';
  var imgH='';
  for(var j=0;j<selectedImages.length;j++){imgH+='<div class="image-preview-item"><img src="'+selectedImages[j]+'" onerror="this.style.display=\'none\'"><button class="delete-btn" onclick="removeImage('+j+')">×</button><button class="set-cover-btn" onclick="setCover('+j+')">封面</button></div>';}
  var vidH=selectedVideo?'<div class="video-preview"><div class="video-thumb-placeholder"><div class="video-thumb-icon">🎬</div><div class="video-thumb-name">'+selectedVideo+'</div></div><button class="delete-btn" onclick="removeVideo()">×</button></div>':'';
  var c=document.getElementById('mainContainer');
  c.innerHTML='<div class="modal-overlay show" id="addModal"><div class="modal">'+
    '<div class="modal-header"><h3>'+(isEdit?'✏️ 编辑商品':'➕ 添加商品')+'</h3><button class="modal-close" onclick="closeModal()">×</button></div>'+
    '<div class="modal-body">'+
    '<div class="form-item"><label class="form-label">商品名称 *</label><input class="form-input" id="fName" placeholder="如：精品黑千层" value="'+nameVal+'"></div>'+
    '<div class="form-item"><label class="form-label">价格（元）*</label><input class="form-input" id="fPrice" type="number" placeholder="如：88" value="'+priceVal+'"></div>'+
    '<div class="form-item"><label class="form-label">商品类别</label>'+tagH+'</div>'+
    '<div class="form-item"><label class="form-label">商品描述</label><textarea class="form-input" id="fDesc" placeholder="描述商品特点...">'+descVal+'</textarea></div>'+
    '<div class="form-item"><label class="form-label">商品图片（最多9张，自动压缩）</label>'+imgH+'<div class="upload-area" onclick="document.getElementById(\'imgInput\').click()"><div class="upload-icon">📷</div><div class="upload-text">点击上传图片</div></div><input type="file" id="imgInput" accept="image/*" multiple style="display:none" onchange="handleImageUpload(this)"></div>'+
    '<div class="form-item"><label class="form-label">商品视频（可选，自动提取缩略图）</label>'+vidH+'<div class="upload-area" onclick="document.getElementById(\'vidInput\').click()"><div class="upload-icon">🎬</div><div class="upload-text">点击上传视频</div></div><input type="file" id="vidInput" accept="video/*" style="display:none" onchange="handleVideoUpload(this)"></div>'+
    '<button class="submit-btn" onclick="saveProduct()">'+(isEdit?'💾 保存修改':'✅ 添加商品')+'</button>'+
    '</div></div></div>';
}

function handleImageUpload(input){
  if(!input.files||input.files.length===0)return;
  var nameVal='',priceVal='',descVal='';
  var nameEl=document.getElementById('fName');
  var priceEl=document.getElementById('fPrice');
  var descEl=document.getElementById('fDesc');
  if(nameEl)nameVal=nameEl.value;
  if(priceEl)priceVal=priceEl.value;
  if(descEl)descVal=descEl.value;
  var filesToRead=[];
  for(var i=0;i<input.files.length&&selectedImages.length<9;i++){
    filesToRead.push(input.files[i]);
  }
  if(filesToRead.length===0){
    showToast('图片已达上限（9张）');
    return;
  }
  var loaded=0;
  var newImages=[];
  var done=function(){
    for(var k=0;k<newImages.length;k++)selectedImages.push(newImages[k]);
    var isEdit=editProductId!==null;
    var tags=['黑千层','白千层','叶片','整肚','边角料','虾滑','其他'];
    var tagH='<div class="tag-list">';
    for(var i=0;i<tags.length;i++){var act=selectedTag===tags[i]?' active':'';tagH+='<span class="tag-item'+act+'" onclick="selectTag(this,\''+tags[i]+'\')">'+tags[i]+'</span>';}
    tagH+='</div>';
    var imgH='';
    for(var j=0;j<selectedImages.length;j++){imgH+='<div class="image-preview-item"><img src="'+selectedImages[j]+'" onerror="this.style.display=\'none\'"><button class="delete-btn" onclick="removeImage('+j+')">×</button><button class="set-cover-btn" onclick="setCover('+j+')">封面</button></div>';}
    var vidH=selectedVideo?'<div class="video-preview"><div class="video-thumb-placeholder"><div class="video-thumb-icon">🎬</div><div class="video-thumb-name">'+selectedVideo+'</div></div><button class="delete-btn" onclick="removeVideo()">×</button></div>':'';
    var c=document.getElementById('mainContainer');
    c.innerHTML='<div class="modal-overlay show" id="addModal"><div class="modal">'+
      '<div class="modal-header"><h3>'+(isEdit?'✏️ 编辑商品':'➕ 添加商品')+'</h3><button class="modal-close" onclick="closeModal()">×</button></div>'+
      '<div class="modal-body">'+
      '<div class="form-item"><label class="form-label">商品名称 *</label><input class="form-input" id="fName" placeholder="如：精品黑千层" value="'+nameVal+'"></div>'+
      '<div class="form-item"><label class="form-label">价格（元）*</label><input class="form-input" id="fPrice" type="number" placeholder="如：88" value="'+priceVal+'"></div>'+
      '<div class="form-item"><label class="form-label">商品类别</label>'+tagH+'</div>'+
      '<div class="form-item"><label class="form-label">商品描述</label><textarea class="form-input" id="fDesc" placeholder="描述商品特点...">'+descVal+'</textarea></div>'+
      '<div class="form-item"><label class="form-label">商品图片（最多9张，自动压缩）</label>'+imgH+'<div class="upload-area" onclick="document.getElementById(\'imgInput\').click()"><div class="upload-icon">📷</div><div class="upload-text">点击上传图片</div></div><input type="file" id="imgInput" accept="image/*" multiple style="display:none" onchange="handleImageUpload(this)"></div>'+
      '<div class="form-item"><label class="form-label">商品视频（可选，自动提取缩略图）</label>'+vidH+'<div class="upload-area" onclick="document.getElementById(\'vidInput\').click()"><div class="upload-icon">🎬</div><div class="upload-text">点击上传视频</div></div><input type="file" id="vidInput" accept="video/*" style="display:none" onchange="handleVideoUpload(this)"></div>'+
      '<button class="submit-btn" onclick="saveProduct()">'+(isEdit?'💾 保存修改':'✅ 添加商品')+'</button>'+
      '</div></div></div>';
  };
  for(var j=0;j<filesToRead.length;j++){
    (function(file){
      compressImage(file,function(result){
        if(result)newImages.push(result);
        loaded++;
        if(loaded===filesToRead.length){
          if(newImages.length>0)done();else showToast('图片压缩失败');
        }
      });
    })(filesToRead[j]);
  }
}

function handleVideoUpload(input){
  if(!input.files||!input.files[0])return;
  var nameVal='',priceVal='',descVal='';
  var nameEl=document.getElementById('fName');
  var priceEl=document.getElementById('fPrice');
  var descEl=document.getElementById('fDesc');
  if(nameEl)nameVal=nameEl.value;
  if(priceEl)priceVal=priceEl.value;
  if(descEl)descVal=descEl.value;
  var file=input.files[0];
  var videoName=file.name;
  extractVideoThumb(file,function(thumb){
    if(thumb&&selectedImages.length<9){
      selectedImages.push(thumb);
    }
    selectedVideo=videoName;
    var isEdit=editProductId!==null;
    var tags=['黑千层','白千层','叶片','整肚','边角料','虾滑','其他'];
    var tagH='<div class="tag-list">';
    for(var i=0;i<tags.length;i++){var act=selectedTag===tags[i]?' active':'';tagH+='<span class="tag-item'+act+'" onclick="selectTag(this,\''+tags[i]+'\')">'+tags[i]+'</span>';}
    tagH+='</div>';
    var imgH='';
    for(var j=0;j<selectedImages.length;j++){imgH+='<div class="image-preview-item"><img src="'+selectedImages[j]+'" onerror="this.style.display=\'none\'"><button class="delete-btn" onclick="removeImage('+j+')">×</button><button class="set-cover-btn" onclick="setCover('+j+')">封面</button></div>';}
    var vidH=selectedVideo?'<div class="video-preview"><div class="video-thumb-placeholder"><div class="video-thumb-icon">🎬</div><div class="video-thumb-name">'+selectedVideo+'</div></div><button class="delete-btn" onclick="removeVideo()">×</button></div>':'';
    var c=document.getElementById('mainContainer');
    c.innerHTML='<div class="modal-overlay show" id="addModal"><div class="modal">'+
      '<div class="modal-header"><h3>'+(isEdit?'✏️ 编辑商品':'➕ 添加商品')+'</h3><button class="modal-close" onclick="closeModal()">×</button></div>'+
      '<div class="modal-body">'+
      '<div class="form-item"><label class="form-label">商品名称 *</label><input class="form-input" id="fName" placeholder="如：精品黑千层" value="'+nameVal+'"></div>'+
      '<div class="form-item"><label class="form-label">价格（元）*</label><input class="form-input" id="fPrice" type="number" placeholder="如：88" value="'+priceVal+'"></div>'+
      '<div class="form-item"><label class="form-label">商品类别</label>'+tagH+'</div>'+
      '<div class="form-item"><label class="form-label">商品描述</label><textarea class="form-input" id="fDesc" placeholder="描述商品特点...">'+descVal+'</textarea></div>'+
      '<div class="form-item"><label class="form-label">商品图片（最多9张，自动压缩）</label>'+imgH+'<div class="upload-area" onclick="document.getElementById(\'imgInput\').click()"><div class="upload-icon">📷</div><div class="upload-text">点击上传图片</div></div><input type="file" id="imgInput" accept="image/*" multiple style="display:none" onchange="handleImageUpload(this)"></div>'+
      '<div class="form-item"><label class="form-label">商品视频（可选，自动提取缩略图）</label>'+vidH+'<div class="upload-area" onclick="document.getElementById(\'vidInput\').click()"><div class="upload-icon">🎬</div><div class="upload-text">点击上传视频</div></div><input type="file" id="vidInput" accept="video/*" style="display:none" onchange="handleVideoUpload(this)"></div>'+
      '<button class="submit-btn" onclick="saveProduct()">'+(isEdit?'💾 保存修改':'✅ 添加商品')+'</button>'+
      '</div></div></div>';
  });
}

async function saveProduct(){
  var name=document.getElementById('fName').value.trim();
  var price=document.getElementById('fPrice').value.trim();
  var desc=document.getElementById('fDesc').value.trim();
  if(!name){showToast('请输入商品名称');return;}
  if(!price||isNaN(price)){showToast('请输入正确的价格');return;}
  if(selectedImages.length===0){showToast('请至少上传一张图片');return;}
  var product={name:name,price:parseFloat(price),description:desc,tag:selectedTag,images:selectedImages,video:selectedVideo,coverImage:selectedImages[0]};
  if(editProductId){
    await updateProduct(editProductId,product);
    showToast('修改成功');
  } else {
    await addProduct(product);
    showToast('添加成功');
  }
  setTimeout(function(){
    editProductId=null;
    selectedImages=[];
    selectedVideo='';
    selectedTag='';
    loadPage('admin');
  },1500);
}

function closeModal(){
  var overlay=document.getElementById('addModal');
  if(overlay)overlay.classList.remove('show');
  editProductId=null;selectedImages=[];selectedVideo='';selectedTag='';
}
