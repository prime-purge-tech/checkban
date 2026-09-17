// ── CONSTANTS ─────────────────────────────────────────────────
const DEFAULT_VIDEO = 'https://files.catbox.moe/3n7cf2.mp4';
const CATBOX_PHOTO = 'https://files.catbox.moe/etznit.jpg';
const DEFAULT_PHOTO = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNDAgNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcng9IjciIGZpbGw9IiMxMjEwMmEiLz4KPHBhdGggZD0iTTIwIDEwIEMyNyAxMCAzMiAxNSAzMiAyMiBDMzIgMjcgMjggMzEgMjIgMzEgQzE3IDMxIDE0IDI4IDE0IDIzIEMxNCAxOSAxNyAxNiAyMSAxNiBDMjQgMTYgMjYgMTggMjYgMjEiIHN0cm9rZT0iIzdjNWNiZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIGZpbGw9Im5vbmUiLz4KPC9zdmc+';

// ⚠️ Config technique cachée (non visible dans les paramètres)
const HIDDEN_API_URL   = 'https://inconnu-check-ban-api.onrender.com/check';
const HIDDEN_PROXIES   = 'https://corsproxy.io/?{url_enc}\nhttps://thingproxy.freeboard.io/fetch/{url}\nhttps://api.allorigins.win/raw?url={url_enc}';

const IDB_NAME='GhostBot',IDB_STORE='assets',VID_KEY='bgVid',PIC_KEY='msgPic';
const LS={blur:'gb_blur',bot:'gb_lbot',close:'gb_lclose',next:'gb_lnext',edit:'gb_ledit',yes:'gb_lyes',hist:'gb_hist',borderHex:'gb_bclr',borderOp:'gb_bop',animOn:'gb_anim',panelHex:'gb_pclr',panelOp:'gb_pop',msgBan:'gb_msgban',msgOk:'gb_msgok'};
const DEF={
  bot:'PRIME PURGE',close:'CLOSE',next:'NEXT',edit:'EDIT',yes:'YES',
  msgBan:'Le numéro *{num}* est *BANNI*.\nRaison : {raison}\nBanni le {date}',
  msgOk:'Le numéro *{num}* n\'est *pas banni*.\n{wa}',
  borderHex:'#ffffff',borderOp:'55',panelHex:'#04040c',panelOp:'65'
};

// ── STATE ─────────────────────────────────────────────────────
let blurOn=localStorage.getItem(LS.blur)==='true';
let animOn=localStorage.getItem(LS.animOn)==='true';
let currentPhotoUrl=DEFAULT_PHOTO;
let animRaf=null,animHue=0;
let lastCheckedNum=null;
let flagAnimLock=false;

const g=k=>localStorage.getItem(LS[k])||DEF[k]||'';

// ── IDB ───────────────────────────────────────────────────────
let db;
const openDB=()=>new Promise((res,rej)=>{const r=indexedDB.open(IDB_NAME,1);r.onupgradeneeded=e=>e.target.result.createObjectStore(IDB_STORE);r.onsuccess=e=>{db=e.target.result;res(db);};r.onerror=()=>rej(r.error);});
const idbGet=k=>new Promise((res,rej)=>{const t=db.transaction(IDB_STORE,'readonly'),r=t.objectStore(IDB_STORE).get(k);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
const idbPut=(k,v)=>new Promise((res,rej)=>{const t=db.transaction(IDB_STORE,'readwrite'),r=t.objectStore(IDB_STORE).put(v,k);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});

// ── VIDEO ─────────────────────────────────────────────────────
const bgVid=document.getElementById('bgVideo');
bgVid.style.transform='scale(1.08)';
const applyBlur=()=>bgVid.style.filter=blurOn?'blur(10px)':'none';
const setVideoSrc=src=>{bgVid.classList.remove('ready');bgVid.src=src;applyBlur();bgVid.load();bgVid.play().catch(()=>{});};
bgVid.addEventListener('canplay',()=>bgVid.classList.add('ready'));

// ── COLORS ────────────────────────────────────────────────────
function hexToRgba(hex,op){
  const r=parseInt(hex.slice(1,3),16),gg=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${gg},${b},${op/100})`;
}
function applyBorderColor(){
  if(animOn) return;
  const hex=g('borderHex'),op=parseInt(g('borderOp'));
  document.documentElement.style.setProperty('--border',hexToRgba(hex,op));
}
function applyPanelColor(){
  const hex=g('panelHex'),op=parseInt(g('panelOp'));
  document.documentElement.style.setProperty('--panel',hexToRgba(hex,op));
}
function startAnim(){
  stopAnim();
  function tick(){
    animHue=(animHue+0.6)%360;
    document.documentElement.style.setProperty('--border',`hsl(${animHue},90%,68%)`);
    animRaf=requestAnimationFrame(tick);
  }
  animRaf=requestAnimationFrame(tick);
}
function stopAnim(){
  if(animRaf){cancelAnimationFrame(animRaf);animRaf=null;}
  applyBorderColor();
}

// ── PHOTO ─────────────────────────────────────────────────────
const setPhotoUrl=url=>{currentPhotoUrl=url;document.getElementById('photoPreview').src=url;};

// ── INIT ──────────────────────────────────────────────────────
async function init(){
  await openDB();
  try{const b=await idbGet(VID_KEY);if(b)setVideoSrc(URL.createObjectURL(b));else setVideoSrc(DEFAULT_VIDEO);}catch(e){setVideoSrc(DEFAULT_VIDEO);}
  try{const b=await idbGet(PIC_KEY);if(b){setPhotoUrl(URL.createObjectURL(b));}else{const img=new Image();img.onload=()=>setPhotoUrl(CATBOX_PHOTO);img.onerror=()=>setPhotoUrl(DEFAULT_PHOTO);img.src=CATBOX_PHOTO;}}catch(e){setPhotoUrl(DEFAULT_PHOTO);}
  applyPanelColor();
  if(animOn)startAnim();else applyBorderColor();
}
init();

// ── LABELS ────────────────────────────────────────────────────
function applyLabels(){
  document.getElementById('closeBtn').textContent=g('close');
  document.getElementById('nextBtn') .textContent=g('next');
  document.getElementById('editBtn') .textContent=g('edit');
  document.getElementById('yesBtn')  .textContent=g('yes');
  document.getElementById('botLabel').textContent=g('bot');
}
function loadSettingsInputs(){
  document.getElementById('lBot')   .value=g('bot');
  document.getElementById('lClose') .value=g('close');
  document.getElementById('lNext')  .value=g('next');
  document.getElementById('lEdit')  .value=g('edit');
  document.getElementById('lYes')   .value=g('yes');
  document.getElementById('msgBan') .value=g('msgBan');
  document.getElementById('msgOk')  .value=g('msgOk');
  if(blurOn)document.getElementById('blurTog').classList.add('on');
  if(animOn)document.getElementById('animTog').classList.add('on');
  const bHex=g('borderHex'),bOp=g('borderOp'),pHex=g('panelHex'),pOp=g('panelOp');
  document.getElementById('borderColorPick').value=bHex;
  document.getElementById('borderOpacity') .value=bOp;
  document.getElementById('borderOpVal')   .textContent=bOp+'%';
  document.getElementById('panelColorPick').value=pHex;
  document.getElementById('panelOpacity')  .value=pOp;
  document.getElementById('panelOpVal')    .textContent=pOp+'%';
}
applyLabels();
loadSettingsInputs();

// ── SETTINGS PANEL ────────────────────────────────────────────
const panel=document.getElementById('settingsPanel');
const settingsBtn=document.getElementById('settingsBtn');
settingsBtn.addEventListener('click',e=>{
  e.stopPropagation();
  panel.classList.toggle('open');
  settingsBtn.classList.toggle('active',panel.classList.contains('open'));
});
document.addEventListener('click',e=>{
  if(!panel.contains(e.target)&&e.target!==settingsBtn){
    panel.classList.remove('open');
    settingsBtn.classList.remove('active');
  }
});

document.getElementById('blurTog').addEventListener('click',function(){blurOn=!blurOn;this.classList.toggle('on',blurOn);localStorage.setItem(LS.blur,blurOn);applyBlur();});

// Color controls
document.getElementById('borderColorPick').addEventListener('input',function(){localStorage.setItem(LS.borderHex,this.value);applyBorderColor();});
document.getElementById('borderOpacity').addEventListener('input',function(){localStorage.setItem(LS.borderOp,this.value);document.getElementById('borderOpVal').textContent=this.value+'%';applyBorderColor();});
document.getElementById('panelColorPick').addEventListener('input',function(){localStorage.setItem(LS.panelHex,this.value);applyPanelColor();});
document.getElementById('panelOpacity').addEventListener('input',function(){localStorage.setItem(LS.panelOp,this.value);document.getElementById('panelOpVal').textContent=this.value+'%';applyPanelColor();});

// Font size
const fontSlider=document.getElementById('msgFontSlider');
const savedFont=parseInt(localStorage.getItem('gb_msgfont'))||20;
fontSlider.value=savedFont;
document.getElementById('msgFontVal').textContent=savedFont+'px';
document.documentElement.style.setProperty('--msg-font',savedFont+'px');
fontSlider.addEventListener('input',function(){
  const v=parseInt(this.value);
  localStorage.setItem('gb_msgfont',v);
  document.getElementById('msgFontVal').textContent=v+'px';
  document.documentElement.style.setProperty('--msg-font',v+'px');
});

document.getElementById('animTog').addEventListener('click',function(){
  animOn=!animOn;this.classList.toggle('on',animOn);
  localStorage.setItem(LS.animOn,animOn);
  if(animOn)startAnim();else stopAnim();
});

// Label inputs
const labelMap={lBot:'bot',lClose:'close',lNext:'next',lEdit:'edit',lYes:'yes'};
Object.keys(labelMap).forEach(id=>{document.getElementById(id).addEventListener('input',function(){const k=labelMap[id],v=this.value.trim();if(v)localStorage.setItem(LS[k],v);else localStorage.removeItem(LS[k]);applyLabels();});});

// Message templates
['msgBan','msgOk'].forEach(id=>{
  document.getElementById(id).addEventListener('input',function(){
    const v=this.value;
    if(v.trim())localStorage.setItem(LS[id],v);
    else localStorage.removeItem(LS[id]);
  });
});

// ── VIDEO MODAL ───────────────────────────────────────────────
const vidGI=document.getElementById('vidGalleryInput'),vidCI=document.getElementById('vidCameraInput');
document.getElementById('changeVideoBtn')  .addEventListener('click',()=>document.getElementById('videoModal').classList.add('open'));
document.getElementById('cancelVideoModal').addEventListener('click',()=>document.getElementById('videoModal').classList.remove('open'));
document.getElementById('vidGalleryBtn')   .addEventListener('click',()=>{document.getElementById('videoModal').classList.remove('open');vidGI.click();});
document.getElementById('vidCameraBtn')    .addEventListener('click',()=>{document.getElementById('videoModal').classList.remove('open');vidCI.click();});
async function handleVideo(f){if(!f||!f.type.startsWith('video/'))return;try{await idbPut(VID_KEY,f);setVideoSrc(URL.createObjectURL(f));}catch(e){}}
vidGI.addEventListener('change',()=>handleVideo(vidGI.files[0]));
vidCI.addEventListener('change',()=>handleVideo(vidCI.files[0]));

// ── PHOTO MODAL ───────────────────────────────────────────────
const picGI=document.getElementById('picGalleryInput'),picCI=document.getElementById('picCameraInput');
document.getElementById('changePhotoBtn')  .addEventListener('click',()=>document.getElementById('photoModal').classList.add('open'));
document.getElementById('cancelPhotoModal').addEventListener('click',()=>document.getElementById('photoModal').classList.remove('open'));
document.getElementById('picGalleryBtn')   .addEventListener('click',()=>{document.getElementById('photoModal').classList.remove('open');picGI.click();});
document.getElementById('picCameraBtn')    .addEventListener('click',()=>{document.getElementById('photoModal').classList.remove('open');picCI.click();});
async function handlePhoto(f){if(!f||!f.type.startsWith('image/'))return;try{await idbPut(PIC_KEY,f);setPhotoUrl(URL.createObjectURL(f));}catch(e){}}
picGI.addEventListener('change',()=>handlePhoto(picGI.files[0]));
picCI.addEventListener('change',()=>handlePhoto(picCI.files[0]));

// ── USE MODAL ─────────────────────────────────────────────────
document.getElementById('closeUseModal').addEventListener('click',()=>document.getElementById('useModal').classList.remove('open'));

// ── HISTORY ───────────────────────────────────────────────────
function getHist(){try{return JSON.parse(localStorage.getItem(LS.hist))||[];}catch(e){return[];}}
function saveHist(a){localStorage.setItem(LS.hist,JSON.stringify(a));}
function addHist(num,msgText){const h=getHist();h.unshift({num,msgText,ts:Date.now()});saveHist(h);}
function delHist(i){const h=getHist();h.splice(i,1);saveHist(h);renderHist();}
function clearHist(){saveHist([]);renderHist();}
function fmtTs(ts){const d=new Date(ts);return d.toLocaleDateString('fr-FR')+' '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}
function renderHist(){
  const h=getHist(),list=document.getElementById('histList'),empty=document.getElementById('histEmpty');
  if(!h.length){list.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  list.innerHTML=h.map((e,i)=>`
    <div class="hist-entry">
      <div class="hist-info">
        <div class="hist-num">+ ${e.num}</div>
        <div class="hist-msg">${e.msgText.replace(/</g,'&lt;')}</div>
        <div class="hist-time">${fmtTs(e.ts)}</div>
      </div>
      <button class="hist-del" onclick="delHist(${i})">×</button>
    </div>`).join('');
}
function openHist(){renderHist();document.getElementById('histOverlay').classList.add('open');document.getElementById('histPanel').classList.add('open');}
function closeHist(){document.getElementById('histOverlay').classList.remove('open');document.getElementById('histPanel').classList.remove('open');}
document.getElementById('botLabel')   .addEventListener('click',openHist);
document.getElementById('histOverlay').addEventListener('click',closeHist);
document.getElementById('clearAllBtn').addEventListener('click',clearHist);

// ── MESSAGE RENDERING ─────────────────────────────────────────
function renderTemplate(tmpl,colorClass){
  return tmpl.split('\n').filter(l=>l.trim()).map(line=>{
    const rendered=line.replace(/\*(.*?)\*/g,(_,w)=>`<span class="${colorClass}">${w}</span>`);
    return `<span class="c-line">${rendered}</span>`;
  }).join('');
}
function fillVars(tpl,vars){
  let out=tpl;
  for(const [k,v] of Object.entries(vars))out=out.split('{'+k+'}').join(v);
  return out;
}

// ── API CHECK BAN (config cachée) ────────────────────────────
async function checkNumber(number){
  const clean=number.replace(/^\+/,'').replace(/\s+/g,'');
  const res=await fetch(HIDDEN_API_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({number:'+'+clean}),
    signal:AbortSignal.timeout(60000),
  });
  if(!res.ok)throw new Error('API error '+res.status);
  return res.json();
}

// ── CHECK WHATSAPP via proxys CORS (config cachée) ───────────
function getProxies(){
  return HIDDEN_PROXIES.split('\n').map(l=>l.trim()).filter(Boolean).map(tpl=>u=>{
    if(tpl.includes('{url_enc}'))return tpl.replace('{url_enc}',encodeURIComponent(u));
    if(tpl.includes('{url}'))    return tpl.replace('{url}',u);
    return tpl+u;
  });
}

async function checkWhatsApp(number){
  const full=number.replace(/^\+/,'').replace(/\s+/g,'');
  const target='https://wa.me/'+full;
  for(const wrap of getProxies()){
    try{
      const res=await fetch(wrap(target),{signal:AbortSignal.timeout(15000)});
      if(!res.ok)continue;
      const html=await res.text();
      if(/not on WhatsApp|isn't on WhatsApp|n'est pas sur WhatsApp|invalid|phone number/i.test(html))return false;
      if(html.length>500)return true;
    }catch(e){/* proxy KO → suivant */}
  }
  return null;
}

// ── FORMAT DATE/HEURE ─────────────────────────────────────────
function fmtNow(){
  const d=new Date();
  return d.toLocaleDateString('fr-FR')+' à '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}
function extractBanDate(apiData){
  if(!apiData)return null;
  const raw=apiData.banned_at||apiData.bannedAt||apiData.date||apiData.banned_date||apiData.bannedAtFormatted||null;
  if(!raw)return null;
  const d=new Date(raw);
  if(isNaN(d.getTime()))return String(raw);
  return d.toLocaleDateString('fr-FR')+' à '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}

// ── RENDU DU RÉSULTAT ─────────────────────────────────────────
const entryStep=document.getElementById('entryStep'),confirmStep=document.getElementById('confirmStep'),loaderStep=document.getElementById('loaderStep');
const cMsg=document.getElementById('cMsg'),numInput=document.getElementById('numInput');
let lastMsgText='';

function showResult(num,banned,reason,waStatus,banDate){
  const waHtml=waStatus===true ?'<span class="hl-g">online</span>'
             :waStatus===false?'<span class="hl-r">hors ligne</span>'
             :                  '<span class="hl-w">statut WhatsApp inconnu</span>';
  const waPlain=waStatus===true?'online':waStatus===false?'hors ligne':'statut WhatsApp inconnu';

  // Petite photo carrée : uniquement pour les BANNIS
  const picHtml=banned?`<img class="msg-pic" src="${currentPhotoUrl}" alt="">`:'';

  let raw,filled,plainVars;
  if(banned){
    const dateStr=banDate||fmtNow();
    raw=g('msgBan');
    plainVars={num:'+'+num,raison:reason||'—',date:dateStr,wa:waPlain};
    filled=fillVars(raw,{num:'+'+num,raison:reason||'Aucune raison fournie',date:dateStr,wa:waHtml});
  }else{
    raw=g('msgOk');
    plainVars={num:'+'+num,wa:waPlain};
    filled=fillVars(raw,{num:'+'+num,wa:waHtml});
  }

  cMsg.innerHTML=renderTemplate(filled,banned?'hl-r':'hl-g');
  if(banned){
    const firstLine=cMsg.querySelector('.c-line');
    if(firstLine)firstLine.insertAdjacentHTML('beforeend',picHtml);
  }

  lastMsgText=fillVars(raw,plainVars)
    .replace(/\*(.*?)\*/g,'$1').replace(/\n/g,' | ');
}

// ── FLOW ──────────────────────────────────────────────────────
function resetAll(){numInput.value='';entryStep.classList.remove('compact');confirmStep.classList.remove('show');loaderStep.classList.remove('show');}

document.getElementById('nextBtn').addEventListener('click',async()=>{
  const num=numInput.value.trim();
  if(!num){numInput.focus();return;}

  if(!/^[0-9\s]{6,20}$/.test(num)){
    alert('Numéro invalide. Ex : 243 904 686 774');
    return;
  }

  entryStep.classList.add('compact');
  loaderStep.classList.add('show');

  const [result,waStatus]=await Promise.all([
    checkNumber(num).catch(()=>null),
    checkWhatsApp(num),
  ]);

  loaderStep.classList.remove('show');
  lastCheckedNum=num.replace(/^\+/,'').replace(/\s+/g,'');

  if(result){
    showResult(num,result.banned,result.reason,waStatus,extractBanDate(result));
  }else{
    cMsg.innerHTML=renderTemplate("Erreur de connexion à l'API.\nRéessaie plus tard.",'hl-r');
    lastMsgText='Erreur API | '+num;
  }

  addHist(num,lastMsgText);
  confirmStep.classList.add('show');
});

document.getElementById('closeBtn').addEventListener('click',resetAll);
document.getElementById('editBtn') .addEventListener('click',()=>{confirmStep.classList.remove('show');entryStep.classList.remove('compact');numInput.focus();});
// YES → ouvre WhatsApp (application) vers le numéro vérifié
document.getElementById('yesBtn')  .addEventListener('click',()=>{
  confirmStep.classList.remove('show');loaderStep.classList.add('show');
  const waTarget=lastCheckedNum?('https://wa.me/'+lastCheckedNum):'https://wa.me/';
  setTimeout(()=>{window.open(waTarget,'_blank');resetAll();},2200);
});

document.addEventListener('touchstart',()=>bgVid.play().catch(()=>{}),{once:true});

// ── FLAG ──────────────────────────────────────────────────────
// Zoom photo au clic sur le drapeau (listener JS fiable + anti-spam)
const flagLogo=document.getElementById('flagLogo');
flagLogo.addEventListener('click',()=>{
  if(flagAnimLock)return;
  flagAnimLock=true;
  // S'assure que le zoom affiche bien la photo actuelle
  const zoomImg=document.getElementById('zoomImg');
  if(currentPhotoUrl)zoomImg.src=currentPhotoUrl;
  const z=document.getElementById('flagZoom');
  z.style.transform='translate(-50%,-50%) scale(35)';
  z.style.opacity='1';
  setTimeout(()=>{
    z.style.transform='translate(-50%,-50%) scale(0)';
    z.style.opacity='0';
    setTimeout(()=>{flagAnimLock=false;},300);
  },420);
});

// ── FLAGS ─────────────────────────────────────────────────────
const FLAGS = {
  'Gabon':          {c:['#009e60','#fcd116','#3a75c4'],d:'h',s:''},
  'Cameroun':       {c:['#007a5e','#ce1126','#fcd116'],d:'v',s:'★'},
  'Congo RDC':      {c:['#007fff','#fcd116','#ce1126'],d:'h',s:'★'},
  'Congo':          {c:['#009a44','#fbde4a','#dc241f'],d:'h',s:''},
  'Tchad':          {c:['#002664','#fecb00','#cc0001'],d:'v',s:''},
  'RCA':            {c:['#003082','#ffffff','#289728'],d:'h',s:'★'},
  'Guinée Éq.':     {c:['#3e9a00','#ffffff','#e32118'],d:'h',s:'★'},
  'São Tomé':       {c:['#12ad2b','#ffce00','#12ad2b'],d:'h',s:'★'},
  'Angola':         {c:['#cc0000','#000000',''],d:'h',s:'✩'},
  'Burundi':        {c:['#ce1126','#ffffff','#1eb53a'],d:'h',s:'★'},
  'Rwanda':         {c:['#20603d','#fad201','#77d8e0'],d:'h',s:'☀'},
  'Sénégal':        {c:['#00853f','#fdef42','#e31b23'],d:'v',s:'★'},
  'Mali':           {c:['#14b53a','#fcd116','#ce1126'],d:'v',s:''},
  'Guinée':         {c:['#ce1126','#fcd116','#009460'],d:'v',s:''},
  'CIvoire':        {c:['#f77f00','#ffffff','#009a44'],d:'v',s:''},
  'Nigeria':        {c:['#008751','#ffffff','#008751'],d:'v',s:''},
  'Ghana':          {c:['#ce1126','#fcd116','#006b3f'],d:'h',s:'★'},
  'Bénin':          {c:['#008751','#fcd116','#e8112d'],d:'v',s:''},
  'Togo':           {c:['#006a4e','#fcd116','#d21034'],d:'h',s:'★'},
  'Niger':          {c:['#e05206','#ffffff','#0db02b'],d:'h',s:'●'},
  'Burkina Faso':   {c:['#ef2b2d','#ef2b2d','#009a00'],d:'h',s:'★'},
  'Sierra Leone':   {c:['#1eb53a','#ffffff','#0000cd'],d:'h',s:''},
  'Liberia':        {c:['#bf0a30','#ffffff','#002868'],d:'h',s:'★'},
  'Guinée-Bissau':  {c:['#ce1126','#000000','#009e49'],d:'v',s:'★'},
  'Gambie':         {c:['#3a7728','#ffffff','#3e4095'],d:'h',s:''},
  'Cap-Vert':       {c:['#003893','#ffffff','#cf2027'],d:'h',s:'★'},
  'Mauritanie':     {c:['#006233','#ffd700','#006233'],d:'h',s:'☽'},
  'Éthiopie':       {c:['#078930','#fcdd09','#da121a'],d:'h',s:'★'},
  'Kenya':          {c:['#006600','#bb0000','#000000'],d:'h',s:'✦'},
  'Tanzanie':       {c:['#1eb53a','#fcd116','#00a3dd'],d:'h',s:''},
  'Ouganda':        {c:['#000000','#fcdc04','#de3108'],d:'h',s:''},
  'Mozambique':     {c:['#009a44','#000000','#d21034'],d:'h',s:'★'},
  'Madagascar':     {c:['#ffffff','#fc3d32','#007e3a'],d:'v',s:''},
  'Malawi':         {c:['#000000','#ce1126','#339e35'],d:'h',s:'☀'},
  'Zambie':         {c:['#198a00','#de2010','#000000'],d:'h',s:'✦'},
  'Zimbabwe':       {c:['#006400','#ffd200','#d40000'],d:'h',s:'★'},
  'Somalie':        {c:['#4189dd','#4189dd',''],d:'h',s:'★'},
  'Djibouti':       {c:['#6ab2e7','#12ad2b','#ffffff'],d:'h',s:'★'},
  'Érythrée':       {c:['#12ad2b','#4189dd','#d21034'],d:'h',s:''},
  'Comores':        {c:['#3a75c4','#ffffff','#3a75c4'],d:'h',s:'☽'},
  'Maurice':        {c:['#ea2839','#1a206d','#00a551'],d:'h',s:''},
  'Seychelles':     {c:['#003f87','#fcd856','#d62828'],d:'h',s:''},
  'Égypte':         {c:['#ce1126','#ffffff','#000000'],d:'h',s:'✦'},
  'Libye':          {c:['#000000','#ffffff','#239e46'],d:'h',s:'☽'},
  'Tunisie':        {c:['#e70013','#ffffff','#e70013'],d:'h',s:'☽'},
  'Algérie':        {c:['#006233','#ffffff','#006233'],d:'v',s:'☽'},
  'Maroc':          {c:['#c1272d','#c1272d',''],d:'h',s:'★'},
  'Soudan':         {c:['#d21034','#ffffff','#000000'],d:'h',s:'★'},
  'Soudan du Sud':  {c:['#078930','#ffffff','#000000'],d:'h',s:'★'},
  'Afrique du Sud': {c:['#007a4d','#ffb612','#de3831'],d:'h',s:''},
  'Namibie':        {c:['#003580','#ffffff','#009543'],d:'h',s:'☀'},
  'Botswana':       {c:['#75aadb','#ffffff','#000000'],d:'h',s:''},
  'Lesotho':        {c:['#009543','#ffffff','#0099cc'],d:'h',s:'✦'},
  'Eswatini':       {c:['#3e5eb9','#ffd900','#b10c0c'],d:'h',s:'✦'},
  'Haïti':          {c:['#00209f','#d21034',''],d:'h',s:'🌴'},
};

function applyFlag(country){
  const f=FLAGS[country]||FLAGS['Gabon'];
  const s1=document.getElementById('fs1'),s2=document.getElementById('fs2'),s3=document.getElementById('fs3');
  const sym=document.getElementById('fsym');
  flagLogo.style.flexDirection=f.d==='v'?'row':'column';
  s1.style.background=f.c[0]||'transparent';
  s2.style.background=f.c[1]||'transparent';
  if(f.c[2]){s3.style.display='block';s3.style.flex='1';s3.style.background=f.c[2];}
  else{s3.style.display='none';s1.style.flex='1';s2.style.flex='1';}
  sym.textContent=f.s||'';
  sym.style.color='rgba(255,255,255,0.95)';
}

let currentCountry=localStorage.getItem('gb_country')||'Gabon';
applyFlag(currentCountry);
const cSel=document.getElementById('countrySelect');
cSel.value=currentCountry;
cSel.addEventListener('change',function(){
  currentCountry=this.value;
  localStorage.setItem('gb_country',this.value);
  applyFlag(this.value);
});

// ── CLIPBOARD ─────────────────────────────────────────────────
document.getElementById('openClipBtn').addEventListener('click',()=>{
  panel.classList.remove('open');
  settingsBtn.classList.remove('active');
  openClipboard();
});

const CLIP_KEY='gb_clips';
function getClips(){try{return JSON.parse(localStorage.getItem(CLIP_KEY))||[];}catch(e){return[];}}
function saveClips(a){localStorage.setItem(CLIP_KEY,JSON.stringify(a));}
function addClip(text){const c=getClips();c.unshift({text,ts:Date.now()});saveClips(c);}
function delClip(i){const c=getClips();c.splice(i,1);saveClips(c);renderClips();}
function clearClips(){saveClips([]);renderClips();}

function fmtClipTs(ts){const d=new Date(ts);return d.toLocaleDateString('fr-FR')+' '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}

function renderClips(){
  const c=getClips(),list=document.getElementById('clipList'),empty=document.getElementById('clipEmpty');
  if(!c.length){list.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  list.innerHTML=c.map((e,i)=>`
    <div class="clip-entry">
      <div style="flex:1;min-width:0;">
        <div class="clip-text">${e.text.replace(/</g,'&lt;')}</div>
        <div class="clip-time">${fmtClipTs(e.ts)}</div>
      </div>
      <div class="clip-actions">
        <button class="clip-copy" onclick="copyClip(this,${i})">📋</button>
        <button class="clip-del" onclick="delClip(${i})">×</button>
      </div>
    </div>`).join('');
}
function copyClip(btn,i){
  const c=getClips();
  if(!c[i])return;
  navigator.clipboard.writeText(c[i].text).then(()=>{
    btn.textContent='✓';btn.classList.add('copied');
    setTimeout(()=>{btn.textContent='📋';btn.classList.remove('copied');},1500);
  }).catch(()=>{
    const ta=document.createElement('textarea');ta.value=c[i].text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
    btn.textContent='✓';btn.classList.add('copied');setTimeout(()=>{btn.textContent='📋';btn.classList.remove('copied');},1500);
  });
}

function openClipboard(){renderClips();document.getElementById('clipOverlay').classList.add('open');document.getElementById('clipPanel').classList.add('open');}
function closeClipboard(){document.getElementById('clipOverlay').classList.remove('open');document.getElementById('clipPanel').classList.remove('open');}

document.getElementById('clipOverlay').addEventListener('click',closeClipboard);
document.getElementById('clipClearAll').addEventListener('click',clearClips);
document.getElementById('clipSaveBtn').addEventListener('click',()=>{
  const ta=document.getElementById('clipTextarea');
  const text=ta.value.trim();
  if(!text)return;
  addClip(text);
  ta.value='';
  renderClips();
});