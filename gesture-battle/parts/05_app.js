'use strict';
/* ================= STATE ================= */
const CFG_DFLT={mode:'duel',category:'matematika',level:2,rounds:10,time:20,input:'auto',bs2p:true,p1:'Pemain Kiri',p2:'Pemain Kanan',mapel:'',kelas:''};
const cfg=Object.assign({},CFG_DFLT,LS.get('gb_cfg',{}));
const G={phase:'idle',round:0,q:null,correct:0,bsMode:false,players:[],locked:[],frozen:[],lockAt:[],targets:[],timeLeft:0,timerInt:null,lastTick:-1,pauseLeft:0};
const dwell={};
const CAM={on:false,loading:false,hands:null,stream:null,pointers:[]};

/* ================= LAYAR ================= */
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
function flashCard(msg,color,ms){
  const f=$('#flash'); if(!f)return;
  f.textContent=msg; f.style.borderColor=color||'#ffc800';
  f.classList.remove('hidden');
  clearTimeout(flashT);
  flashT=setTimeout(()=>f.classList.add('hidden'),ms||1700);
}

function scoreFloat(i,txt){
  const el=document.getElementById('pc'+i); if(!el)return;
  const r=el.getBoundingClientRect();
  const d=document.createElement('div');
  d.className='sfloat'; d.textContent=txt;
  d.style.left=(r.left+r.width/2)+'px';
  d.style.top=Math.max(10,r.top-10)+'px';
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),1300);
}

function updateHUD(){
  G.players.forEach((p,i)=>{
    const sc=document.getElementById('sc'+i), st=document.getElementById('st'+i);
    if(sc)sc.textContent=p.score;
    if(st)st.textContent=p.streak>=2?('🔥'+p.streak):'';
    const card=document.getElementById('pc'+i);
    if(card){card.classList.remove('flash');void card.offsetWidth;card.classList.add('flash');}
  });
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
  seg($('#seg-jml'),[{value:true,label:'👥 2 Pemain'},{value:false,label:'👤 1 Pemain'}],()=>cfg.bs2p,v=>cfg.bs2p=v);
  seg($('#seg-cat'),[
    {value:'matematika',label:'🧮 Matematika'},
    {value:'umum',label:'🌍 Pengetahuan Umum'},
    {value:'campuran',label:'🎲 Campuran'},
    {value:'guru',label:'✏️ Soal Guru'}
  ],()=>cfg.category,v=>cfg.category=v);
  seg($('#seg-lvl'),[{value:1,label:'Kelas 1–2'},{value:2,label:'Kelas 3–4'},{value:3,label:'Kelas 5–6'}],()=>cfg.level,v=>cfg.level=v);
  seg($('#seg-rounds'),[{value:5,label:'5'},{value:10,label:'10'},{value:15,label:'15'}],()=>cfg.rounds,v=>cfg.rounds=v);
  seg($('#seg-time'),[{value:10,label:'10 detik'},{value:15,label:'15 detik'},{value:20,label:'20 detik'},{value:30,label:'30 detik'}],()=>cfg.time,v=>cfg.time=v);
  seg($('#seg-input'),[{value:'auto',label:'🤖 Kamera AI'},{value:'touch',label:'👆 Sentuh / Mouse'}],()=>cfg.input,v=>cfg.input=v);
}

const CAT_LABEL={matematika:'Matematika',umum:'Pengetahuan Umum',campuran:'Campuran',guru:'Soal Guru'};

function openSetup(mode){
  cfg.mode=mode;
  $('#setup-title').textContent={duel:'🥊 Duel 2 Pemain',solo:'🎯 Solo Challenge',bs:'✅❌ Benar – Salah'}[mode]||'Pengaturan';
  $('#row-p2').style.display=(mode==='duel'||mode==='bs')?'':'none';
  $('#row-jml').style.display=(mode==='bs')?'':'none';
  $('#in-p1').value=cfg.p1||'';
  $('#in-p2').value=cfg.p2||'';
  $('#in-mapel').value=cfg.mapel||'';
  $('#in-kelas').value=cfg.kelas||'';
  renderSegs();
  show('scr-setup');
  Snd.click();
}

function buildPlayers(){
  if(cfg.mode==='duel')return [{name:cfg.p1,score:0,streak:0},{name:cfg.p2,score:0,streak:0}];
  const ps=[{name:cfg.p1,score:0,streak:0}];
  if(cfg.mode==='bs'&&cfg.bs2p)ps.push({name:cfg.p2,score:0,streak:0});
  return ps;
}

function startGame(){
  if(cfg.category==='guru'){
    const butuhKuis=(cfg.mode!=='bs'), butuhBS=(cfg.mode==='bs');
    if(butuhKuis&&!GURU_KUIS.length){toast('✏️ Soal kuis guru masih kosong! Klik tombol "Soal Guru" untuk menambah.');return;}
    if(butuhBS&&!GURU_BS.length){toast('✏️ Pernyataan benar–salah guru masih kosong! Klik tombol "Soal Guru" untuk menambah.');return;}
  }
  cfg.p1=($('#in-p1').value||'').trim()||'Pemain Kiri';
  cfg.p2=($('#in-p2').value||'').trim()||'Pemain Kanan';
  cfg.mapel=($('#in-mapel').value||'').trim();
  cfg.kelas=($('#in-kelas').value||'').trim();
  LS.set('gb_cfg',cfg);
  closeModal(); stopTimer();
  usedMap.clear();
  for(const k in dwell)delete dwell[k];
  G.players=buildPlayers();
  G.round=0; G.bsMode=(cfg.mode==='bs'); G.phase='count';
  const dua=G.players.length>1;
  $('#lb0').textContent=dua?'SISWA KIRI':'SISWA';
  $('#lb1').textContent='SISWA KANAN';
  $('#nm0').textContent=G.players[0].name; $('#sc0').textContent='0'; $('#st0').textContent='';
  $('#pc1').style.visibility=dua?'visible':'hidden';
  if(dua){$('#nm1').textContent=G.players[1].name;$('#sc1').textContent='0';$('#st1').textContent='';}
  $('#arenas').classList.toggle('solo',!dua);
  $('#ar1').style.display=dua?'':'none';
  $('#qcard').textContent='Siap-siap…';
  $('#qcard').classList.toggle('bs',G.bsMode);
  $('#qsubject').textContent=subjectLabel();
  if(cfg.input==='auto')enableCamera();
  else stopCamera();
  show('scr-game');
  countdown(()=>nextRound());
}

function subjectLabel(){
  const bag=[cfg.mapel,cfg.kelas].filter(Boolean);
  return bag.length?bag.join(' • '):(CAT_LABEL[cfg.category]||'KUIS').toUpperCase();
}

function countdown(cb){
  const el=$('#countdown');
  el.classList.remove('hidden');
  const seq=['3','2','1','AYO!'];
  let i=0;
  (function step(){
    if(i>=seq.length){el.classList.add('hidden');cb();return;}
    el.innerHTML='<span>'+seq[i]+'</span>';
    if(seq[i]==='AYO!')Snd.go();else Snd.tone(440+i*140,.12,'square',.14);
    i++;setTimeout(step,850);
  })();
}

/* ================= RONDE ================= */
function nextRound(){
  if(G.phase==='over')return;
  G.round++;
  if(G.round>cfg.rounds){finishGame();return;}
  $('#roundlbl').textContent=G.round+'/'+cfg.rounds;
  $('#qsubject').textContent=subjectLabel();
  G.q=G.bsMode?pickBS():pickKuis();
  G.correct=G.bsMode?(G.q.correct==='BENAR'?1:0):G.q.correct;
  const qc=$('#qcard');
  qc.textContent=G.q.text;
  qc.classList.toggle('bs',G.bsMode);
  G.locked=[null,null];G.frozen=[false,false];G.lockAt=[0,0];
  renderArenas();
  G.phase='ask';
  startTimer(cfg.time);
}

function isWord(v){return !/^-?\d{1,3}$/.test(String(v));}

/* Sebar lingkaran secara organik tanpa tumpang-tindih (gaya balon di atas kamera) */
function scatterPositions(n,arenaEl,sizesPx){
  const w=arenaEl.clientWidth||600,h=arenaEl.clientHeight||400;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const pts=[];
  for(let i=0;i<n;i++){
    const r=sizesPx[i]/2;
    let placed=false;
    for(let att=0;att<90&&!placed;att++){
      const x=rnd(w*.2,w*.8),y=rnd(h*.24,h*.72);
      let ok=true;
      for(let j=0;j<pts.length;j++){
        const dx=x-pts[j].x,dy=y-pts[j].y;
        const md=(r+pts[j].r)*1.22+10;
        if(dx*dx+dy*dy<md*md){ok=false;break;}
      }
      if(ok){pts.push({x:x,y:y,r:r});placed=true;}
    }
    if(!placed){
      const lat=[[.3,.32],[.7,.3],[.31,.68],[.69,.7],[.5,.5]];
      const L=lat[i%lat.length];
      pts.push({x:w*L[0],y:h*L[1],r:r});
    }
  }
  return pts.map(p=>({px:clamp(p.x/w*100,10,90),py:clamp(p.y/h*100,14,86)}));
}

function tgtFont(v){
  const L=String(v).length;
  if(L<=6)return 'clamp(18px,3.4vmin,36px)';
  if(L<=12)return 'clamp(14px,2.6vmin,28px)';
  if(L<=18)return 'clamp(12px,2.2vmin,24px)';
  return 'clamp(11px,1.9vmin,20px)';
}
/* Kecilkan font sampai teks muat penuh di dalam lingkaran (anti teks terpotong) */
function fitText(el){
  try{
    let fs=parseFloat(getComputedStyle(el).fontSize);
    if(!isFinite(fs))return;
    let guard=0;
    while(el.scrollWidth>el.clientWidth+1&&fs>9&&guard<10){fs-=1;el.style.fontSize=fs+'px';guard++;}
  }catch(e){}
}

function renderArenas(){
  const arenaIds=G.players.length>1?['ar0','ar1']:['ar0'];
  const opts=G.bsMode?['SALAH','BENAR']:G.q.opts;
  const vmin=Math.min(innerWidth,innerHeight)/100;
  G.targets=[];
  arenaIds.forEach((id,ai)=>{
    const el=document.getElementById(id);
    el.innerHTML='';
    el.classList.remove('frozen');
    const tag=document.createElement('span');
    tag.className='ptag';
    tag.textContent=G.players.length>1?('P'+(ai+1)):'KAMU';
    el.appendChild(tag);
    const sizes=opts.map(v=>{
      if(G.bsMode)return 0;
      let s=vmin*ri(13,16);
      if(isWord(v)&&String(v).length>10)s=vmin*ri(15,18);
      return s;
    });
    const pos=G.bsMode?[{px:50,py:26},{px:50,py:72}]:scatterPositions(opts.length,el,sizes);
    opts.forEach((val,oi)=>{
      const b=document.createElement('button');
      let cls='target';
      if(G.bsMode)cls+=' bsw '+(String(val).toUpperCase()==='BENAR'?'opt-benar':'opt-salah');
      b.className=cls;
      const p=pos[oi];
      b.style.setProperty('--x',p.px.toFixed(1)+'%');
      b.style.setProperty('--y',p.py.toFixed(1)+'%');
      if(G.bsMode){
        b.style.fontSize='clamp(26px,5.6vmin,56px)';
      }else{
        b.style.setProperty('--ts',sizes[oi].toFixed(0)+'px');
        b.style.fontSize=tgtFont(val);
      }
      b.dataset.opt=String(oi);
      b.dataset.arena=String(ai);
      b.innerHTML='<span class="tw">'+esc(val)+'</span><span class="pbar"><i></i></span>';
      el.appendChild(b);
      if(!G.bsMode)fitText(b.querySelector('.tw'));
      G.targets.push({el:b,opt:oi,arena:ai,val:String(val),cx:0,cy:0,rad:0});
    });
  });
  requestAnimationFrame(cacheRects);
}

function cacheRects(){
  for(let i=0;i<G.targets.length;i++){
    const t=G.targets[i];
    const r=t.el.getBoundingClientRect();
    t.cx=r.left+r.width/2;
    t.cy=r.top+r.height/2;
    t.rad=Math.max(r.width,r.height)/2;
  }
}

/* ---- Timer ---- */
function stopTimer(){ if(G.timerInt){clearInterval(G.timerInt);G.timerInt=null;} }
function startTimer(from){
  stopTimer();
  G.timeLeft=(from==null)?cfg.time:from;
  G.lastTick=Math.ceil(G.timeLeft);
  updTimer();
  G.timerInt=setInterval(()=>{
    G.timeLeft-=.1;
    if(G.timeLeft<=0){G.timeLeft=0;updTimer();stopTimer();onTimeout();return;}
    updTimer();
    const s=Math.ceil(G.timeLeft);
    if(s<=5&&s!==G.lastTick){G.lastTick=s;Snd.tick();}
  },100);
}
function updTimer(){
  const c=226.2;
  const f=clamp(G.timeLeft/Math.max(1,cfg.time),0,1);
  const fg=document.getElementById('tr-fg');
  if(fg){fg.style.strokeDashoffset=(c*(1-f)).toFixed(1);fg.style.stroke=G.timeLeft<=5?'#ff5e5e':'#ffffff';}
  const tn=document.getElementById('timenum');
  if(tn)tn.textContent=Math.ceil(G.timeLeft);
}
function onTimeout(){
  if(G.phase!=='ask')return;
  endRound(-1,'time');
}

/* ---- Jawaban ---- */
function commit(p,opt){
  if(G.phase!=='ask')return;
  if(p>=G.players.length||G.locked[p]!=null||G.frozen[p])return;
  const t=G.targets.find(x=>x.arena===p&&x.opt===opt);
  if(!t)return;
  G.locked[p]=opt;
  G.lockAt[p]=performance.now();
  Snd.lock();
  const ok=(opt===G.correct);
  if(ok){
    t.el.classList.add(p===0?'picked-r0':'picked-r1');
    t.el.dataset.mark='✅';
    endRound(p,'ok');
  }else{
    G.frozen[p]=true;
    t.el.classList.add('picked-w');
    t.el.dataset.mark='❌';
    if(G.players[p])G.players[p].streak=0;
    const ar=document.getElementById('ar'+p);
    if(ar)ar.classList.add('frozen');
    Snd.wrong();
    let alive=0;
    for(let i=0;i<G.players.length;i++){if(!G.frozen[i]&&G.locked[i]==null)alive++;}
    if(alive===0)endRound(-1,'all');
  }
}

function endRound(w,reason){
  if(G.phase!=='ask')return;
  G.phase='reveal';
  stopTimer();
  G.targets.forEach(t=>{if(t.opt===G.correct)t.el.classList.add('reveal-ok');});
  const correctT=G.targets.find(t=>t.opt===G.correct);
  const answerTxt=correctT?('Jawaban: '+correctT.val):'';
  if(w>=0&&G.players[w]){
    const pl=G.players[w];
    const speed=Math.ceil(clamp(G.timeLeft,0,cfg.time)/Math.max(1,cfg.time)*5);
    pl.streak++;
    let pts=10+speed;
    let bonus='';
    if(pl.streak>=3){pts+=5;bonus=' 🔥';}
    pl.score+=pts;
    Snd.correct();
    const ar=document.getElementById('ar'+w);
    if(ar){const rr=ar.getBoundingClientRect();FX.burst(rr.left+rr.width/2,rr.top+rr.height/2,80);}
    scoreFloat(w,'+'+pts);
    updateHUD();
    flashCard('🎉 '+pl.name+' +'+pts+'!'+bonus,'#22c55e',2000);
  }else{
    G.players.forEach(p=>p.streak=0);
    updateHUD();
    Snd.sad();
    const msg=(reason==='time')?'⏰ Waktu habis!':'😅 Belum ada yang benar!';
    flashCard(msg+' '+answerTxt,'#ef4444',2300);
  }
  setTimeout(nextRound,(w>=0)?2100:2400);
}

function finishGame(){
  G.phase='over';
  stopTimer();
  stopCamera();
  show('scr-result');
  const ps=G.players.slice().sort((a,b)=>b.score-a.score);
  const tie=G.players.length>1&&ps[0].score===ps[1].score;
  let title;
  if(tie)title='🤝 SERI!';
  else if(G.players.length===1)title='🏁 SELESAI!';
  else title='🏆 '+ps[0].name.toUpperCase()+' MENANG!';
  $('#res-title').textContent=title;
  $('#podium').innerHTML=G.players.map((p,i)=>{
    const win=(!tie&&G.players.length>1&&p.score===ps[0].score);
    const h=clamp(G.players.length===1?110:(46+64*(p.score/Math.max(1,ps[0].score))),36,110);
    return '<div class="ped"><div class="av">'+(win?'🏆':'🧑‍🎓')+'</div>'+
      '<div class="bar b'+i+'" style="height:'+h.toFixed(0)+'px">'+p.score+'</div>'+
      '<div class="plabel">'+esc(p.name)+'</div></div>';
  }).join('');
  let sub;
  if(G.players.length===1){
    const s=G.players[0].score;
    const stars=s>=cfg.rounds*15?'⭐⭐⭐':(s>=cfg.rounds*10?'⭐⭐':'⭐');
    sub='Skor: '+s+'  '+stars;
  }else{
    sub='Skor akhir: '+G.players.map(p=>p.name+' '+p.score).join(' • ');
  }
  $('#res-sub').textContent=sub;
  FX.startRain(tie?3000:6000);
  Snd.fanfare();
}

/* ================= INPUT SENTUH / MOUSE ================= */
function bindArenas(){
  $('#arenas').addEventListener('pointerdown',e=>{
    if(G.phase!=='ask')return;
    const tEl=e.target.closest('.target');
    if(!tEl)return;
    e.preventDefault();
    commit(parseInt(tEl.dataset.arena,10),parseInt(tEl.dataset.opt,10));
  });
  document.addEventListener('contextmenu',e=>{
    if(e.target.closest&&e.target.closest('.target'))e.preventDefault();
  });
}

function hitTarget(x,y,pid){
  let best=null,bd=1e9;
  for(let i=0;i<G.targets.length;i++){
    const t=G.targets[i];
    if(G.players.length>1&&t.arena!==pid)continue;
    const dx=x-t.cx,dy=y-t.cy;
    const d=Math.sqrt(dx*dx+dy*dy);
    if(d<t.rad+22&&d<bd){bd=d;best=t;}
  }
  return best;
}

function setBar(t,p){
  const bar=t.el.querySelector('.pbar i');
  if(bar)bar.style.width=Math.round(clamp(p,0,1)*100)+'%';
}

/* Loop utama: dwell kamera (jam dinding) + confetti */
const DWELL_MS=1100;
function mainLoop(ts){
  requestAnimationFrame(mainLoop);
  FX.step();
  const gameActive=document.getElementById('scr-game').classList.contains('active');
  if(!gameActive||G.phase!=='ask')return;
  const now=performance.now();
  for(let i=0;i<CAM.pointers.length;i++){
    const p=CAM.pointers[i];
    if(now-p.seen>400)continue;
    const t=hitTarget(p.x,p.y,p.pid);
    let D=dwell[p.pid];
    if(!D){D={tid:null,t0:0,prog:0};dwell[p.pid]=D;}
    if(t&&p.pointing){
      if(D.tid!==t){D.tid=t;D.t0=now;}
      D.prog=(now-D.t0)/DWELL_MS;
      setBar(t,clamp(D.prog,0,1));
      if(D.prog>=1){
        D.prog=0;D.tid=null;setBar(t,0);
        commit(p.pid,t.opt);
        if(G.phase!=='ask')break;
      }
    }else{
      if(D.tid){setBar(D.tid,0);D.tid=null;D.prog=0;}
    }
  }
}

/* ================= KAMERA AI — MODE AR FULLSCREEN ================= */
function camTag(t){
  const el=$('#camtag');
  if(!el)return;
  el.textContent=t;
  el.classList.remove('hidden');
}
function camTagHide(){
  const el=$('#camtag');
  if(el)el.classList.add('hidden');
}
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
      CAM.hands.setOptions({maxNumHands:2,modelComplexity:0,minDetectionConfidence:0.55,minTrackingConfidence:0.5});
      CAM.hands.onResults(onHands);
    }
    CAM.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false});
    const v=$('#cam');
    v.srcObject=CAM.stream;
    await v.play();
    CAM.on=true;CAM.loading=false;
    camTag('🤖 AI aktif');
    sizeCamCanvas();
    toast('🤖 Mode AR aktif! Tunjuk lingkaran jawaban dengan telunjuk, tahan sebentar 🎯');
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
      if(now-(CAM.lastSend||0)>=50){ /* throttle ±20fps: hemat CPU di IFP */
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
  for(let i=0;i<lms.length&&i<2;i++){
    const L=lms[i];
    if(!L||!L[8])continue;
    const P=L[8];
    const rawX=ox+(1-P.x)*vw*sc;
    const rawY=oy+P.y*vh*sc;
    const d=(a,b)=>Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
    const pointing=d(L[0],L[8])>d(L[0],L[6])*1.18&&d(L[0],L[8])>d(L[0],L[12])*1.02;
    const pid=(G.players.length>1&&rawX>=sw/2)?1:0;
    let p=null;
    for(let j=0;j<CAM.pointers.length;j++){if(CAM.pointers[j].pid===pid){p=CAM.pointers[j];break;}}
    if(!p){p={pid:pid,x:rawX,y:rawY,seen:0};CAM.pointers.push(p);}
    p.x+=(rawX-p.x)*.45;
    p.y+=(rawY-p.y)*.45;
    p.pointing=pointing;
    p.seen=now;
  }
  CAM.pointers=CAM.pointers.filter(p=>now-p.seen<350);
  updateOverlays();
}
function updateOverlays(){
  /* kursor DOM */
  for(let pid=0;pid<2;pid++){
    const el=document.getElementById('cur'+pid);
    if(!el)continue;
    let p=null;
    for(let j=0;j<CAM.pointers.length;j++){if(CAM.pointers[j].pid===pid){p=CAM.pointers[j];break;}}
    if(!p||!CAM.on){el.classList.add('idle');continue;}
    el.classList.remove('idle');
    el.style.transform='translate('+p.x.toFixed(1)+'px,'+p.y.toFixed(1)+'px)';
  }
  /* titik ujung jari di atas video (gaya AR) */
  const cv=document.getElementById('camov');
  if(!cv)return;
  const cx=cv.getContext('2d');
  if(!cx)return;
  cx.clearRect(0,0,cv.width,cv.height);
  for(const p of CAM.pointers){
    const col=p.pid===0?'255,200,50':'62,193,255';
    cx.beginPath();
    cx.arc(p.x,p.y,16,0,Math.PI*2);
    cx.fillStyle='rgba('+col+',.25)';
    cx.fill();
    cx.beginPath();
    cx.arc(p.x,p.y,7,0,Math.PI*2);
    cx.fillStyle='rgba('+col+',.95)';
    cx.fill();
    cx.lineWidth=3;
    cx.strokeStyle='#fff';
    cx.stroke();
  }
}

/* ================= MODAL BANTUAN & SOAL GURU ================= */
function showHelp(){
  showModal(
    '<h3>❓ Cara Main</h3>'+
    '<ol>'+
    '<li>🎮 Pilih mode: <b>Duel 2 Pemain</b>, <b>Solo Challenge</b>, atau <b>Benar–Salah</b>.</li>'+
    '<li>🤖 <b>Mode Kamera AI (AR)</b>: seluruh layar IFP menjadi cermin kelas 🪞. Lingkaran jawaban melayang di atas video — siswa <b>menunjuk dengan telunjuk</b> dan <b>tahan sampai bar penuh</b> (±1 detik). Titik berwarna = ujung jari terdeteksi AI.</li>'+
    '<li>👆 <b>Mode Sentuh</b>: langsung ketuk / klik lingkaran jawaban. Sama-sama tampil di atas layar.</li>'+
    '<li>⚡ Makin cepat jawab, makin besar poin (+10 s.d. +15). Benar 3× berturut-turut dapat bonus 🔥.</li>'+
    '<li>🖥️ Mode Duel: siswa di <b>kiri layar = P1 (kuning)</b>, <b>kanan layar = P2 (biru)</b>. Lingkaran kuning untuk P1, biru untuk P2.</li>'+
    '</ol>'+
    '<p>💡 <b>Tips:</b> gunakan Chrome/Edge, izinkan kamera, pencahayaan cukup, dan internet saat pertama kali memuat AI. Isi <b>Mata Pelajaran &amp; Kelas</b> di pengaturan agar tampil di banner soal.</p>',
    [{t:'Mengerti! 👍',cls:'b-green'}]
  );
}

function showGuru(){
  showModal(
    '<h3>✏️ Soal Guru (Kustom)</h3>'+
    '<p><b>Soal Kuis</b> — satu soal per baris, pisahkan dengan tanda <code>|</code>:<br><code>Pertanyaan | Jawaban Benar | Salah 1 | Salah 2 | Salah 3</code></p>'+
    '<textarea id="ta-k" placeholder="Contoh: Singkatan dari HTML? | HyperText Markup Language | High Text Machine Language | Hyper Tool Multi Language | Home Tool Markup Language"></textarea>'+
    '<p><b>Soal Benar–Salah</b>:<br><code>Pernyataan | BENAR</code> atau <code>Pernyataan | SALAH</code></p>'+
    '<textarea id="ta-b" placeholder="Contoh: Matahari terbit dari timur | BENAR"></textarea>'+
    '<div class="mrow">'+
    '<button class="btn small b-white" id="ta-close">Tutup</button>'+
    '<button class="btn small b-green" id="ta-save">💾 Simpan</button>'+
    '</div>'
  );
  $('#ta-k').value=LS.get('gb_guru_kuis','');
  $('#ta-b').value=LS.get('gb_guru_bs','');
  $('#ta-save').onclick=()=>{
    LS.set('gb_guru_kuis',$('#ta-k').value);
    LS.set('gb_guru_bs',$('#ta-b').value);
    loadGuruBanks();
    toast('💾 Tersimpan: '+GURU_KUIS.length+' soal kuis, '+GURU_BS.length+' pernyataan benar–salah.');
    closeModal();
  };
  $('#ta-close').onclick=closeModal;
}

/* ================= TOMBOL-TOMBOL ================= */
function toggleFS(){
  try{
    if(document.fullscreenElement)document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }catch(e){toast('Layar penuh tidak didukung di sini');}
}
function goMenu(){
  G.phase='idle';
  stopTimer();
  stopCamera();
  closeModal();
  show('scr-home');
}
function bindButtons(){
  $$('.mode-btn').forEach(b=>{b.onclick=()=>openSetup(b.dataset.mode);});
  $('#btn-back').onclick=()=>{Snd.click();show('scr-home');};
  $('#btn-start').onclick=()=>{Snd.click();startGame();};
  $('#btn-help').onclick=()=>{Snd.click();showHelp();};
  $('#btn-guru').onclick=()=>{Snd.click();showGuru();};
  $('#btn-fs').onclick=toggleFS;
  $('#btn-fs0').onclick=toggleFS;
  $('#btn-snd').onclick=()=>{Snd.on=!Snd.on;$('#btn-snd').textContent=Snd.on?'🔊':'🔇';Snd.click();};
  $('#btn-pause').onclick=()=>{
    if(G.phase!=='ask')return;
    G.pauseLeft=G.timeLeft;
    stopTimer();
    G.phase='pause';
    Snd.click();
    showModal('<h3>⏸ Jeda</h3><p>Game dijeda sementara.</p>',[
      {t:'▶️ Lanjut',cls:'b-green',f:()=>{closeModal();G.phase='ask';startTimer(G.pauseLeft);}},
      {t:'🔁 Ulang Game',cls:'b-orange',f:()=>{closeModal();startGame();}},
      {t:'🏠 Menu',cls:'b-white',f:goMenu}
    ]);
  };
  $('#btn-res-again').onclick=()=>{Snd.click();startGame();};
  $('#btn-res-menu').onclick=()=>{Snd.click();goMenu();};
  addEventListener('resize',()=>{
    if(document.getElementById('scr-game').classList.contains('active')){
      cacheRects();
      sizeCamCanvas();
    }
  });
  addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.getElementById('scr-game').classList.contains('active')&&G.phase==='ask')$('#btn-pause').click();
  });
}

/* ================= BOOT ================= */
function boot(){
  FX.init();
  loadGuruBanks();
  renderSegs();
  bindButtons();
  bindArenas();
  requestAnimationFrame(mainLoop);
  show('scr-home');
}
document.addEventListener('DOMContentLoaded',boot);

/* ekspos untuk debug/pengujian */
window.G=G;window.CFG=cfg;window.__commit=commit;window.__FX=FX;
window.__GB={onHands:onHands,hitTarget:hitTarget,dwell:dwell,Snd:Snd,
  parseKuisTxt:parseKuisTxt,parseBSTxt:parseBSTxt,genMath:genMath,genBSMath:genBSMath,
  slots:scatterPositions,makeOpts:makeOpts,pool:{UMUM:UMUM,BS_UMUM:BS_UMUM},
  updateOverlays:updateOverlays,sizeCamCanvas:sizeCamCanvas};
