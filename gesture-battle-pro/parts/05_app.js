'use strict';
/* ================= STATE & CFG ================= */
const CFG_DFLT={mode:'duel',p1:'Tim Kiri',p2:'Tim Kanan',mapel:'',kelas:'',category:'campur',rounds:10,time:20,input:'auto'};
const cfg=Object.assign({},CFG_DFLT,LS.get('gbp_cfg',{}));
const S={phase:'idle',mode:'duel',round:0,rounds:10,players:[],q:null,correct:0,bubbles:[],timeLeft:0,timerInt:null,lastTick:-1,pauseLeft:0};
const CAM={on:false,loading:false,hands:null,stream:null,busy:false,lastSend:0};
const handsLive=[];            /* [{x,y,team,frozenUntil,seen}] posisi layar px */
const DWELL_MS=900, CIRC=314.2;

function teamCount(){return S.mode==='duel'?2:1;}
function pName(i){return S.players[i]?S.players[i].name:(i===0?cfg.p1:cfg.p2);}

/* ================= NAV & UI ================= */
function show(id){$$('.screen').forEach(s=>s.classList.remove('active'));const el=document.getElementById(id);if(el)el.classList.add('active');}
let toastT;
function toast(m,ms){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),ms||2400);}
function showModal(html,btns){
  const root=$('#modal-root');
  root.innerHTML='<div class="modal">'+html+'<div class="mrow"></div></div>';
  const row=root.querySelector('.mrow');
  (btns||[]).forEach(b=>{
    const bt=document.createElement('button');
    bt.className='btn small '+(b.cls||'b-blue');bt.textContent=b.t;
    bt.onclick=()=>{Snd.click();if(b.f)b.f();else closeModal();};
    row.appendChild(bt);
  });
  root.classList.add('open');
}
function closeModal(){$('#modal-root').classList.remove('open');}
function seg(el,opts,get,set){
  if(!el)return;el.innerHTML='';
  opts.forEach(o=>{
    const b=document.createElement('button');
    b.type='button';b.className='chip'+(o.value===get()?' on':'');b.textContent=o.label;
    b.onclick=()=>{Snd.click();set(o.value);seg(el,opts,get,set);};
    el.appendChild(b);
  });
}

/* ================= SETUP ================= */
function openSetup(mode){
  cfg.mode=mode;
  $('#setup-title').textContent=mode==='duel'?'⚙️ Persiapan Duel':'⚙️ Solo Challenge';
  $('#wrap-p2').style.display=mode==='duel'?'block':'none';
  $('#in-p1').value=cfg.p1;$('#in-p2').value=cfg.p2;
  $('#in-mapel').value=cfg.mapel||'';$('#in-kelas').value=cfg.kelas||'';
  renderSegs();
  show('scr-setup');
}
function renderSegs(){
  seg($('#seg-cat'),[{value:'campur',label:'🎲 Campur'},{value:'umum',label:'📚 Umum'},{value:'matematika',label:'🔢 Matematika'},{value:'guru',label:'✏️ Soal Guru'}],()=>cfg.category,v=>cfg.category=v);
  seg($('#seg-rounds'),[{value:5,label:'5 soal'},{value:10,label:'10 soal'},{value:15,label:'15 soal'}],()=>cfg.rounds,v=>cfg.rounds=v);
  seg($('#seg-time'),[{value:15,label:'15 dtk'},{value:20,label:'20 dtk'},{value:30,label:'30 dtk'}],()=>cfg.time,v=>cfg.time=v);
  seg($('#seg-input'),[{value:'auto',label:'🤖 Kamera AI'},{value:'touch',label:'👆 Sentuh'}],()=>cfg.input,v=>cfg.input=v);
  const note=$('#setup-note');
  note.textContent=(cfg.mode==='duel'?2:1)+' pemain • ✏️ Soal Guru: '+(GURU_KUIS.length?GURU_KUIS.length+' tersedia':'kosong (pakai matematika)')+' • 🤖 Kamera: 1 tangan per tim';
}

/* ================= ALUR GAME ================= */
function startGame(){
  stopTimer();
  S.phase='idle';            /* reset: game sebelumnya bisa meninggalkan fase 'over'/'pause' */
  cfg.p1=($('#in-p1').value||'').trim()||'Tim Kiri';
  cfg.p2=($('#in-p2').value||'').trim()||'Tim Kanan';
  cfg.mapel=($('#in-mapel').value||'').trim();
  cfg.kelas=($('#in-kelas').value||'').trim();
  if(cfg.category==='guru'&&!GURU_KUIS.length){toast('✏️ Soal guru kosong — ganti kategori atau tambah soal!');return;}
  LS.set('gbp_cfg',cfg);
  usedMap.clear();
  S.mode=cfg.mode;S.rounds=cfg.rounds;S.round=0;
  S.players=cfg.mode==='duel'
    ?[{name:cfg.p1,score:0,streak:0,frozenUntil:0},{name:cfg.p2,score:0,streak:0,frozenUntil:0}]
    :[{name:cfg.p1,score:0,streak:0,frozenUntil:0}];
  $('#sc-l-lbl').textContent=S.players[0].name.toUpperCase();
  $('#sc-r-lbl').textContent=S.mode==='duel'?S.players[1].name.toUpperCase():'SOLO';
  $('#sc-r').style.display=S.mode==='duel'?'block':'none';
  closeModal();
  show('scr-game');
  updateScores();
  if(cfg.input==='auto')enableCamera();else stopCamera(true);
  splash('FIGHT!',false,900,()=>nextRound());
}
function splash(text,ok,ms,cb){
  const sp=$('#splash');
  sp.innerHTML='<span'+(ok?' class="ult"':'')+'>'+text+'</span>';
  sp.classList.add('show');
  if(ok)Snd.fanfare();else Snd.go();
  setTimeout(()=>{sp.classList.remove('show');if(cb)cb();},ms);
}
function qLabel(){
  const m=cfg.mapel||'KUIS';
  const k=cfg.kelas?(', KELAS '+cfg.kelas):'';
  return (m+k).toUpperCase();
}
function nextRound(){
  if(S.phase==='over')return;
  S.round++;
  if(S.round>S.rounds){finishGame();return;}
  S.q=pickQ(cfg.category);
  S.correct=S.q.correct;
  $('#chip-soal').textContent='Soal '+S.round+' / '+S.rounds;
  $('#qlbl').textContent=qLabel();
  $('#qtext').textContent=S.q.text;
  spawnBubbles();
  updateScores();
  S.phase='ask';
  S.timeLeft=cfg.time;S.lastTick=Math.ceil(S.timeLeft);
  updTimer();
  if(S.timerInt)clearInterval(S.timerInt);
  S.timerInt=setInterval(()=>{
    if(S.phase!=='ask')return;
    S.timeLeft-=.1;
    if(S.timeLeft<=0){S.timeLeft=0;updTimer();timeUp();return;}
    updTimer();
    const s=Math.ceil(S.timeLeft);
    if(s<=5&&s!==S.lastTick){S.lastTick=s;Snd.tick();}
  },100);
}
function updTimer(){
  const f=clamp(S.timeLeft/Math.max(1,cfg.time),0,1);
  const bar=$('#tbar-i');
  if(bar){bar.style.width=Math.round(f*100)+'%';bar.style.background=f<=.25?'var(--red)':'linear-gradient(90deg,var(--green),var(--gold))';}
}
function timeUp(){
  if(S.phase!=='ask')return;
  S.phase='reveal';
  Snd.sad();
  revealCorrect();
  toast('⏰ Waktu habis! Jawaban: '+String(correctVal()));
  S.players.forEach(p=>p.streak=0);
  setTimeout(nextRound,2200);
}
function correctVal(){return S.q.opts?S.q.opts[S.correct]:'';}
function revealCorrect(){
  S.bubbles.forEach(b=>{if(b.opt===S.correct&&!b.popped)b.el.classList.add('ok');});
}

/* ================= GELEMBUNG ================= */
function slotsFor(team){
  /* duel: 4 kiri (team0), 4 kanan (team1); solo: lebar layar; y 30–86% */
  const xs=S.mode==='solo'?[14,36,58,80]:(team===0?[12,30,20,38]:[62,80,70,88]);
  const ys=[34,50,68,84];
  const out=[];
  const order=shuffle([0,1,2,3]);
  order.forEach((yi,k)=>out.push({x:xs[k],y:ys[yi]}));
  return out;
}
function spawnBubbles(){
  const layer=$('#bubbles');
  layer.innerHTML='';
  S.bubbles=[];
  const n=S.q.opts.length;
  const order=shuffle(S.q.opts.map((v,i)=>i));
  const teams=S.mode==='duel'?[0,1]:[0];
  teams.forEach(t=>{
    const sl=slotsFor(t);
    order.forEach((oi,k)=>{
      const pos=sl[k];
      const el=document.createElement('div');
      el.className='bub'+(t===1?' t1':'');
      el.style.left=pos.x+'%';el.style.top=pos.y+'%';
      el.style.animationDelay=(Math.random()*2).toFixed(2)+'s';
      el.innerHTML='<span class="bt">'+esc(S.q.opts[oi])+'</span>'+
        '<svg class="pr" viewBox="0 0 110 110"><circle cx="55" cy="55" r="50"/></svg>';
      el.dataset.opt=oi;el.dataset.team=t;
      layer.appendChild(el);
      const bub={opt:oi,team:t,val:S.q.opts[oi],el:el,popped:false,circ:el.querySelector('circle')};
      el.addEventListener('pointerdown',ev=>{ev.preventDefault();popBubble(bub,t);});
      S.bubbles.push(bub);
    });
  });
}
function bubbleCenter(b){
  const r=b.el.getBoundingClientRect();
  return {x:r.left+r.width/2,y:r.top+r.height/2,rad:r.width/2};
}
function popBubble(b,team){
  if(S.phase!=='ask'||b.popped)return;
  const P=S.players[team];
  if(!P)return;
  if(S.mode==='duel'&&Date.now()<P.frozenUntil){return;}
  b.popped=true;
  const ok=(b.opt===S.correct);
  if(ok){
    b.el.classList.add('pop');
    Snd.pop();Snd.correct();
    P.streak++;
    const speed=Math.ceil(clamp(S.timeLeft,0,cfg.time)/Math.max(1,cfg.time)*5);
    let pts=10+speed;
    let bonus='';
    if(P.streak>=3){pts+=5;bonus=' 🔥';}
    P.score+=pts;
    const c=bubbleCenter(b);
    FX.burst(c.x,c.y,60);
    floatPts(c.x,c.y,'+'+pts+bonus);
    updateScores();
    S.phase='reveal';
    revealCorrect();
    S.bubbles.forEach(x=>{if(!x.popped)x.el.classList.add('dim');});
    setTimeout(nextRound,2000);
  }else{
    b.el.classList.add('bad','pop');
    Snd.wrong();
    P.streak=0;
    P.frozenUntil=Date.now()+2500;
    toast('❌ '+pName(team)+' beku 2,5 dtk!');
    updateScores();
    /* lanjut: tim lain masih bisa menjawab sampai waktu habis */
  }
}
function floatPts(x,y,txt){
  const d=document.createElement('div');
  d.className='fdmg';d.textContent=txt;
  d.style.left=(x-40)+'px';d.style.top=(y-30)+'px';
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),1150);
}
function updateScores(){
  $('#sc-l-val').textContent=S.players[0]?S.players[0].score:0;
  $('#sc-r-val').textContent=S.players[1]?S.players[1].score:0;
}

/* ================= HASIL ================= */
function finishGame(){
  S.phase='over';
  stopTimer();
  stopCamera(true);
  const ps=S.players.slice().sort((a,b)=>b.score-a.score);
  const tie=S.players.length>1&&ps[0].score===ps[1].score;
  $('#res-title').textContent='Pertandingan Selesai!';
  $('#rb-l-lbl').textContent=S.players[0].name.toUpperCase();
  $('#rb-l-val').textContent=S.players[0].score;
  $('#rb-r-lbl').textContent=S.mode==='duel'?S.players[1].name.toUpperCase():'SOLO';
  $('#rb-r-val').textContent=S.mode==='duel'?S.players[1].score:'—';
  const pill=$('#win-pill');
  if(tie){pill.textContent='🤝 SERI!';pill.style.display='block';}
  else if(S.mode==='solo'){pill.textContent='🏁 SELESAI!';pill.style.display='block';}
  else{pill.textContent=ps[0].name.toUpperCase()+' PEMENANG';pill.classList.toggle('t1',S.players[1]===ps[0]);pill.style.display='block';}
  if(!tie&&S.mode==='duel'&&ps[0].score>0){FX.rain(4000);Snd.fanfare();}
  else Snd.go();
  show('res');
}
function stopTimer(){if(S.timerInt){clearInterval(S.timerInt);S.timerInt=null;}}

/* ================= KAMERA AI ================= */
function camTag(t){const el=$('#camtag');if(el){el.textContent=t;el.classList.add('show');}}
function camTagHide(){const el=$('#camtag');if(el)el.classList.remove('show');}
function sizeCamCanvas(){const cv=$('#camov');if(!cv)return;cv.width=innerWidth;cv.height=innerHeight;}
function loadScript(src,timeout){
  return new Promise((res,rej)=>{
    const s=document.createElement('script');s.src=src;
    const to=setTimeout(()=>rej(new Error('timeout')),timeout||20000);
    s.onload=()=>{clearTimeout(to);res();};
    s.onerror=()=>{clearTimeout(to);rej(new Error('gagal memuat'));};
    document.head.appendChild(s);
  });
}
function loadAI(){
  if(!CAM.ai){
    CAM.ai=(async()=>{
      if(typeof Hands==='undefined')await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js',25000);
      CAM.hands=new Hands({locateFile:f=>'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/'+f});
      CAM.hands.setOptions({maxNumHands:2,modelComplexity:0,minDetectionConfidence:0.55,minTrackingConfidence:0.5});
      CAM.hands.onResults(onHands);
      return true;
    })().catch(e=>{CAM.ai=null;throw e;});
  }
  return CAM.ai;
}
async function enableCamera(){
  if(CAM.on||CAM.loading)return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('📷 Kamera tidak didukung — pakai mode 👆 Sentuh.');return;}
  CAM.loading=true;
  camTag('⏳ Memuat AI… (sekali saja)');
  try{
    if(!CAM.stream){
      CAM.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false});
      const v=$('#cam');v.srcObject=CAM.stream;await v.play();
    }
    document.body.classList.add('cam');
    sizeCamCanvas();
    await loadAI();
    CAM.on=true;CAM.loading=false;
    camTag('🤖 AI aktif — 2 tangan');
    toast('🟡 Tangan 1 = tim kiri • 🔵 Tangan 2 = tim kanan. Tahan di gelembung ±1 dtk!');
    camLoop();
  }catch(e){
    CAM.loading=false;
    document.body.classList.remove('cam');
    toast('📷 Kamera/AI gagal ('+(e.name||'kesalahan')+') — pakai mode 👆 Sentuh.',4000);
  }
}
function stopCamera(silent){
  CAM.on=false;CAM.loading=false;
  if(CAM.stream){try{CAM.stream.getTracks().forEach(t=>t.stop());}catch(e){}}
  CAM.stream=null;
  const v=$('#cam');if(v)v.srcObject=null;
  document.body.classList.remove('cam');
  camTagHide();
  handsLive.length=0;
  const cv=$('#camov');
  if(cv){const cx=cv.getContext('2d');if(cx)cx.clearRect(0,0,cv.width,cv.height);}
}
async function camLoop(){
  if(!CAM.on)return;
  if(!CAM.busy&&CAM.hands){
    const v=$('#cam');
    if(v&&v.readyState>=2&&performance.now()-CAM.lastSend>=50){
      CAM.lastSend=performance.now();
      CAM.busy=true;
      try{await CAM.hands.send({image:v});}catch(e){}
      CAM.busy=false;
    }
  }
  requestAnimationFrame(camLoop);
}
function onHands(res){
  const g=$('#scr-game');
  if(!g||!g.classList.contains('active')||!CAM.on){handsLive.length=0;drawDots();return;}
  const now=performance.now();
  const lms=res.multiHandLandmarks||[];
  const sw=innerWidth,sh=innerHeight;
  const v=$('#cam');
  const vw=(v&&v.videoWidth)||1280,vh=(v&&v.videoHeight)||720;
  const sc=Math.max(sw/vw,sh/vh);
  const ox=(sw-vw*sc)/2,oy=(sh-vh*sc)/2;
  for(let i=0;i<2;i++){
    const L=lms[i];
    if(!L||!L[8]){continue;}
    const P=L[8];
    const rawX=ox+(1-P.x)*vw*sc;
    const rawY=oy+P.y*vh*sc;
    let h=handsLive[i];
    if(!h){h={x:rawX,y:rawY,team:i,frozenUntil:0,seen:0};handsLive[i]=h;}
    h.x+=(rawX-h.x)*.45;h.y+=(rawY-h.y)*.45;h.seen=now;h.team=i;
  }
  /* buang tangan hilang */
  for(let i=0;i<2;i++)if(handsLive[i]&&now-handsLive[i].seen>350)handsLive[i]=undefined;
  drawDots();
  dwellStep(now);
}
function drawDots(){
  const cv=$('#camov');
  if(!cv)return;
  const cx=cv.getContext('2d');
  cx.clearRect(0,0,cv.width,cv.height);
  handsLive.forEach(h=>{
    if(!h)return;
    const frozen=Date.now()<h.frozenUntil;
    const col=frozen?'#8a93b8':(h.team===0?'#ffc832':'#3ec1ff');
    cx.beginPath();cx.arc(h.x,h.y,22,0,Math.PI*2);cx.fillStyle=col+'44';cx.fill();
    cx.beginPath();cx.arc(h.x,h.y,9,0,Math.PI*2);cx.fillStyle=col;cx.fill();
    cx.lineWidth=3;cx.strokeStyle='#fff';cx.stroke();
  });
}
/* dwell: tangan mendekat ke gelembung warnanya sendiri */
function dwellStep(now){
  if(S.phase!=='ask')return;
  handsLive.forEach(h=>{
    if(!h)return;
    const frozen=Date.now()<h.frozenUntil;
    /* reset semua progres ring tangan ini */
    S.bubbles.forEach(b=>{
      if(b.team!==h.team||b.popped)return;
      if(b._dwOwner===h&&(!near(b,h)||frozen)){b._dwOwner=null;if(b.circ)b.circ.style.strokeDashoffset=CIRC;}
    });
    if(frozen)return;
    const b=nearBubble(h);
    if(!b)return;
    if(b._dwOwner!==h){b._dwOwner=h;h._dwStart=now;}
    const prog=(now-h._dwStart)/DWELL_MS;
    if(b.circ)b.circ.style.strokeDashoffset=String(CIRC*(1-clamp(prog,0,1)));
    if(prog>=1){b._dwOwner=null;if(b.circ)b.circ.style.strokeDashoffset=CIRC;popBubble(b,h.team);}
  });
}
function near(b,h){
  const c=bubbleCenter(b);
  const rad=Math.max(26,c.rad+14);
  return (h.x-c.x)*(h.x-c.x)+(h.y-c.y)*(h.y-c.y)<=rad*rad;
}
function nearBubble(h){
  let best=null,bd=Infinity;
  S.bubbles.forEach(b=>{
    if(b.team!==h.team||b.popped)return;
    const c=bubbleCenter(b);
    const d=(h.x-c.x)*(h.x-c.x)+(h.y-c.y)*(h.y-c.y);
    const rad=Math.max(26,c.rad+14);
    if(d<=rad*rad&&d<bd){bd=d;best=b;}
  });
  return best;
}

/* ================= MODAL BANTUAN & GURU ================= */
function showHelp(){
  showModal('<h3>❓ Cara Main</h3><ol>'+
    '<li>🫧 Jawaban melayang sebagai <b>gelembung</b>: cincin 🟡 emas = tim kiri, 🔵 biru = tim kanan.</li>'+
    '<li>🤖 <b>Kamera AI</b>: ujung jari tim masing-masing (tangan 1 = kiri, tangan 2 = kanan). Arahkan ke gelembung, <b>tahan ±1 detik</b>!</li>'+
    '<li>✅ Pop jawaban benar = poin (makin cepat makin banyak, 3× beruntun 🔥 bonus).</li>'+
    '<li>❌ Pop yang salah = tangan <b>beku 2,5 detik</b> — tim lain bisa menyusul!</li>'+
    '<li>⏰ Habis waktu → ronde seri, jawaban dibocorkan.</li>'+
    '<li>🏆 Skor tertinggi di akhir menjadi <b>PEMENANG</b>!</li>'+
    '</ol><p>💡 Butuh Chrome/Edge + izin kamera; internet saat pertama memuat AI. Tanpa kamera → mode 👆 Sentuh (tap gelembung).</p>',
    [{t:'Siap! 🫧',cls:'b-gold'}]);
}
function showGuru(){
  showModal('<h3>✏️ Soal Guru (Kustom)</h3>'+
    '<p>Satu soal per baris, pisahkan dengan <code>|</code>:<br><code>Pertanyaan | Jawaban Benar | Salah | Salah | Salah</code></p>'+
    '<textarea id="ta-k" class="inp" rows="7" style="font-size:2.1vmin" placeholder="Contoh: Singkatan dari HTML? | HyperText Markup Language | Home Tool ML | Hyper Tab ML | High Text ML"></textarea>'+
    '<p class="hint" style="margin-top:1vmin">Bank berbagi dengan seluruh seri (Gesture Battle, Billionaire, Family 100, Clash of Champions).</p>',
    [{t:'Tutup',cls:'b-ghost'},
     {t:'💾 Simpan',cls:'b-green',f:()=>{
       LS.set('gb_guru_kuis',$('#ta-k').value);
       loadGuruBanks();
       renderSegs();
       toast('💾 Tersimpan: '+GURU_KUIS.length+' soal.');
       closeModal();
     }}]);
  $('#ta-k').value=LS.get('gb_guru_kuis','');
}

/* ================= TOMBOL & LOOP ================= */
function toggleFS(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen();}catch(e){toast('Layar penuh tidak didukung');}}
function goHome(){if(S.phase!=='over'&&S.timerInt){clearInterval(S.timerInt);S.timerInt=null;}S.phase='idle';stopCamera(true);closeModal();show('scr-home');}
function bindButtons(){
  $$('#scr-home .btn[data-mode]').forEach(b=>{
    b.onclick=()=>{Snd.click();openSetup(b.dataset.mode);};
  });
  $('#btn-help').onclick=()=>{Snd.click();showHelp();};
  $('#btn-guru').onclick=()=>{Snd.click();showGuru();};
  $('#btn-back').onclick=()=>{Snd.click();show('scr-home');};
  $('#btn-start').onclick=()=>{Snd.click();startGame();};
  $('#btn-fs').onclick=toggleFS;
  $('#btn-snd').onclick=()=>{Snd.on=!Snd.on;$('#btn-snd').textContent=Snd.on?'🔊':'🔇';Snd.click();};
  $('#btn-pause').onclick=()=>{Snd.click();
    if(S.phase==='ask'){S.pauseLeft=S.timeLeft;stopTimer();S.phase='pause';
      showModal('<h3>⏸ Jeda</h3><p>Pertandingan dihentikan sementara.</p>',
        [{t:'▶️ Lanjut',cls:'b-green',f:()=>{closeModal();S.phase='ask';S.timeLeft=S.pauseLeft;updTimer();
          S.timerInt=setInterval(()=>{ if(S.phase!=='ask')return;S.timeLeft-=.1;
            if(S.timeLeft<=0){S.timeLeft=0;updTimer();timeUp();return;}updTimer();
            const s=Math.ceil(S.timeLeft);if(s<=5&&s!==S.lastTick){S.lastTick=s;Snd.tick();}},100);}},
         {t:'🏠 Menu',cls:'b-ghost',f:goHome}]);
    }else if(S.phase==='pause'){/* modal sudah terbuka */}
  };
  $('#btn-again').onclick=()=>{Snd.click();openSetup(S.mode);};
  $('#btn-menu').onclick=()=>{Snd.click();goHome();};
  addEventListener('resize',()=>{sizeCamCanvas();});
}
function fxLoop(){FX.step();requestAnimationFrame(fxLoop);}
function boot(){
  FX.init();
  loadGuruBanks();
  bindButtons();
  requestAnimationFrame(fxLoop);
  show('scr-home');
}
document.addEventListener('DOMContentLoaded',boot);

/* ================= HOOK UJI ================= */
window.G=S;window.CFG=cfg;window.CAM=CAM;
window.__GBP={
  startGame,openSetup,nextRound,spawnBubbles,popBubble,pickQ,parseKuisTxt,genMath,makeOpts,bankToQ,
  finishGame,goHome,nearBubble,bubbleCenter,onHands,Snd,FX,UMUM,loadGuruBanks,GURU_KUIS_REF:()=>GURU_KUIS,
  handsLive,DWELL_MS,CIRC,updateScores,timeUp,revealCorrect,correctVal
};
