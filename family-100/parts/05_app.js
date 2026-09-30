'use strict';
/* ================= STATE ================= */
const CFG_DFLT={t1:'Tim 1',t2:'Tim 2',rounds:3,source:'bawaan',input:'touch'};
const cfg=Object.assign({},CFG_DFLT,LS.get('ff_cfg',{}));
const S={phase:'idle',round:1,playing:0,scores:[0,0],pot:0,strikes:0,q:null,steal:false,undo:[]};
const dwell={};
const CAM={on:false,loading:false,hands:null,stream:null,pointers:[]};
const DWELL_MS=1000;

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
function scoreFloat(elSel,txt){
  const el=$(elSel); if(!el)return;
  const r=el.getBoundingClientRect();
  const d=document.createElement('div');
  d.className='sfloat'; d.textContent='+'+txt;
  d.style.left=(r.left+r.width/2)+'px';
  d.style.top=Math.max(10,r.top-6)+'px';
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),1300);
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
  seg($('#seg-rounds'),[{value:3,label:'3 Ronde'},{value:4,label:'4 Ronde'},{value:5,label:'5 Ronde'}],()=>cfg.rounds,v=>cfg.rounds=v);
  seg($('#seg-src'),[
    {value:'bawaan',label:'📚 Bawaan'},
    {value:'guru',label:'✏️ Soal Guru'},
    {value:'campur',label:'🎲 Campur'}
  ],()=>cfg.source,v=>cfg.source=v);
  seg($('#seg-input'),[{value:'auto',label:'🤖 Kamera AI'},{value:'touch',label:'👆 Sentuh / Mouse'}],()=>cfg.input,v=>cfg.input=v);
}
function openSetup(){
  if(!$('#in-t1').value)$('#in-t1').value=cfg.t1||'';
  if(!$('#in-t2').value)$('#in-t2').value=cfg.t2||'';
  renderSegs();
  show('scr-setup');
  Snd.click();
}

/* ================= RENDER GAME ================= */
function teamName(i){ return i===0?cfg.t1:cfg.t2; }
function updHUD(){
  $('#tn0').textContent=cfg.t1; $('#tn1').textContent=cfg.t2;
  $('#ts0').textContent=S.scores[0]; $('#ts1').textContent=S.scores[1];
  $('#tl0').textContent=S.playing===0?'TIM 1 • GILIRAN':'TIM 1';
  $('#tl1').textContent=S.playing===1?'TIM 2 • GILIRAN':'TIM 2';
  $('#tc0').classList.toggle('turn',S.playing===0&&S.phase!=='over');
  $('#tc1').classList.toggle('turn',S.playing===1&&S.phase!=='over');
  $('#potchip').textContent='POT '+S.pot;
  $('#roundchip').textContent='Ronde '+Math.min(S.round,cfg.rounds)+'/'+cfg.rounds;
  const sxs=$$('#strikes .sx');
  sxs.forEach((el,i)=>el.classList.toggle('on',i<S.strikes));
}
function renderBoard(force){
  const el=$('#board');
  /* Bangun ulang hanya saat soal berganti; pembaruan status dilakukan in-place
     agar ketukan multipoint/beruntun tidak hilang karena elemen terlepas dari DOM */
  const existing=el.querySelectorAll('.tile');
  if(!force&&existing.length===S.q.a.length){
    existing.forEach((b,i)=>{
      const ans=S.q.a[i];
      b.className='tile'+(ans.r?' revealed':' hidden');
    });
  }else{
    el.innerHTML='';
    S.q.a.forEach((ans,i)=>{
      const b=document.createElement('button');
      b.className='tile'+(ans.r?' revealed':' hidden');
      b.dataset.i=String(i);
      b.innerHTML='<span class="tnum">'+(i+1)+'</span><span class="ttext">'+esc(ans.t)+'</span><span class="tpts">'+ans.p+'</span>';
      el.appendChild(b);
    });
  }
  $('#qbanner').textContent=S.q.q;
}
function updUndo(){
  $('#btn-undo').classList.toggle('show',S.undo.length>0);
}
function setStealBanner(on){
  let b=document.getElementById('stealbar');
  if(on&&!b){
    b=document.createElement('div');
    b.id='stealbar';
    b.textContent='⚠ KESEMPATAN MENCURI — '+teamName(1-S.playing).toUpperCase()+'!';
    document.getElementById('scr-game').appendChild(b);
    Snd.steal();
  }
  if(!on&&b)b.remove();
}

/* ================= ALUR GAME ================= */
function startGame(){
  if(cfg.source==='guru'&&!GURU_FAM.length){
    toast('✏️ Soal guru masih kosong! Klik tombol "Soal Guru" di menu untuk menambah.');
    return;
  }
  cfg.t1=($('#in-t1').value||'').trim()||'Tim 1';
  cfg.t2=($('#in-t2').value||'').trim()||'Tim 2';
  if(cfg.t1===cfg.t2)cfg.t2=cfg.t2+' (2)';
  LS.set('ff_cfg',cfg);
  usedQ.clear();
  S.scores=[0,0];S.round=1;S.phase='start';
  closeModal();
  show('scr-game');
  if(cfg.input==='auto')enableCamera();else stopCamera();
  askFirstTurn();
}
function askFirstTurn(){
  S.phase='coin';
  showModal('<h3>🪙 Siapa yang main duluan?</h3><p>Ronde berikutnya giliran awan bergantian otomatis.</p>',[
    {t:'🟡 '+cfg.t1,cls:'b-gold',f:()=>{closeModal();beginRound(0);}},
    {t:'🔵 '+cfg.t2,cls:'b-blue',f:()=>{closeModal();beginRound(1);}}
  ]);
}
function beginRound(playing){
  S.playing=playing;
  S.pot=0;S.strikes=0;S.steal=false;S.undo=[];
  S.q=pickSurvey(cfg.source);
  S.phase='play';
  renderBoard(true);updHUD();updUndo();setStealBanner(false);
  $('#qbanner').textContent=S.q.q;
  flashCard('RONDE '+S.round+' — '+teamName(playing).toUpperCase()+' MULAI!',1800);
  Snd.go();
}
function doReveal(i,bySteal){
  if(S.phase!=='play'&&S.phase!=='steal')return;
  const ans=S.q.a[i];
  if(!ans||ans.r)return;
  if(S.steal&&!bySteal)return; /* saat steal, hanya jawaban tim pencuri yang berlaku */
  ans.r=true;
  S.pot+=ans.p;
  S.undo.push({t:'r',i:i});
  updUndo();
  renderBoard();updHUD();
  Snd.reveal();
  const tile=$$('#board .tile')[i];
  if(tile){const r=tile.getBoundingClientRect();FX.burst(r.left+r.width/2,r.top+r.height/2,40);}
  scoreFloat('#potchip',ans.p);
  const left=S.q.a.filter(x=>!x.r).length;
  if(S.steal&&bySteal){
    /* tim pencuri berhasil mengenai papan → segera curi seluruh pot */
    endRound(1-S.playing,'BERHASIL MENCURI pot!');
    return;
  }
  if(left===0){
    if(S.steal)endRound(1-S.playing,'papan habis saat mencuri!');
    else endRound(S.playing,'papan habis!');
  }
}
function doStrike(){
  if(S.phase!=='play')return;
  S.strikes++;
  S.undo.push({t:'s'});
  updUndo();updHUD();
  Snd.buzz();
  const bx=$('#bigx');
  bx.classList.add('show');
  setTimeout(()=>bx.classList.remove('show'),700);
  if(S.strikes>=3){
    S.phase='steal';
    S.steal=true;
    setStealBanner(true);
    toast('⚠ 3 STRIKE! '+teamName(1-S.playing)+' punya 1 kesempatan MENCURI pot '+S.pot+'!');
  }
}
function undo(){
  if(!S.undo.length)return;
  const act=S.undo.pop();
  if(act.t==='r'){
    const ans=S.q.a[act.i];
    if(ans&&ans.r){ans.r=false;S.pot=Math.max(0,S.pot-ans.p);}
  }else if(act.t==='s'){
    S.strikes=Math.max(0,S.strikes-1);
    if(S.phase==='steal'&&S.strikes<3){S.phase='play';setStealBanner(false);}
  }
  renderBoard();updHUD();updUndo();
  Snd.click();
}
function missSteal(){
  if(S.phase!=='steal')return;
  endRound(S.playing,'tim pencuri gagal!');
}
function endRound(winner,reason){
  if(S.phase==='roundend'||S.phase==='over')return;
  S.phase='roundend';
  setStealBanner(false);
  S.scores[winner]+=S.pot;
  updHUD();
  const pot=S.pot;
  Snd.roundwin();
  const tc=$('#tc'+winner);
  if(tc){const r=tc.getBoundingClientRect();FX.burst(r.left+r.width/2,r.top+r.height/2,80);}
  const r=document.getElementById('tc'+winner);
  if(r){r.classList.remove('flash');void r.offsetWidth;r.classList.add('flash');}
  const last=(S.round>=cfg.rounds);
  showModal(
    '<h3>'+(winner===S.playing&&!S.steal?'✅':'🎯')+' '+esc(teamName(winner)).toUpperCase()+' MENDAPATKAN POT!</h3>'+
    '<div class="pot-anim">+'+pot+' POIN</div>'+
    '<p style="text-align:center">'+esc(reason||'')+'</p>'+
    '<p style="text-align:center">Skor sementara: <b>'+esc(teamName(0))+' '+S.scores[0]+'</b> — <b>'+esc(teamName(1))+' '+S.scores[1]+'</b></p>',
    last?[{t:'🏆 Lihat Hasil Akhir',cls:'b-gold',f:()=>{closeModal();finishGame();}}]
        :[{t:'▶️ Ronde Berikutnya',cls:'b-gold',f:()=>{closeModal();nextRound();}}]
  );
}
function nextRound(){
  const nxt=1-S.playing; /* giliran awan bergantian dari ronde sebelumnya */
  S.round++;
  beginRound(nxt);
}
function finishGame(){
  S.phase='over';
  stopCamera();
  show('scr-result');
  const w=S.scores[0]>=S.scores[1]?0:1;
  const tie=S.scores[0]===S.scores[1];
  $('#res-title').textContent=tie?'🤝 SERI!':'🏆 '+teamName(w).toUpperCase()+' MENANG!';
  $('#res-big').innerHTML=[0,1].map(i=>
    '<div class="res-team '+(!tie?(i===w?'win':'lose'):'')+'">'+
    '<span class="rt-crown">'+(!tie&&i===w?'👑':'')+'</span>'+
    '<span class="rt-name">'+esc(teamName(i))+'</span>'+
    '<span class="rt-score">'+S.scores[i]+'</span></div>').join('');
  $('#res-sub').textContent=cfg.rounds+' ronde selesai • semangat bertanding!';
  const board=addFFBoard(cfg.t1,cfg.t2,S.scores[0],S.scores[1]);
  $('#board').innerHTML='<div style="text-align:center;font-weight:700;color:#ffd043;margin-bottom:.6vmin">🏆 PAPAN JUARA</div>'+
    board.map((b,i)=>'<div class="brow'+(i===0?' top1':'')+'"><span class="bpos">'+(i+1)+'</span><span class="bname">'+esc(b.w)+' vs '+esc(b.l)+'</span><span class="bprize">'+b.p+' poin</span></div>').join('');
  if(!tie){FX.startRain(6000);Snd.fanfare();}else Snd.sad();
}

/* ================= INPUT ================= */
function bindBoard(){
  $('#board').addEventListener('pointerdown',e=>{
    const tile=e.target.closest('.tile');
    if(!tile)return;
    e.preventDefault();
    if(S.phase!=='play'&&S.phase!=='steal')return;
    doReveal(+tile.dataset.i,S.steal);
  });
}

/* ================= DWELL KAMERA ================= */
function hitTile(x,y){
  let best=null,bd=1e9;
  $$('#board .tile').forEach(el=>{
    if(el.classList.contains('revealed')||el.classList.contains('dim'))return;
    const r=el.getBoundingClientRect();
    if(x<r.left-18||x>r.right+18||y<r.top-18||y>r.bottom+18)return;
    const cx=r.left+r.width/2,cy=r.top+r.height/2;
    const d=(x-cx)*(x-cx)+(y-cy)*(y-cy);
    if(d<bd){bd=d;best=el;}
  });
  return best;
}
function setTileBar(el,p){
  el.style.boxShadow=(p>0)?('inset 0 -'+Math.round(p*100)+'% 0 rgba(255,215,100,.45), 0 .6vmin 0 rgba(0,0,0,.45)'):'';
}
function mainLoop(ts){
  requestAnimationFrame(mainLoop);
  FX.step();
  const g=document.getElementById('scr-game');
  if(!g||!g.classList.contains('active'))return;
  if(S.phase!=='play'&&S.phase!=='steal')return;
  const now=performance.now();
  for(let i=0;i<CAM.pointers.length;i++){
    const p=CAM.pointers[i];
    if(now-p.seen>400)continue;
    const t=hitTile(p.x,p.y);
    let D=dwell.p;
    if(!D){D={el:null,t0:0};dwell.p=D;}
    if(t&&p.pointing){
      if(D.el!==t){D.el=t;D.t0=now;}
      const prog=(now-D.t0)/DWELL_MS;
      setTileBar(t,clamp(prog,0,1));
      if(prog>=1){setTileBar(t,0);D.el=null;doReveal(+t.dataset.i,S.steal);if(S.phase!=='play'&&S.phase!=='steal')break;}
    }else{
      if(D.el){setTileBar(D.el,0);D.el=null;}
    }
  }
}

/* ================= KAMERA AI (pola sama) ================= */
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
    toast('🤖 Mode AR aktif! Tunjuk petak jawaban, tahan ±1 detik untuk membuka 🎯');
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

/* ================= MODAL BANTUAN / GURU / PAPAN ================= */
function showHelp(){
  showModal(
    '<h3>❓ Cara Main (Guru = Pembaca Survei)</h3>'+
    '<ol>'+
    '<li>👥 Dua tim bertanding. Ronde dimulai: pilih tim giliran pertama (ronde berikut bergantian otomatis).</li>'+
    '<li>🎤 Siswa menjawab survei secara <b>lisan</b>. Kalau jawabannya ada di papan → ketuk petaknya (atau <b>tunjuk dengan gesture</b>, tahan 1 detik) → jawaban terbuka & poin masuk <b>POT</b>.</li>'+
    '<li>❌ Jawaban tidak ada di papan → tekan <b>STRIKE!</b> Tiga strike = <b>⚠ KESEMPATAN MENCURI</b> untuk tim lawan: 1 tebakan. Kena papan → pot dicuri; meleset → pot tetap milik tim pertama.</li>'+
    '<li>↩ Salah ketuk? Ada tombol <b>Batalkan</b> (membuka/membatalkan strike terakhir).</li>'+
    '<li>🏁 Papan habis atau pot diputuskan → ronde berikutnya. Skor terbesar di akhir menang!</li>'+
    '</ol>'+
    '<p>💡 Semua papan soal jumlah poinnya 100. Tambahkan soal kelas Anda lewat menu <b>✏️ Soal Guru</b>.</p>',
    [{t:'Mengerti! 🎯',cls:'b-gold'}]
  );
}
function showBoardModal(){
  const b=getFFBoard();
  const rows=b.length?b.map((x,i)=>'<div class="brow'+(i===0?' top1':'')+'"><span class="bpos">'+(i+1)+'</span><span class="bname">'+esc(x.w)+' vs '+esc(x.l)+'</span><span class="bprize">'+x.p+' poin</span></div>').join(''):'<p style="text-align:center">Belum ada juara — mulai pertandingan pertama! 🏆</p>';
  showModal('<h3>🏆 Papan Juara</h3><div>'+rows+'</div>',[{t:'Tutup',cls:'b-blue'}]);
}
function showGuru(){
  showModal(
    '<h3>✏️ Soal Guru (Survei Kustom)</h3>'+
    '<p>Satu pertanyaan per baris. Jawaban dipisah <code>|</code>, tulis poinnya dengan titik dua:<br><code>Pertanyaan | Jawaban1:35 | Jawaban2:25 | Jawaban3:20</code></p>'+
    '<textarea id="ta-f" placeholder="Contoh: Makanan favorit siswa? | Mie instan:40 | Ayam goreng:30 | Bakso:20 | Sate:10"></textarea>'+
    '<p class="hint">Tanpa poin? Poin dibagi rata otomatis dari 100. Maksimal 8 jawaban, minimal 2. Total tak harus 100 — pot dihitung dari yang terbuka.</p>'+
    '<div class="mrow">'+
    '<button class="btn small b-ghost" id="ta-close">Tutup</button>'+
    '<button class="btn small b-green" id="ta-save">💾 Simpan</button>'+
    '</div>'
  );
  $('#ta-f').value=LS.get('ff_guru','');
  $('#ta-save').onclick=()=>{
    LS.set('ff_guru',$('#ta-f').value);
    loadGuruFam();
    toast('💾 Tersimpan: '+GURU_FAM.length+' soal survei.');
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
  stopCamera();
  setStealBanner(false);
  closeModal();
  show('scr-home');
}
function bindButtons(){
  /* klik/fokus kolom nama = seleksi penuh, jadi mengetik langsung mengganti */
  ['#in-t1','#in-t2'].forEach(sel=>{
    const el=$(sel);
    if(el)el.addEventListener('focus',()=>{try{el.select();}catch(e){}});
  });
  $('#btn-play').onclick=()=>{Snd.click();openSetup();};
  $('#btn-board').onclick=()=>{Snd.click();showBoardModal();};
  $('#btn-help').onclick=()=>{Snd.click();showHelp();};
  $('#btn-guru').onclick=()=>{Snd.click();showGuru();};
  $('#btn-back').onclick=()=>{Snd.click();show('scr-home');};
  $('#btn-start').onclick=()=>{Snd.click();startGame();};
  $('#btn-strike').onclick=doStrike;
  $('#btn-undo').onclick=undo;
  $('#btn-fs').onclick=toggleFS;
  $('#btn-menu').onclick=()=>{Snd.click();
    showModal('<h3>🏠 Kembali ke Menu?</h3><p>Pertandingan berjalan akan dihentikan.</p>',[
      {t:'🏠 Ya, ke Menu',cls:'b-ghost',f:goMenu},
      {t:'🎮 Lanjut Main',cls:'b-gold',f:closeModal}
    ]);
  };
  $('#btn-snd').onclick=()=>{Snd.on=!Snd.on;$('#btn-snd').textContent=Snd.on?'🔊':'🔇';Snd.click();};
  $('#btn-res-again').onclick=()=>{Snd.click();openSetup();};
  $('#btn-res-menu').onclick=()=>{Snd.click();goMenu();};
  addEventListener('resize',()=>{ sizeCamCanvas(); });
}
function boot(){
  FX.init();
  loadGuruFam();
  bindButtons();
  bindBoard();
  requestAnimationFrame(mainLoop);
  show('scr-home');
}
document.addEventListener('DOMContentLoaded',boot);

/* ekspos untuk pengujian */
window.S=S;window.CFG=cfg;window.CAM=CAM;
window.__FF={
  startGame:startGame,askFirstTurn:askFirstTurn,beginRound:beginRound,doReveal:doReveal,doStrike:doStrike,
  undo:undo,missSteal:missSteal,endRound:endRound,nextRound:nextRound,finishGame:finishGame,
  pickSurvey:pickSurvey,parseFamTxt:parseFamTxt,addFFBoard:addFFBoard,getFFBoard:getFFBoard,
  bank:FAM100,onHands:onHands,hitTile:hitTile,Snd:Snd,teamName:teamName
};
