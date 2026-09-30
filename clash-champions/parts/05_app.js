'use strict';
/* ================= STATE ================= */
const CFG_DFLT={t1:'Tim Kiri',t2:'Tim Kanan',c0:'phoenix',c1:'kraken',category:'campuran',wins:2,time:20,input:'auto'};
const cfg=Object.assign({},CFG_DFLT,LS.get('cc_cfg',{}));
const S={phase:'idle',round:1,hp:[100,100],wins:[0,0],turn:0,combo:[0,0],dealt:[0,0],q:null,correct:0,locked:-1,timeLeft:0,timerInt:null,lastTick:-1};
const dwell={};
const CAM={on:false,loading:false,hands:null,stream:null,pointers:[]};
const DWELL_MS=1000;
function champOf(id){ return CHAMPS.find(c=>c.id===id)||CHAMPS[0]; }
function teamName(i){ return i===0?cfg.t1:cfg.t2; }

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
function renderGrid(gi){
  const grid=$('#grid'+gi);
  if(!grid)return;
  grid.innerHTML='';
  CHAMPS.forEach(c=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='champ'+((gi===0?cfg.c0:cfg.c1)===c.id?(' sel'+gi):'');
    b.dataset.id=c.id;
    b.innerHTML='<span class="cav">'+c.av+'</span><span class="cnm">'+c.nm+'</span><span class="ctxt">'+c.txt+'</span>';
    b.onclick=()=>{
      Snd.click();
      if(gi===0){cfg.c0=c.id;if(cfg.c1===c.id)cfg.c1=pick(CHAMPS.filter(x=>x.id!==c.id)).id;}
      else{cfg.c1=c.id;if(cfg.c0===c.id)cfg.c0=pick(CHAMPS.filter(x=>x.id!==c.id)).id;}
      renderGrid(0);renderGrid(1);updPickLbl();updHint();
    };
    grid.appendChild(b);
  });
}
function updPickLbl(){
  $('#pick-lbl0').textContent=champOf(cfg.c0).av+' '+champOf(cfg.c0).nm;
  $('#pick-lbl1').textContent=champOf(cfg.c1).av+' '+champOf(cfg.c1).nm;
}
function updHint(){ $('#wins-hint').textContent=cfg.wins; }
function renderSegs(){
  seg($('#seg-cat'),[
    {value:'campuran',label:'🎲 Campuran'},
    {value:'matematika',label:'🧮 Matematika'},
    {value:'umum',label:'🌍 Pengetahuan Umum'},
    {value:'guru',label:'✏️ Soal Guru'}
  ],()=>cfg.category,v=>cfg.category=v);
  seg($('#seg-lvl'),[{value:1,label:'Mudah'},{value:2,label:'Sedang'},{value:3,label:'Sulit'}],()=>cfg.level||2,v=>cfg.level=v);
  seg($('#seg-wins'),[{value:1,label:'1 Ronde'},{value:2,label:'2 dari 3'},{value:3,label:'3 dari 5'}],()=>cfg.wins,v=>{cfg.wins=v;updHint();});
  seg($('#seg-time'),[{value:15,label:'15 dtk'},{value:20,label:'20 dtk'},{value:30,label:'30 dtk'},{value:45,label:'45 dtk'}],()=>cfg.time,v=>cfg.time=v);
  seg($('#seg-input'),[{value:'auto',label:'🤖 Kamera AI'},{value:'touch',label:'👆 Sentuh / Mouse'}],()=>cfg.input,v=>cfg.input=v);
}
function openSetup(){
  if(!$('#in-t1').value)$('#in-t1').value=cfg.t1||'';
  if(!$('#in-t2').value)$('#in-t2').value=cfg.t2||'';
  renderSegs();renderGrid(0);renderGrid(1);updPickLbl();updHint();
  show('scr-setup');
  Snd.click();
}

/* ================= RENDER ARENA ================= */
function hpClass(p){ return p<=30?'low':(p<=60?'mid':''); }
function updArena(){
  for(let i=0;i<2;i++){
    const c=champOf(i===0?cfg.c0:cfg.c1);
    $('#fav'+i).textContent=c.av;
    $('#fc'+i).textContent='• '+c.nm;
    $('#fn0').childNodes[0].nodeValue=teamName(0)+' ';
    $('#fn1').childNodes[0].nodeValue=teamName(1)+' ';
    const hp=$('#hp'+i);
    hp.style.width=clamp(S.hp[i],0,100)+'%';
    hp.className='hpbar '+hpClass(S.hp[i]);
    $('#cb'+i).textContent=S.combo[i]>=2?('🔥 COMBO '+S.combo[i]):'';
    $('#f'+i).classList.toggle('active',S.turn===i&&(S.phase==='ask'||S.phase==='fight'));
  }
  $('#roundchip').textContent='Ronde '+S.round+' • Menang '+S.wins[0]+'–'+S.wins[1];
  $('#turnchip').textContent='⚔️ Giliran: '+teamName(S.turn);
  const c=champOf(S.turn===0?cfg.c0:cfg.c1);
  $('#turnchip').textContent='⚔️ Giliran: '+teamName(S.turn)+' ('+c.av+' '+c.nm+')';
  $('#ultchip').classList.toggle('show',S.combo[S.turn]===2); /* 1 hit lagi → ultimate */
}
function shake(){
  const el=$('#shake');
  el.classList.remove('go');void el.offsetWidth;el.classList.add('go');
}
function dmgFloat(i,amount,heal){
  const f=$('#f'+i);
  const d=document.createElement('span');
  d.className='fdmg'+(heal?' heal':'');
  d.textContent=(heal?'+':'-')+amount;
  f.querySelector('.favwrap').appendChild(d);
  setTimeout(()=>d.remove(),1100);
}

/* ================= ALUR PERTARUNGAN ================= */
function startMatch(){
  if(cfg.category==='guru'&&!GURU_KUIS.length){
    toast('✏️ Soal guru masih kosong! Klik tombol "Soal Guru" di menu untuk menambah.');
    return;
  }
  cfg.t1=($('#in-t1').value||'').trim()||'Tim Kiri';
  cfg.t2=($('#in-t2').value||'').trim()||'Tim Kanan';
  if(cfg.t1===cfg.t2)cfg.t2=cfg.t2+' (2)';
  LS.set('cc_cfg',cfg);
  usedMap.clear();
  for(const k in dwell)delete dwell[k];
  S.round=1;S.wins=[0,0];S.phase='count';
  closeModal();
  show('scr-game');
  if(cfg.input==='auto')enableCamera();else stopCamera();
  splash('FIGHT!',false,900,()=>{
    beginRound(ri(0,1));
  });
}
function splash(text,ult,ms,cb){
  const sp=$('#splash');
  sp.innerHTML='<span'+(ult?' class="ult"':'')+'>'+text+'</span>';
  sp.classList.add('show');
  if(ult)Snd.crit();else Snd.go();
  setTimeout(()=>{sp.classList.remove('show');if(cb)cb();},ms);
}
function beginRound(turn){
  S.hp=[100,100];S.combo=[0,0];S.turn=turn;S.phase='play';
  updArena();
  $('#f0').classList.remove('ko');$('#f1').classList.remove('ko');
  flashTurn();
  nextQuestion();
}
function flashTurn(){
  toast('⚔️ '+teamName(S.turn)+' mulai menyerang!');
}
function nextQuestion(){
  if(S.phase==='over')return;
  S.locked=-1;
  S.q=pickQuestion(S.round,cfg.category);
  S.correct=S.q.correct;
  $('#qcard').textContent=S.q.text;
  /* opsi dibangun SEKALI dan di-update in-place (pelajaran dari Family 100) */
  $$('#opts .opt').forEach((el,i)=>{
    el.classList.remove('locked','reveal-ok','reveal-bad','dim','gone');
    el.querySelector('.otext').textContent=S.q.opts[i];
    const bar=el.querySelector('.pbar i');
    if(bar)bar.style.width='0%';
  });
  updArena();
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
    if(s<=5&&s!==S.lastTick){S.lastTick=s;Snd.tick();}
  },100);
}
function updTimer(){
  const c=226.2;
  const f=clamp(S.timeLeft/Math.max(1,cfg.time),0,1);
  const fg=document.getElementById('tr-fg');
  if(fg){fg.style.strokeDashoffset=(c*(1-f)).toFixed(1);fg.style.stroke=S.timeLeft<=5?'#ff5e7d':'#c084fc';}
  const tn=document.getElementById('timenum');
  if(tn)tn.textContent=Math.ceil(S.timeLeft);
}
function onTimeout(){
  if(S.phase!=='ask')return;
  resolveAnswer(-1);
}

/* ---- Memilih jawaban → pertarungan ---- */
function choose(i){
  if(S.phase!=='ask')return;
  if(S.locked>=0)return;
  S.locked=i;
  stopTimer();
  S.phase='resolve';
  Snd.lock();
  $$('#opts .opt').forEach(el=>{
    if(+el.dataset.i===i)el.classList.add('locked');
    else el.classList.add('dim');
  });
  setTimeout(()=>resolveAnswer(i),700);
}
function resolveAnswer(i){
  if(S.phase!=='resolve'&&!(S.phase==='ask'&&i===-1))return;
  S.phase='attacking';
  const ok=(i===S.correct);
  const atk=S.turn, def=1-S.turn;
  const els=$$('#opts .opt');
  els.forEach(el=>{
    el.classList.remove('locked','dim');
    const j=+el.dataset.i;
    if(j===S.correct)el.classList.add('reveal-ok');
    else if(j===i&&!ok)el.classList.add('reveal-bad');
  });
  if(ok){
    /* ==== SERANGAN ==== */
    S.combo[atk]++;
    const isUlt=(S.combo[atk]%3===0);
    let dmg=isUlt?30:(16+Math.ceil(clamp(S.timeLeft,0,cfg.time)/Math.max(1,cfg.time)*8));
    applyDamage(def,dmg,isUlt);
    S.dealt[atk]+=dmg;
    if(isUlt){
      splash('⚡ ULTIMATE!',true,1000,()=>afterBattle(atk,def,true));
      const el=$('#f'+def);
      el.classList.add('hit');
      setTimeout(()=>el.classList.remove('hit'),500);
    }else{
      Snd.hit();
      const el=$('#f'+def);
      el.classList.add('hit');
      setTimeout(()=>el.classList.remove('hit'),500);
      const ae=$('#f'+atk);
      ae.classList.add('atk');
      setTimeout(()=>ae.classList.remove('atk'),520);
      setTimeout(()=>afterBattle(atk,def,false),900);
    }
  }else{
    /* ==== COUNTER LAWAN ==== */
    S.combo[atk]=0;
    if(i>=0){
      Snd.counter();
      applyDamage(atk,10,false);
      S.dealt[def]+=10;
      const el=$('#f'+atk);
      el.classList.add('hit');
      setTimeout(()=>el.classList.remove('hit'),500);
      const ae=$('#f'+def);
      ae.classList.add('atk');
      setTimeout(()=>ae.classList.remove('atk'),520);
      toast('💥 '+teamName(def)+' menyerang balik! -10');
      setTimeout(()=>switchTurn(),900);
    }else{
      /* waktu habis: tanpa counter, giliran pindah */
      Snd.wrong();
      toast('⏰ Waktu habis — giliran '+teamName(def)+'!');
      setTimeout(()=>switchTurn(),900);
    }
  }
}
function applyDamage(target,dmg,ult){
  S.hp[target]=clamp(S.hp[target]-dmg,0,100);
  dmgFloat(target,dmg,false);
  updArena();
  if(ult)shake();
  const hpEl=$('#hp'+target);
  if(hpEl){const r=hpEl.getBoundingClientRect();FX.burst(r.left+r.width/2,r.top+r.height/2,ult?70:35);}
}
function afterBattle(atk,def,isUlt){
  if(S.hp[def]<=0){
    koRound(atk);
  }else{
    S.phase='ask';
    nextQuestion();
  }
}
function switchTurn(){
  if(S.hp[0]<=0||S.hp[1]<=0){ /* berjaga-jaga */ }
  S.turn=1-S.turn;
  updArena();
  S.phase='play';
  flashTurn();
  nextQuestion();
}
function koRound(winner){
  S.phase='ko';
  stopTimer();
  const loser=1-winner;
  S.wins[winner]++;
  Snd.ko();
  splash('K.O!',false,1400,null);
  $('#f'+loser).classList.add('ko');
  $('#f'+winner).classList.add('atk');
  const r=$('#f'+winner).getBoundingClientRect();
  FX.burst(r.left+r.width/2,r.top+r.height/2,90);
  updArena();
  setTimeout(()=>{
    const need=cfg.wins;
    if(S.wins[winner]>=need){
      endMatch(winner);
    }else{
      showModal(
        '<h3>💥 K.O! '+esc(teamName(winner)).toUpperCase()+' MENANG RONDE '+S.round+'!</h3>'+
        '<p style="text-align:center">Skor ronde: <b>'+esc(teamName(0))+' '+S.wins[0]+'</b> — <b>'+esc(teamName(1))+' '+S.wins[1]+'</b><br>'+
        'Butuh <b>'+need+'</b> kemenangan ronde untuk jadi juara.</p>',
        [{t:'⚔️ Ronde Berikutnya',cls:'b-gold',f:()=>{closeModal();S.round++;beginRound(loser);}}]
      );
    }
  },1500);
}
function endMatch(winner){
  S.phase='over';
  stopTimer();
  stopCamera();
  show('scr-result');
  const w=champOf(winner===0?cfg.c0:cfg.c1);
  const l=champOf(winner===0?cfg.c1:cfg.c0);
  $('#res-title').textContent='🏆 '+teamName(winner).toUpperCase()+' SANG JUARA!';
  $('#res-champs').innerHTML=
    '<div class="rc"><span class="rcr">👑</span><span class="rav">'+w.av+'</span><span class="rnm">'+esc(teamName(winner))+'</span></div>'+
    '<div class="rc lose"><span class="rcr"></span><span class="rav">'+l.av+'</span><span class="rnm">'+esc(teamName(1-winner))+'</span></div>';
  $('#res-sub').textContent='Menang '+S.wins[winner]+'–'+S.wins[1-winner]+' • Total damage '+S.dealt[winner]+' • Ronde '+S.round;
  const board=addCCBoard(teamName(winner),teamName(1-winner),S.wins[winner],S.round);
  $('#board').innerHTML='<div style="text-align:center;font-weight:700;color:#ffc832;margin-bottom:.6vmin">🏆 AULA SANG JUARA</div>'+
    board.map((b,i)=>'<div class="brow'+(i===0?' top1':'')+'"><span class="bpos">'+(i+1)+'</span><span class="bname">'+esc(b.n)+'</span><span class="bprize">'+b.w+'–'+b.r+' ronde</span></div>').join('');
  FX.startRain(7000);
  Snd.fanfare();
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
function hitOpt(x,y){
  let best=null,bd=1e9;
  $$('#opts .opt').forEach(el=>{
    if(el.classList.contains('gone'))return;
    const r=el.getBoundingClientRect();
    if(x<r.left-18||x>r.right+18||y<r.top-18||y>r.bottom+18)return;
    const cx=r.left+r.width/2,cy=r.top+r.height/2;
    const d=(x-cx)*(x-cx)+(y-cy)*(y-cy);
    if(d<bd){bd=d;best=el;}
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
      if(D.el!==t){D.el=t;D.t0=now;}
      const prog=(now-D.t0)/DWELL_MS;
      setBar(t,clamp(prog,0,1));
      if(prog>=1){setBar(t,0);D.el=null;choose(+t.dataset.i);if(S.phase!=='ask')break;}
    }else{
      if(D.el){setBar(D.el,0);D.el=null;}
    }
  }
}

/* ================= KAMERA AI (pola teruji) ================= */
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
    toast('🤖 Mode AR aktif! Tunjuk pilihan serangan, tahan ±1 detik ⚔️');
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
    cx.fillStyle='rgba(192,132,252,.25)';
    cx.fill();
    cx.beginPath();
    cx.arc(p.x,p.y,7,0,Math.PI*2);
    cx.fillStyle='rgba(192,132,252,.95)';
    cx.fill();
    cx.lineWidth=3;
    cx.strokeStyle='#fff';
    cx.stroke();
  }
}

/* ================= MODAL ================= */
function showHelp(){
  showModal(
    '<h3>❓ Cara Main</h3>'+
    '<ol>'+
    '<li>🔥🔥 Dua tim memilih <b>champion</b>, lalu bertarung dalam duel soal bergilir.</li>'+
    '<li>⚔️ Tim giliran menjawab: <b>benar = serangan</b>! Makin cepat menjawab, makin besar damage (16–24). Salah/mati waktu → giliran pindah.</li>'+
    '<li>💥 Jawaban salah = lawan <b>menyerang balik 10 damage</b> — hati-hati!</li>'+
    '<li>⚡ <b>Combo 3× benar beruntun = ULTIMATE</b> — 30 damage + gempa layar!</li>'+
    '<li>🏆 HP lawan habis = <b>K.O</b>, menang ronde. Tim yang lebih dulu meraih cukup kemenangan ronde jadi <b>SANG JUARA</b>.</li>'+
    '<li>🤖 <b>Kamera AI</b>: tunjuk pilihan serangan dengan telunjuk, tahan ±1 detik. <b>👆 Sentuh</b>: ketuk langsung.</li>'+
    '<li>📈 Soal makin sulit tiap 2 ronde: mudah → sedang → sulit.</li>'+
    '</ol>'+
    '<p>💡 Butuh Chrome/Edge + izin kamera; internet saat pertama memuat AI.</p>',
    [{t:'Siap Bertarung! ⚔️',cls:'b-gold'}]
  );
}
function showBoardModal(){
  const b=getCCBoard();
  const rows=b.length?b.map((x,i)=>'<div class="brow'+(i===0?' top1':'')+'"><span class="bpos">'+(i+1)+'</span><span class="bname">'+esc(x.n)+'</span><span class="bprize">'+x.w+'–'+x.r+' ronde</span></div>').join(''):'<p style="text-align:center">Aula masih sepi — raih gelar juara pertama! 🏆</p>';
  showModal('<h3>🏆 Aula Sang Juara</h3><div>'+rows+'</div>',[{t:'Tutup',cls:'b-blue'}]);
}
function showGuru(){
  showModal(
    '<h3>✏️ Soal Guru (Kustom)</h3>'+
    '<p>Satu soal per baris, pisahkan dengan tanda <code>|</code>:<br><code>Pertanyaan | Jawaban Benar | Salah 1 | Salah 2 | Salah 3</code></p>'+
    '<textarea id="ta-k" placeholder="Contoh: Singkatan dari HTML? | HyperText Markup Language | High Text Machine Language | Hyper Tool Multi Language | Home Tool Markup Language"></textarea>'+
    '<p class="hint">Format sama dengan Gesture Battle, Billionaire &amp; Family 100 — bank soal berbagi di semua game.</p>'+
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
  ['#in-t1','#in-t2'].forEach(sel=>{
    const el=$(sel);
    if(el)el.addEventListener('focus',()=>{try{el.select();}catch(e){}});
  });
  $('#btn-play').onclick=()=>{Snd.click();openSetup();};
  $('#btn-board').onclick=()=>{Snd.click();showBoardModal();};
  $('#btn-help').onclick=()=>{Snd.click();showHelp();};
  $('#btn-guru').onclick=()=>{Snd.click();showGuru();};
  $('#btn-back').onclick=()=>{Snd.click();show('scr-home');};
  $('#btn-start').onclick=()=>{Snd.click();startMatch();};
  $('#btn-fs').onclick=toggleFS;
  $('#btn-snd').onclick=()=>{Snd.on=!Snd.on;$('#btn-snd').textContent=Snd.on?'🔊':'🔇';Snd.click();};
  $('#btn-menu').onclick=()=>{Snd.click();
    showModal('<h3>🏠 Kembali ke Menu?</h3><p>Pertarungan berjalan akan dihentikan.</p>',[
      {t:'🏠 Ya, ke Menu',cls:'b-ghost',f:goMenu},
      {t:'⚔️ Lanjut Bertarung',cls:'b-gold',f:closeModal}
    ]);
  };
  $('#btn-res-again').onclick=()=>{Snd.click();openSetup();};
  $('#btn-res-menu').onclick=()=>{Snd.click();goMenu();};
  addEventListener('resize',()=>{ sizeCamCanvas(); });
}
function boot(){
  FX.init();
  loadGuruBanks();
  bindButtons();
  bindOpts();
  requestAnimationFrame(mainLoop);
  show('scr-home');
}
document.addEventListener('DOMContentLoaded',boot);

/* ekspos untuk pengujian */
window.S=S;window.CFG=cfg;window.CAM=CAM;
window.__CC={
  startMatch:startMatch,beginRound:beginRound,choose:choose,resolveAnswer:resolveAnswer,
  applyDamage:applyDamage,koRound:koRound,endMatch:endMatch,switchTurn:switchTurn,nextQuestion:nextQuestion,
  pickQuestion:pickQuestion,diffOfRound:diffOfRound,genMath:genMath,makeOpts:makeOpts,parseKuisTxt:parseKuisTxt,
  addCCBoard:addCCBoard,getCCBoard:getCCBoard,CHAMPS:CHAMPS,champOf:champOf,
  onHands:onHands,hitOpt:hitOpt,Snd:Snd
};
