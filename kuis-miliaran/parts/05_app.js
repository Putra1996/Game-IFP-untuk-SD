'use strict';
/* ================= STATE ================= */
const CFG_DFLT={category:'campuran',time:30,input:'auto',p1:''};
const cfg=Object.assign({},CFG_DFLT,LS.get('wb_cfg',{}));
const S={phase:'idle',level:1,won:0,q:null,correct:0,locked:-1,gone:[],ll:{f:true,a:true,t:true,g:false},timeLeft:0,timerInt:null,lastTick:-1,pauseLeft:0,lastQText:''};
const dwell={};
const CAM={on:false,loading:false,hands:null,stream:null,pointers:[]};
const DWELL_MS=1100,SUSPEND_MS=1600;

/* ================= LAYAR & UTIL UI ================= */
function show(id){
  $$('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById(id);
  if(el)el.classList.add('active');
}
let toastT;
function toast(m){
  const t=$('#toast'); if(!t)return;
  t.textContent=m; t.classList.add('show');
  clearTimeout(toastT);
  toastT=setTimeout(()=>t.classList.remove('show'),2800);
}
function showModal(html,btns){
  const root=$('#modal-root');
  root.innerHTML='<div class="modal">'+html+'<div class="mrow"></div></div>';
  const row=root.querySelector('.mrow');
  (btns||[]).forEach(b=>{
    const bt=document.createElement('button');
    bt.className='btn '+(b.cls||'b-blue');
    bt.textContent=b.t;
    bt.onclick=()=>{Snd.click(); if(b.f)b.f(); else closeModal();};
    row.appendChild(bt);
  });
  root.classList.add('open');
}
function closeModal(){ $('#modal-root').classList.remove('open'); }
let flashT;
function flashCard(msg,ms){
  const f=$('#flash'); if(!f)return;
  f.textContent=msg;
  f.classList.remove('hidden');
  clearTimeout(flashT);
  flashT=setTimeout(()=>f.classList.add('hidden'),ms||1700);
}

/* ================= SETUP ================= */
function seg(el,options,get,set){
  if(!el)return;
  el.innerHTML='';
  options.forEach(o=>{
    const b=document.createElement('button');
    b.type='button';
    b.textContent=o.label;
    if(o.value===get())b.classList.add('on');
    b.onclick=()=>{Snd.click();set(o.value);seg(el,options,get,set);};
    el.appendChild(b);
  });
}
function renderSegs(){
  seg($('#seg-cat'),[
    {value:'campuran',label:'🎲 Campuran'},
    {value:'matematika',label:'🧮 Matematika'},
    {value:'umum',label:'🌍 Pengetahuan Umum'},
    {value:'guru',label:'✏️ Soal Guru'}
  ],()=>cfg.category,v=>cfg.category=v);
  seg($('#seg-time'),[{value:15,label:'15 detik'},{value:30,label:'30 detik'},{value:45,label:'45 detik'},{value:60,label:'60 detik'}],()=>cfg.time,v=>cfg.time=v);
  seg($('#seg-input'),[{value:'auto',label:'🤖 Kamera AI'},{value:'touch',label:'👆 Sentuh / Mouse'}],()=>cfg.input,v=>cfg.input=v);
}
function openSetup(){
  $('#in-p1').value=cfg.p1||$('#in-p1').value||''; /* jangan timpa nama yang sedang diketik */
  renderSegs();
  show('scr-setup');
  Snd.click();
}

/* ================= TANGGA HADIAH ================= */
function renderLadder(){
  const el=$('#ladder');
  if(!el)return;
  let html='';
  for(let lv=15;lv>=1;lv--){
    const isCur=(lv===S.level&&S.phase!=='over');
    const isPass=(lv<=S.won);
    const isSafe=SAFE_LEVELS.indexOf(lv)>=0||lv===15;
    html+='<div class="lrow'+(isSafe?' safe':'')+(isPass?' pass':'')+(isCur?' cur':'')+'">'+
      '<span class="lnum">'+(isPass?'':'Lv '+lv)+'</span>'+
      '<span class="lval">'+(lv===15?'🏆 ':'')+rp(LADDER[lv-1])+'</span></div>';
  }
  el.innerHTML=html;
}
function updTop(){
  $('#who').textContent=cfg.p1||'Siswa';
  const cur=S.won>0?LADDER[S.won-1]:0;
  $('#prizechip').textContent=rp(cur);
  $('#lvchip').textContent='Lv '+Math.min(S.level,15)+'/15';
}

/* ================= ALUR GAME ================= */
function startGame(){
  if(cfg.category==='guru'&&!GURU_KUIS.length){
    toast('✏️ Soal guru masih kosong! Klik tombol "Soal Guru" di menu untuk menambah.');
    return;
  }
  cfg.p1=($('#in-p1').value||'').trim()||'Siswa';
  LS.set('wb_cfg',cfg);
  closeModal(); stopTimer();
  usedMap.clear();
  for(const k in dwell)delete dwell[k];
  S.phase='count'; /* penting: reset fase agar restart dari hasil/jeda berfungsi */
  S.level=1;S.won=0;S.locked=-1;S.gone=[];S.lastQText='';
  S.ll={f:true,a:true,t:true,g:true};
  updTop();renderLadder();updLifelines();
  $('#qcard').textContent='Siap-siap…';
  if(cfg.input==='auto')enableCamera();
  else stopCamera();
  show('scr-game');
  const cd=$('#countdown');
  cd.classList.remove('hidden');
  const seq=['3','2','1','MULAI!'];
  let i=0;
  (function step(){
    if(i>=seq.length){cd.classList.add('hidden');askQuestion();return;}
    cd.innerHTML='<span>'+seq[i]+'</span>';
    if(seq[i]==='MULAI!')Snd.go();else Snd.tone(440+i*140,.12,'square',.14);
    i++;setTimeout(step,800);
  })();
}

function askQuestion(){
  if(S.phase==='over')return;
  S.level=Math.min(S.level,15);
  let q=pickQuestion(S.level,cfg.category);
  if(q.text===S.lastQText)q=pickQuestion(S.level,cfg.category);
  S.lastQText=q.text;
  S.q=q;S.correct=q.correct;S.locked=-1;S.gone=[];
  $('#qcard').textContent=q.text;
  $$('#opts .opt').forEach(el=>{
    const i=+el.dataset.i;
    el.classList.remove('gone','locked','reveal-ok','reveal-bad','dim');
    el.querySelector('.otext').textContent=q.opts[i];
    const bar=el.querySelector('.pbar i');
    if(bar)bar.style.width='0%';
  });
  updTop();renderLadder();
  S.phase='ask';
  startTimer(cfg.time);
}

/* ---- Timer ---- */
function stopTimer(){ if(S.timerInt){clearInterval(S.timerInt);S.timerInt=null;} }
function startTimer(from){
  stopTimer();
  S.timeLeft=(from==null)?cfg.time:from;
  S.lastTick=Math.ceil(S.timeLeft);
  updTimer();
  S.timerInt=setInterval(()=>{
    S.timeLeft-=.1;
    if(S.timeLeft<=0){S.timeLeft=0;updTimer();stopTimer();onTimeout();return;}
    updTimer();
    const s=Math.ceil(S.timeLeft);
    if(s!==S.lastTick){
      S.lastTick=s;
      if(s<=5){Snd.tick();Snd.thump();}
    }
  },100);
}
function updTimer(){
  const c=226.2;
  const f=clamp(S.timeLeft/Math.max(1,cfg.time),0,1);
  const fg=document.getElementById('tr-fg');
  if(fg){fg.style.strokeDashoffset=(c*(1-f)).toFixed(1);fg.style.stroke=S.timeLeft<=5?'#f4697a':'#ffd043';}
  const tn=document.getElementById('timenum');
  if(tn)tn.textContent=Math.ceil(S.timeLeft);
}
function onTimeout(){
  if(S.phase!=='ask')return;
  lose('⏰ Waktu habis!');
}

/* ---- Memilih jawaban (dengan drama kunci) ---- */
function choose(i){
  if(S.phase!=='ask')return;
  if(S.gone.indexOf(i)>=0)return;
  S.locked=i;
  stopTimer();
  S.phase='suspense';
  Snd.lock();
  $$('#opts .opt').forEach(el=>{
    if(+el.dataset.i===i)el.classList.add('locked');
    else el.classList.add('dim');
  });
  setTimeout(()=>{
    if(S.phase!=='suspense')return;
    revealAnswer();
  },SUSPEND_MS);
}
function revealAnswer(){
  const ok=(S.locked===S.correct);
  const els=$$('#opts .opt');
  els.forEach(el=>{
    el.classList.remove('locked','dim');
    const i=+el.dataset.i;
    if(i===S.correct)el.classList.add('reveal-ok');
    else if(i===S.locked&&!ok)el.classList.add('reveal-bad');
  });
  S.phase='reveal';
  if(ok){
    S.won++;
    const prize=LADDER[S.won-1];
    S.level++;
    updTop();renderLadder();
    if(S.won===5||S.won===10)Snd.milestone();else Snd.correct();
    const r=$('#prizechip').getBoundingClientRect();
    FX.burst(r.left+r.width/2,r.top+r.height/2,60);
    flashCard((S.won===15?'🎉 BENAR SEMUA!':'✅ BENAR!  '+rp(prize)),1800);
    setTimeout(()=>{
      if(S.level>15)win();
      else askQuestion();
    },1900);
  }else{
    Snd.wrong();
    lose('❌ Jawaban salah!');
  }
}
function lose(reason){
  if(S.phase==='over')return;
  S.phase='over';
  stopTimer();
  stopCamera();
  finishResult(reason,false,false);
}
function win(){
  S.phase='over';
  stopCamera();
  FX.startRain(8000);
  Snd.jackpot();
  finishResult('🎉 JACKPOT!',true,true);
}
function walkAway(){
  if(S.phase!=='ask')return;
  showModal('<h3>🎁 Berhenti &amp; Bawa Hadiah?</h3><p>Hadiah yang kamu bawa pulang: <b style="color:#ffd043">'+(S.won>0?rp(LADDER[S.won-1]):'Rp 0')+'</b></p>',[
    {t:'✅ Ya, Berhenti',cls:'b-green',f:()=>{
      closeModal();
      S.phase='over';
      stopTimer();stopCamera();
      Snd.milestone();
      FX.startRain(4000);
      finishResult('🎁 Keputusan tepat!',false,true);
    }},
    {t:'❌ Lanjut Main',cls:'b-ghost',f:closeModal}
  ]);
}
function finishResult(reason,isWin,isGood){
  show('scr-result');
  /* Jackpot / berhenti sendiri = hadiah tercapai; kalah = jatuh ke batas aman terakhir */
  const prize=isWin?LADDER[14]:(isGood?(S.won>0?LADDER[S.won-1]:0):safePrize(S.won));
  $('#res-title').textContent=reason;
  $('#res-big').textContent=rp(prize);
  $('#res-sub').textContent=cfg.p1+' • Benar '+S.won+'/15 • Mencapai Lv '+Math.min(S.won+ (isWin?0:1),15);
  const board=addBoard(cfg.p1,prize,S.won);
  $('#board').innerHTML='<div style="text-align:center;font-weight:700;color:#ffd043;margin-bottom:.6vmin">🏆 PAPAN JUARA</div>'+
    board.map((b,i)=>'<div class="brow'+(i===0?' top1':'')+'"><span class="bpos">'+(i+1)+'</span><span class="bname">'+esc(b.n)+'</span><span class="bprize">'+rp(b.p)+'</span></div>').join('');
  if(isGood)Snd.fanfare();
  renderLadder();
}

/* ================= BANTUAN (LIFELINES) ================= */
function updLifelines(){
  $('#ll-5050').classList.toggle('used',!S.ll.f);
  $('#ll-aud').classList.toggle('used',!S.ll.a);
  $('#ll-tlp').classList.toggle('used',!S.ll.t);
  $('#ll-ganti').classList.toggle('used',!S.ll.g);
}
function visibleIdx(){
  const out=[];
  for(let i=0;i<4;i++)if(S.gone.indexOf(i)<0)out.push(i);
  return out;
}
function use5050(){
  if(S.phase!=='ask'||!S.ll.f)return;
  S.ll.f=false;updLifelines();
  const wrongs=[];
  for(let i=0;i<4;i++)if(i!==S.correct)wrongs.push(i);
  const drop=shuffle(wrongs).slice(0,2);
  S.gone=drop;
  drop.forEach(i=>{ $$('#opts .opt')[i].classList.add('gone'); });
  Snd.tone(880,.2,'triangle',.14);
  toast('✂️ 50:50 — dua jawaban salah dihapus!');
}
function useAudiens(){
  if(S.phase!=='ask'||!S.ll.a)return;
  S.ll.a=false;updLifelines();
  const vis=visibleIdx();
  const d=diffOf(S.level);
  const base=d===1?ri(65,88):(d===2?ri(50,74):ri(38,60));
  const rest=100-base;
  const others=vis.filter(i=>i!==S.correct);
  const parts=[];
  let sum=0;
  for(let i=0;i<others.length;i++){
    const v=(i===others.length-1)?(rest-sum):ri(0,Math.max(0,rest-sum));
    parts.push(v);sum+=v;
  }
  const pct={};
  vis.forEach(i=>{ pct[i]= i===S.correct?base:parts[others.indexOf(i)]||0; });
  const rows=vis.map(i=>'<div class="abar"><span class="alab">'+String.fromCharCode(65+i)+'</span><span class="atrk"><i style="width:0%" data-w="'+pct[i]+'"></i></span><span class="apct">'+pct[i]+'%</span></div>').join('');
  showModal('<h3>👥 Hasil Voting Audiens</h3><div class="audiens-bars">'+rows+'</div>',
    [{t:'Oke, kembali ke soal',cls:'b-gold',f:()=>{
      closeModal();
      $$('#modal-root .atrk i').forEach(()=>{});
    }}]);
  Snd.tone(660,.18,'triangle',.13);
  requestAnimationFrame(()=>{ $$('#modal-root .atrk i').forEach(el=>{el.style.width=el.dataset.w+'%';}); });
}
function useTelepon(){
  if(S.phase!=='ask'||!S.ll.t)return;
  S.ll.t=false;updLifelines();
  const d=diffOf(S.level);
  const pRight=d===1?.9:(d===2?.78:.6);
  const right=Math.random()<pRight;
  const vis=visibleIdx();
  let say;
  if(right)say=S.correct;
  else{
    const others=vis.filter(i=>i!==S.correct);
    say=others.length?pick(others):S.correct;
  }
  const L=String.fromCharCode(65+say);
  const teman=pick(['Bu Guru','Kak Kelas 6','Bestie','Om Buku','Nenek Google']);
  const ragu=(Math.random()<.4)?' Hmm… aku cukup yakin deh.':' Saya yakin banget!';
  showModal('<h3>📞 '+teman+' berkata:</h3><p style="font-size:clamp(16px,3vmin,30px)">“Menurutku jawabannya <b style="color:#ffd043">'+L+'</b>.”'+ragu+'</p>',
    [{t:'Terima kasih!',cls:'b-gold'}]);
  Snd.tone(520,.25,'sine',.13);Snd.tone(760,.2,'sine',.1,.2);
}
function useGanti(){
  if(S.phase!=='ask'||!S.ll.g)return;
  S.ll.g=false;updLifelines();
  Snd.tone(700,.15,'triangle',.13);
  toast('🔄 Soal diganti!');
  askQuestion();
}

/* ================= INPUT SENTUH ================= */
function bindOpts(){
  $('#opts').addEventListener('pointerdown',e=>{
    const el=e.target.closest('.opt');
    if(!el)return;
    e.preventDefault();
    choose(+el.dataset.i);
  });
}

/* ================= DWELL KAMERA ================= */
function targets(){
  return $$('#opts .opt').map((el,i)=>({el:el,i:i,gone:el.classList.contains('gone')}));
}
function hitOpt(x,y){
  /* Deteksi: titik harus di dalam kotak pil (+margin kecil) — mencegah salah kunci
     ke pil di baris lain saat menunjuk dekat pil terhapus/antar-baris */
  let best=null,bd=1e9;
  targets().forEach(t=>{
    if(t.gone)return;
    const r=t.el.getBoundingClientRect();
    if(x<r.left-18||x>r.right+18||y<r.top-18||y>r.bottom+18)return;
    const cx=r.left+r.width/2,cy=r.top+r.height/2;
    const d=(x-cx)*(x-cx)+(y-cy)*(y-cy);
    if(d<bd){bd=d;best=t;}
  });
  return best;
}
function setBar(el,p){
  const bar=el.querySelector('.pbar i');
  if(bar)bar.style.width=Math.round(clamp(p,0,1)*100)+'%';
}
function mainLoop(ts){
  requestAnimationFrame(mainLoop);
  FX.step();
  const g=document.getElementById('scr-game');
  if(!g||!g.classList.contains('active')||S.phase!=='ask')return;
  const now=performance.now();
  for(let i=0;i<CAM.pointers.length;i++){
    const p=CAM.pointers[i];
    if(now-p.seen>400)continue;
    const t=hitOpt(p.x,p.y);
    let D=dwell.p;
    if(!D){D={el:null,t0:0};dwell.p=D;}
    if(t&&p.pointing){
      if(D.el!==t.el){D.el=t.el;D.t0=now;}
      const prog=(now-D.t0)/DWELL_MS;
      setBar(t.el,clamp(prog,0,1));
      if(prog>=1){ setBar(t.el,0);D.el=null;choose(t.i); if(S.phase!=='ask')break; }
    }else{
      if(D.el){setBar(D.el,0);D.el=null;}
    }
  }
}

/* ================= KAMERA AI (sama dgn Gesture Battle) ================= */
function camTag(t){
  const el=$('#camtag');
  if(!el)return;
  el.textContent=t;
  el.classList.remove('hidden');
}
function camTagHide(){ const el=$('#camtag'); if(el)el.classList.add('hidden'); }
function sizeCamCanvas(){
  const cv=$('#camov');
  if(!cv)return;
  cv.width=innerWidth;cv.height=innerHeight;
}
function loadScript(src,timeout){
  return new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src=src;
    const to=setTimeout(()=>rej(new Error('timeout')),timeout||12000);
    s.onload=()=>{clearTimeout(to);res();};
    s.onerror=()=>{clearTimeout(to);rej(new Error('gagal memuat'));};
    document.head.appendChild(s);
  });
}
function camFail(msg){
  CAM.loading=false;CAM.on=false;
  camTagHide();
  const g=document.getElementById('scr-game');
  if(g)g.classList.remove('cam');
  updateOverlays();
  if(msg)toast(msg);
}
async function enableCamera(){
  if(CAM.on||CAM.loading)return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    camFail('🤖 Kamera tidak didukung — pakai 👆 Sentuh. (Untuk kamera, buka file di Chrome/Edge)');
    return;
  }
  CAM.loading=true;
  camTag('⏳ Memuat AI…');
  const g=document.getElementById('scr-game');
  if(g)g.classList.add('cam');
  try{
    if(!CAM.hands){
      if(typeof Hands==='undefined'){
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js',15000);
      }
      CAM.hands=new Hands({locateFile:f=>'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/'+f});
      CAM.hands.setOptions({maxNumHands:1,modelComplexity:0,minDetectionConfidence:0.55,minTrackingConfidence:0.5});
      CAM.hands.onResults(onHands);
    }
    CAM.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false});
    const v=$('#cam');
    v.srcObject=CAM.stream;
    await v.play();
    CAM.on=true;CAM.loading=false;
    camTag('🤖 AI aktif');
    sizeCamCanvas();
    toast('🤖 Mode AR aktif! Tunjuk pilihan jawaban dengan telunjuk, tahan sebentar 🎯');
    camLoop();
  }catch(e){
    CAM.loading=false;
    const denied=e&&e.name==='NotAllowedError';
    camFail(denied?'📷 Izin kamera ditolak — pakai 👆 Sentuh.':'🤖 Kamera/AI tidak tersedia (butuh internet di awal) — pakai 👆 Sentuh.');
  }
}
function stopCamera(){
  CAM.on=false;CAM.loading=false;
  if(CAM.stream){try{CAM.stream.getTracks().forEach(t=>t.stop());}catch(e){}}
  CAM.stream=null;
  const v=$('#cam'); if(v)v.srcObject=null;
  camTagHide();
  const g=document.getElementById('scr-game');
  if(g)g.classList.remove('cam');
  CAM.pointers=[];
  updateOverlays();
}
async function camLoop(){
  if(!CAM.on)return;
  if(!CAM.busy&&CAM.hands){
    const v=$('#cam');
    if(v&&v.readyState>=2){
      const now=performance.now();
      if(now-(CAM.lastSend||0)>=50){
        CAM.lastSend=now;
        CAM.busy=true;
        try{await CAM.hands.send({image:v});}catch(e){}
        CAM.busy=false;
      }
    }
  }
  requestAnimationFrame(camLoop);
}
function onHands(res){
  const g=document.getElementById('scr-game');
  if(!g||!g.classList.contains('active')||!g.classList.contains('cam')){
    CAM.pointers=[];
    updateOverlays();
    return;
  }
  const now=performance.now();
  const lms=res.multiHandLandmarks||[];
  const sw=innerWidth,sh=innerHeight;
  const v=$('#cam');
  const vw=(v&&v.videoWidth)||1280,vh=(v&&v.videoHeight)||720;
  const sc=Math.max(sw/vw,sh/vh);
  const ox=(sw-vw*sc)/2,oy=(sh-vh*sc)/2;
  for(let i=0;i<lms.length&&i<1;i++){
    const L=lms[i];
    if(!L||!L[8])continue;
    const P=L[8];
    const rawX=ox+(1-P.x)*vw*sc;
    const rawY=oy+P.y*vh*sc;
    const d=(a,b)=>Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
    const pointing=d(L[0],L[8])>d(L[0],L[6])*1.18&&d(L[0],L[8])>d(L[0],L[12])*1.02;
    let p=CAM.pointers[0];
    if(!p){p={x:rawX,y:rawY,seen:0,pointing:false};CAM.pointers.push(p);}
    p.x+=(rawX-p.x)*.45;
    p.y+=(rawY-p.y)*.45;
    p.pointing=pointing;
    p.seen=now;
  }
  CAM.pointers=CAM.pointers.filter(p=>now-p.seen<350);
  updateOverlays();
}
function updateOverlays(){
  const el=document.getElementById('cur0');
  const p=CAM.pointers[0];
  if(!el)return;
  if(!p||!CAM.on){el.classList.add('idle');}
  else{
    el.classList.remove('idle');
    el.style.transform='translate('+p.x.toFixed(1)+'px,'+p.y.toFixed(1)+'px)';
  }
  const cv=document.getElementById('camov');
  if(!cv)return;
  const cx=cv.getContext('2d');
  if(!cx)return;
  cx.clearRect(0,0,cv.width,cv.height);
  if(p&&CAM.on){
    cx.beginPath();
    cx.arc(p.x,p.y,16,0,Math.PI*2);
    cx.fillStyle='rgba(255,208,67,.25)';
    cx.fill();
    cx.beginPath();
    cx.arc(p.x,p.y,7,0,Math.PI*2);
    cx.fillStyle='rgba(255,208,67,.95)';
    cx.fill();
    cx.lineWidth=3;
    cx.strokeStyle='#fff';
    cx.stroke();
  }
}

/* ================= BANTUAN & SOAL GURU ================= */
function showHelp(){
  showModal(
    '<h3>❓ Cara Main</h3>'+
    '<ol>'+
    '<li>💰 Jawab <b>15 soal beruntun</b> dengan hadiah membesar — juaranya membawa <b>Rp 1 MILIAR</b>!</li>'+
    '<li>🟡 <b>Batas aman</b>: Lv 5 (Rp 10.000) dan Lv 10 (Rp 100.000). Kalau salah, hadiah yang dibawa = batas aman terakhir yang sudah dilewati.</li>'+
    '<li>⏳ Ada batas waktu tiap soal — habis waktu = salah!</li>'+
    '<li>🆘 <b>4 Bantuan</b> (sekali pakai): <b>✂️ 50:50</b> hapus 2 salah • <b>👥 Audiens</b> voting kelas • <b>📞 Telepon</b> saran teman • <b>🔄 Ganti Soal</b>.</li>'+
    '<li>🎁 Bisa <b>Berhenti &amp; bawa hadiah</b> kapan saja sebelum menjawab.</li>'+
    '<li>🤖 <b>Kamera AI</b>: tunjuk pilihan dengan telunjuk, tahan ±1 detik sampai bar kuning penuh. <b>👆 Sentuh</b>: ketuk langsung.</li>'+
    '<li>🔥 Soal makin lama makin sulit: Lv 1–5 mudah, Lv 6–10 sedang, Lv 11–15 sulit.</li>'+
    '</ol>'+
    '<p>💡 Butuh Chrome/Edge + izin kamera; internet saat pertama memuat AI.</p>',
    [{t:'Mengerti! 💰',cls:'b-gold'}]
  );
}
function showBoard(){
  const b=getBoard();
  const rows=b.length?b.map((x,i)=>'<div class="brow'+(i===0?' top1':'')+'"><span class="bpos">'+(i+1)+'</span><span class="bname">'+esc(x.n)+'</span><span class="bprize">'+rp(x.p)+'</span></div>').join(''):'<p style="text-align:center">Belum ada juara — jadilah yang pertama! 🏆</p>';
  showModal('<h3>🏆 Papan Juara</h3><div id="board">'+rows+'</div>',[{t:'Tutup',cls:'b-blue'}]);
}
function showGuru(){
  showModal(
    '<h3>✏️ Soal Guru (Kustom)</h3>'+
    '<p>Satu soal per baris, pisahkan dengan tanda <code>|</code>:<br><code>Pertanyaan | Jawaban Benar | Salah 1 | Salah 2 | Salah 3</code></p>'+
    '<textarea id="ta-k" placeholder="Contoh: Singkatan dari HTML? | HyperText Markup Language | High Text Machine Language | Hyper Tool Multi Language | Home Tool Markup Language"></textarea>'+
    '<p class="hint">Soal guru dipakai pada kategori "✏️ Soal Guru" (dan menjadi cadangan bila bank kosong). Format sama dengan aplikasi Gesture Battle.</p>'+
    '<div class="mrow">'+
    '<button class="btn small b-ghost" id="ta-close">Tutup</button>'+
    '<button class="btn small b-green" id="ta-save">💾 Simpan</button>'+
    '</div>'
  );
  $('#ta-k').value=LS.get('gb_guru_kuis','');
  $('#ta-save').onclick=()=>{
    LS.set('gb_guru_kuis',$('#ta-k').value);
    loadGuruBanks();
    toast('💾 Tersimpan: '+GURU_KUIS.length+' soal.');
    closeModal();
  };
  $('#ta-close').onclick=closeModal;
}

/* ================= TOMBOL & BOOT ================= */
function toggleFS(){
  try{
    if(document.fullscreenElement)document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }catch(e){toast('Layar penuh tidak didukung di sini');}
}
function goMenu(){
  S.phase='idle';
  stopTimer();
  stopCamera();
  closeModal();
  show('scr-home');
}
function bindButtons(){
  $('#btn-play').onclick=()=>{Snd.click();openSetup();};
  $('#btn-board').onclick=()=>{Snd.click();showBoard();};
  $('#btn-help').onclick=()=>{Snd.click();showHelp();};
  $('#btn-guru').onclick=()=>{Snd.click();showGuru();};
  $('#btn-back').onclick=()=>{Snd.click();show('scr-home');};
  $('#btn-start').onclick=()=>{Snd.click();startGame();};
  $('#btn-walk').onclick=()=>{Snd.click();walkAway();};
  $('#btn-fs').onclick=toggleFS;
  $('#btn-snd').onclick=()=>{Snd.on=!Snd.on;$('#btn-snd').textContent=Snd.on?'🔊':'🔇';Snd.click();};
  $('#ll-5050').onclick=use5050;
  $('#ll-aud').onclick=useAudiens;
  $('#ll-tlp').onclick=useTelepon;
  $('#ll-ganti').onclick=useGanti;
  $('#btn-pause').onclick=()=>{
    if(S.phase!=='ask')return;
    S.pauseLeft=S.timeLeft;
    stopTimer();
    S.phase='pause';
    Snd.click();
    showModal('<h3>⏸ Jeda</h3><p>Game dijeda sementara.</p>',[
      {t:'▶️ Lanjut',cls:'b-gold',f:()=>{closeModal();S.phase='ask';startTimer(S.pauseLeft);}},
      {t:'🔁 Ulang',cls:'b-blue',f:()=>{closeModal();startGame();}},
      {t:'🏠 Menu',cls:'b-ghost',f:goMenu}
    ]);
  };
  $('#btn-res-again').onclick=()=>{Snd.click();openSetup();};
  $('#btn-res-menu').onclick=()=>{Snd.click();goMenu();};
  addEventListener('resize',()=>{ sizeCamCanvas(); });
  addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.getElementById('scr-game').classList.contains('active')&&S.phase==='ask')$('#btn-pause').click();
  });
}
function boot(){
  FX.init();
  loadGuruBanks();
  bindButtons();
  bindOpts();
  renderLadder();
  requestAnimationFrame(mainLoop);
  show('scr-home');
}
document.addEventListener('DOMContentLoaded',boot);

/* ekspos untuk pengujian */
window.S=S;window.CFG=cfg;window.CAM=CAM;window.__WB={
  choose:choose,revealAnswer:revealAnswer,use5050:use5050,useAudiens:useAudiens,useTelepon:useTelepon,useGanti:useGanti,
  pickQuestion:pickQuestion,diffOf:diffOf,safePrize:safePrize,LADDER:LADDER,SAFE_LEVELS:SAFE_LEVELS,
  parseKuisTxt:parseKuisTxt,genMath:genMath,makeOpts:makeOpts,addBoard:addBoard,getBoard:getBoard,
  onHands:onHands,hitOpt:hitOpt,Snd:Snd,startGame:startGame,walkAway:walkAway,lose:lose,win:win
};
