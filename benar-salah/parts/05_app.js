'use strict';
/* ================= STATE ================= */
const CFG={mapel:'Bahasa Indonesia',kelas:'1',level:'2',time:10,input:'auto',count:25};
let QUIZ=[],qi=0,ok=0,bad=0,streak=0,bestStreak=0;
const S={phase:'idle',loaded:false,timeLeft:0,timerInt:null,lastTick:-1};
const CAM={on:false,loading:false,hands:null,stream:null,busy:false,lastSend:0,ai:null};
const handsLive=[];   /* [{x,y,team,seen,zone,dwStart}] team0→zona kiri(A), team1→kanan(B) */
const DWELL_MS=800;

/* ================= NAV ================= */
function show(id){$$('.screen').forEach(s=>s.classList.remove('active'));const el=document.getElementById(id);if(el)el.classList.add('active');}
let toastT;
function toast(m,ms){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),ms||2400);}
function showModal(html,btns){
  const root=$('#modal-root');
  root.innerHTML='<div class="modal">'+html+'<div class="mrow"></div></div>';
  const row=root.querySelector('.mrow');
  (btns||[]).forEach(b=>{
    const bt=document.createElement('button');
    bt.className='btn small '+(b.cls||'b-green');bt.textContent=b.t;
    bt.onclick=()=>{Snd.click();if(b.f)b.f();else closeModal();};
    row.appendChild(bt);
  });
  root.classList.add('open');
}
function closeModal(){$('#modal-root').classList.remove('open');}

/* ================= SETUP ================= */
function fillSetup(){
  const sm=$('#sel-mapel');
  sm.innerHTML=MAPEL_LIST.map(m=>'<option'+(m===CFG.mapel?' selected':'')+'>'+m+'</option>').join('');
  const kl=['1','2','3','4','5','6'].map(k=>'<option value="'+k+'"'+(String(CFG.kelas)===k?' selected':'')+'>Kelas '+k+'</option>').join('');
  $('#sel-kelas').innerHTML=kl;
  $('#sel-level').value=CFG.level;
  $('#sel-input').value=CFG.input;
  $('#tval').textContent=CFG.time;
}
function openSetup(){fillSetup();show('scr-setup');}
function updateTime(dv){
  CFG.time=clamp(CFG.time+dv,5,120);
  $('#tval').textContent=CFG.time;
  updHomeInfo();
}
function updHomeInfo(){
  $('#home-info').textContent=(S.loaded?QUIZ.length:25)+' soal siap dimainkan, '+CFG.time+' detik per soal.';
}
/* muat soal */
function loadQuiz(openEditor){
  CFG.mapel=$('#sel-mapel').value;
  CFG.kelas=$('#sel-kelas').value;
  CFG.level=$('#sel-level').value;
  CFG.input=$('#sel-input').value;
  QUIZ=composeQuiz(CFG.mapel,+CFG.level,CFG.kelas,CFG.count);
  S.loaded=true;
  $('#btn-start').disabled=false;
  $('#load-note').textContent='✅ '+QUIZ.length+' soal '+CFG.mapel+' (Kelas '+CFG.kelas+', tingkat '+($('#sel-level').selectedOptions[0].text.toLowerCase())+') siap. Soal tetap bisa diedit.';
  updHomeInfo();
  if(openEditor)openEditorModal(false);
  else Snd.correct();
  return QUIZ.length;
}
function openEditorModal(saveAfter){
  const bank=QUIZ.length?QUIZ:composeQuiz(CFG.mapel,+CFG.level,CFG.kelas,CFG.count);
  showModal('<h3>✏️ Edit Soal — '+esc(CFG.mapel)+'</h3>'+
    '<p>Format per baris: <code>Pernyataan | B atau S | Fakta | Level 1-3</code></p>'+
    '<textarea id="ta-q" class="inp" rows="12"></textarea>',
    [{t:'Batal',cls:'b-ghost'},
     {t:'💾 Simpan & Pakai',cls:'b-green',f:()=>{
       const list=parseLines($('#ta-q').value);
       if(!list.length){toast('⚠️ Format belum benar — minimal "Pernyataan | B/S".');return;}
       QUIZ=list;S.loaded=true;
       LS.set('bs_bank_'+CFG.mapel,$('#ta-q').value);
       $('#btn-start').disabled=false;
       $('#load-note').textContent='✅ '+QUIZ.length+' soal hasil editan siap dimainkan.';
       updHomeInfo();
       closeModal();
       toast('💾 '+QUIZ.length+' soal tersimpan untuk '+CFG.mapel+'.');
     }}]);
  $('#ta-q').value=bankToLines(bank);
}

/* ================= GAME ================= */
function startQuiz(){
  if(!QUIZ.length){toast('Klik "Muat soal ini" dulu!');return;}
  qi=0;ok=0;bad=0;streak=0;bestStreak=0;
  S.phase='idle';
  closeModal();
  $('#chip-mapel').textContent=CFG.mapel.toUpperCase()+' • KELAS '+CFG.kelas;
  show('scr-game');
  if(CFG.input==='auto')enableCamera();else stopCamera(true);
  nextQuestion();
}
function stopTimer(){if(S.timerInt){clearInterval(S.timerInt);S.timerInt=null;}}
function nextQuestion(){
  if(qi>=QUIZ.length){finishQuiz();return;}
  S.phase='ask';
  qi++;
  $('#chip-n').textContent=qi;
  $('#qtext').textContent=QUIZ[qi-1].text;
  $('#zone-a').classList.remove('dimz');$('#zone-b').classList.remove('dimz');
  $$('#zones .zone svg.pr rect').forEach(r=>{r.style.strokeDashoffset=1600;});
  S.timeLeft=CFG.time;S.lastTick=Math.ceil(S.timeLeft);
  updBar();
  stopTimer();
  S.timerInt=setInterval(()=>{
    if(S.phase!=='ask')return;
    S.timeLeft-=.1;
    if(S.timeLeft<=0){S.timeLeft=0;updBar();answer(null);return;}
    updBar();
    const s=Math.ceil(S.timeLeft);
    if(s<=5&&s!==S.lastTick){S.lastTick=s;Snd.tick();}
  },100);
}
function updBar(){
  const f=clamp(S.timeLeft/Math.max(1,CFG.time),0,1);
  const bar=$('#tbar-i');
  if(bar){bar.style.width=Math.round(f*100)+'%';bar.style.background=f<=.3?'var(--b)':'linear-gradient(90deg,var(--green),var(--gold))';}
}
function zoneRect(k){
  const el=$(k==='A'?'#zone-a':'#zone-b');
  const r=el.getBoundingClientRect();
  return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,el:el};
}
function answer(k){
  if(S.phase!=='ask')return;
  S.phase='reveal';
  stopTimer();
  const q=QUIZ[qi-1];
  const correctK=q.ok?'A':'B';
  if(k==null){ /* waktu habis */
    bad++;streak=0;
    Snd.sad();
    flash(false,'⏰ WAKTU HABIS!',('Jawaban benar: zona '+correctK)+(q.fact?' — '+q.fact:''));
    setTimeout(()=>{$('#flash').className='';$('#flash').classList.remove('show');nextQuestion();},1800);
    return;
  }
  const isRight=(k===correctK);
  if(isRight){
    ok++;streak++;bestStreak=Math.max(bestStreak,streak);
    $('#gchip-v').textContent=ok;
    Snd.correct();
    flash(true,'JAWABAN BENAR! 🎉'+(streak>=3?' 🔥×'+streak:''),q.fact||('Jawaban: zona '+correctK));
    const r=zoneRect(correctK);
    FX.burst((r.left+r.right)/2,(r.top+r.bottom)/2,70);
  }else{
    bad++;streak=0;
    Snd.wrong();
    flash(false,'BELUM TEPAT 😅',('Jawaban benar: zona '+correctK)+(q.fact?' — '+q.fact:''));
  }
  setTimeout(()=>{
    $('#flash').className='';$('#flash').classList.remove('show');
    nextQuestion();
  },1800);
}
function flash(good,big,fact){
  const f=$('#flash');
  $('#flash-big').textContent=big;
  $('#flash-fact').textContent=fact;
  f.className=good?'ok':'bad';
  f.classList.add('show');
  if(good&&Math.random()<.7)FX.burst(innerWidth/2,innerHeight/2,40);
}
function finishQuiz(){
  S.phase='over';
  stopTimer();
  stopCamera(true);
  $('#r-ok').textContent=ok;
  $('#r-bad').textContent=bad;
  const total=ok+bad;
  const pct=total?Math.round(ok/total*100):0;
  $('#res-sub').textContent='Skor kelas '+pct+'% • streak terbaik 🔥×'+bestStreak+' • '+CFG.mapel+' • Kelas '+CFG.kelas;
  show('res');
  if(pct>=70){Snd.fanfare();rainNow(3500);}else Snd.go();
}
function rainNow(ms){
  const cv=$('#fx');
  if(!cv)return;
  const cx=cv.getContext('2d');
  const until=Date.now()+ms;
  (function r(){
    if(Date.now()>until)return;
    for(let i=0;i<4;i++){
      const p={x:Math.random()*cv.width,y:-10,vx:(Math.random()-.5)*2,vy:2+Math.random()*3,g:.05,r:2+Math.random()*4,c:pick(['#ffc832','#3ec1ff','#2ecc71','#ff5347']),l:120};
      FX.parts.push(p);
    }
    requestAnimationFrame(r);
  })();
}

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
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('📷 Kamera tidak didukung — ketuk zona A/B langsung.');return;}
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
    camTag('🤖 Kamera aktif — tunjuk A atau B!');
    camLoop();
  }catch(e){
    CAM.loading=false;
    document.body.classList.remove('cam');
    toast('📷 Kamera/AI gagal — ketuk zona A/B langsung.',4000);
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
    if(!L||!L[8])continue;
    const P=L[8];
    const rawX=ox+(1-P.x)*vw*sc;
    const rawY=oy+P.y*vh*sc;
    let h=handsLive[i];
    if(!h){h={x:rawX,y:rawY,seen:0,dwStart:0};handsLive[i]=h;}
    h.x+=(rawX-h.x)*.45;h.y+=(rawY-h.y)*.45;h.seen=now;
  }
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
    const inA=h.y>zoneRect('A').top,inB=h.y>zoneRect('B').top&&!inA;
    const col=inA?'#4d94ff':(inB?'#ff7a6e':'#ffc832');
    cx.beginPath();cx.arc(h.x,h.y,24,0,Math.PI*2);cx.fillStyle=col+'55';cx.fill();
    cx.beginPath();cx.arc(h.x,h.y,10,0,Math.PI*2);cx.fillStyle=col;cx.fill();
    cx.lineWidth=3;cx.strokeStyle='#fff';cx.stroke();
  });
}
function inZone(k,h){
  const r=zoneRect(k);
  return h.x>=r.left-20&&h.x<=r.right+20&&h.y>=r.top-20&&h.y<=r.bottom+20;
}
function dwellStep(now){
  if(S.phase!=='ask')return;
  handsLive.forEach(h=>{
    if(!h)return;
    const k=inZone('A',h)?'A':(inZone('B',h)?'B':null);
    if(!k){h._k=null;return;}
    if(h._k&&h._k!==k){const old=$( '#zone-'+h._k.toLowerCase()).querySelector('rect');if(old)old.style.strokeDashoffset=1600;h._k=null;}
    const z=$('#zone-'+k.toLowerCase());
    const rect=z.querySelector('rect');
    if(h._k!==k){h._k=k;h._dwStart=now;}
    const prog=(now-h._dwStart)/DWELL_MS;
    if(rect)rect.style.strokeDashoffset=String(1600*(1-clamp(prog,0,1)));
    if(prog>=1){h._k=null;if(rect)rect.style.strokeDashoffset=1600;answer(k);}
  });
}

/* ================= HELP & BOOT ================= */
function showHelp(){
  showModal('<h3>❓ Cara Main</h3><ol>'+
    '<li>⚙️ <b>Atur</b>: pilih mapel, kelas, tingkat kesulitan &amp; timer → <b>Muat soal ini</b> (25 soal otomatis, tetap bisa diedit).</li>'+
    '<li>🅰️🅱️ Dua zona raksasa: <b>A = BENAR/SETUJU</b> (biru), <b>B = SALAH/TIDAK SETUJU</b> (merah).</li>'+
    '<li>🤖 <b>Kamera AI</b>: siswa menunjuk zona dengan tangan, <b>tahan ±0,8 detik</b>. 👆 Mode sentuh: ketuk zona.</li>'+
    '<li>💚 Benar → layar <b>hijau</b> + fakta penjelasan. ❤️ Salah → <b>merah</b> + jawaban benar.</li>'+
    '<li>🔥 Benar beruntun = streak! Skor kelas di akhir kuis.</li>'+
    '</ol><p>💡 Butuh Chrome/Edge + izin kamera; internet saat pertama memuat AI. Soal guru bisa diedit di pengaturan.</p>',
    [{t:'Siap! 🎯',cls:'b-green'}]);
}
function toggleFS(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen();}catch(e){toast('Layar penuh tidak didukung');}}
function goHome(){stopTimer();S.phase='idle';stopCamera(true);closeModal();show('scr-home');}
function bind(){
  $('#btn-home-start').onclick=()=>{Snd.click();if(S.loaded)startQuiz();else openSetup();};
  $('#btn-setup').onclick=()=>{Snd.click();openSetup();};
  $('#btn-help').onclick=()=>{Snd.click();showHelp();};
  $('#btn-back').onclick=()=>{Snd.click();show('scr-home');};
  $('#t-minus').onclick=()=>{Snd.click();updateTime(-5);};
  $('#t-plus').onclick=()=>{Snd.click();updateTime(5);};
  $$('.tpres').forEach(b=>b.onclick=()=>{Snd.click();CFG.time=+b.dataset.t;$('#tval').textContent=CFG.time;updHomeInfo();});
  $('#sel-mapel').onchange=()=>{CFG.mapel=$('#sel-mapel').value;$('#btn-start').disabled=true;$('#load-note').textContent='';};
  $('#btn-muat').onclick=()=>{Snd.click();loadQuiz(false);};
  $('#btn-muat-edit').onclick=()=>{Snd.click();loadQuiz(true);};
  $('#btn-edit-soal').onclick=()=>{Snd.click();if(!QUIZ.length){toast('Muat soal dulu.');return;}openEditorModal(false);};
  $('#btn-start').onclick=()=>{Snd.click();startQuiz();};
  $('#btn-again').onclick=()=>{Snd.click();startQuiz();};
  $('#btn-menu').onclick=()=>{Snd.click();goHome();};
  $('#btn-home').onclick=()=>{Snd.click();
    if(S.phase==='ask'||S.phase==='pause'){
      S.phase='pause';stopTimer();
      showModal('<h3>🏠 Kembali ke Menu?</h3><p>Kuis berjalan akan dihentikan.</p>',
        [{t:'🏠 Ya, ke Menu',cls:'b-ghost',f:goHome},
         {t:'▶️ Lanjut Kuis',cls:'b-green',f:()=>{closeModal();S.phase='ask';S.timeLeft=S.timeLeft||CFG.time;nextTickResume();}}]);
    }else goHome();
  };
  $('#btn-fs').onclick=toggleFS;
  $('#btn-snd').onclick=()=>{Snd.on=!Snd.on;$('#btn-snd').textContent=Snd.on?'🔊':'🔇';Snd.click();};
  ['a','b'].forEach(k=>{
    $( '#zone-'+k).addEventListener('pointerdown',e=>{e.preventDefault();answer(k.toUpperCase());});
  });
  addEventListener('resize',()=>{sizeCamCanvas();});
}
function nextTickResume(){
  updBar();
  stopTimer();
  S.timerInt=setInterval(()=>{
    if(S.phase!=='ask')return;
    S.timeLeft-=.1;
    if(S.timeLeft<=0){S.timeLeft=0;updBar();answer(null);return;}
    updBar();
    const s=Math.ceil(S.timeLeft);
    if(s<=5&&s!==S.lastTick){S.lastTick=s;Snd.tick();}
  },100);
}
function fxLoop(){FX.step();requestAnimationFrame(fxLoop);}
function boot(){
  FX.init();
  bind();
  requestAnimationFrame(fxLoop);
  updHomeInfo();
  show('scr-home');
}
document.addEventListener('DOMContentLoaded',boot);

/* ================= HOOK UJI ================= */
window.S=S;window.CFG=CFG;
window.__AB={
  composeQuiz,parseBank,genMathStmt,parseLines,bankToLines,loadQuiz,startQuiz,answer,nextQuestion,
  finishQuiz,openSetup,openEditorModal,zoneRect,flash,BANK,MAPEL_LIST,QUIZ_REF:()=>QUIZ,
  getStats:()=>({qi,ok,bad,streak,bestStreak}),Snd,FX,onHands,handsLive,DWELL_MS,updHomeInfo
};
