'use strict';
/* ================= STATE ================= */
const CFG={jenjang:'SD',mapel:'Bahasa Indonesia',kelas:'1',level:'2',time:10,cam:true,count:25};
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

/* ================= GERBANG & SETUP ================= */
function getPass(){return LS.get('bs_pass','1234');}
function checkPass(p){return String(p)===String(getPass());}
function tryLogin(){
  const v=$('#gate-pass').value;
  if(checkPass(v)){try{sessionStorage.setItem('bs_auth','1');}catch(e){}Snd.correct();openSetup();}
  else{Snd.wrong();const c=$('.gate-card');if(c){c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake');}toast('\u274c Password salah \u2014 coba lagi.');}
}
function fillKelasOpts(){
  const rng=CFG.jenjang==='SD'?[1,2,3,4,5,6]:(CFG.jenjang==='SMP'?[7,8,9]:[10,11,12]);
  if(!rng.includes(+CFG.kelas))CFG.kelas=String(rng[0]);
  $('#sel-kelas').innerHTML=rng.map(k=>'<option value="'+k+'"'+(String(CFG.kelas)===String(k)?' selected':'')+'>Kelas '+k+'</option>').join('');
}
function fillSetup(){
  $('#sel-jenjang').value=CFG.jenjang;
  fillKelasOpts();
  $('#sel-mapel').innerHTML=MAPEL_LIST.map(m=>'<option'+(m===CFG.mapel?' selected':'')+'>'+m+'</option>').join('');
  $('#sel-level').value=CFG.level;
  $('#tval').textContent=CFG.time;
  $$('.tpres').forEach(b=>b.classList.toggle('on',+b.dataset.t===CFG.time));
  const cc=$('#btn-cam-chip');
  cc.classList.toggle('on',CFG.cam);
  cc.textContent=CFG.cam?'\ud83d\udcf7 Kamera aktif':'\ud83d\udcf7 Kamera mati';
}
function openSetup(){fillSetup();show('scr-setup');}
function updateTime(dv){
  CFG.time=clamp(CFG.time+dv,5,120);
  $('#tval').textContent=CFG.time;
  $$('.tpres').forEach(b=>b.classList.toggle('on',+b.dataset.t===CFG.time));
  updHomeInfo();
}
function updHomeInfo(){
  $('#home-info').textContent=(S.loaded?QUIZ.length:25)+' soal siap dimainkan, '+CFG.time+' detik per soal.';
}
function readSetup(){
  CFG.jenjang=$('#sel-jenjang').value;
  CFG.kelas=$('#sel-kelas').value;
  CFG.mapel=$('#sel-mapel').value;
  CFG.level=$('#sel-level').value;
}
function loadQuiz(openEditor){
  readSetup();
  QUIZ=composeQuiz(CFG.mapel,+CFG.level,CFG.kelas,CFG.count);
  S.loaded=true;
  $('#btn-start').disabled=false;
  $('#load-note').textContent='\u2705 '+QUIZ.length+' soal '+CFG.mapel+' (Kelas '+CFG.kelas+', tingkat '+$('#sel-level').selectedOptions[0].text.toLowerCase()+') siap. Soal tetap bisa diedit.';
  updHomeInfo();
  if(openEditor)openEditorModal(false);
  else Snd.correct();
  return QUIZ.length;
}
function openEditorModal(saveAfter){
  const bank=QUIZ.length?QUIZ:composeQuiz(CFG.mapel,+CFG.level,CFG.kelas,CFG.count);
  showModal('<h3>\u270f\ufe0f Edit Soal \u2014 '+esc(CFG.mapel)+'</h3>'+
    '<p>Format per baris:<br>\u2022 Pilihan ganda: <code>Soal | Pilihan A | Pilihan B | Kunci (A/B) | Fakta | Level</code><br>\u2022 Benar-Salah: <code>Pernyataan | B atau S | Fakta | Level 1-3</code></p>'+
    '<textarea id="ta-q" class="inp" rows="12"></textarea>',
    [{t:'Batal',cls:'b-ghost'},
     {t:'\ud83d\udcbe Simpan & Pakai',cls:'b-green',f:()=>{
       const list=parseLines($('#ta-q').value);
       if(!list.length){toast('\u26a0\ufe0f Format belum benar \u2014 lihat contoh di atas.');return;}
       QUIZ=list;S.loaded=true;
       LS.set('bs_bank_'+CFG.mapel,$('#ta-q').value);
       $('#btn-start').disabled=false;
       $('#load-note').textContent='\u2705 '+QUIZ.length+' soal hasil editan siap dimainkan.';
       updHomeInfo();
       closeModal();
       toast('\ud83d\udcbe '+QUIZ.length+' soal tersimpan untuk '+CFG.mapel+'.');
     }}]);
  $('#ta-q').value=bankToLines(bank);
}

/* ================= SETUP ================= */
/* ================= GAME ================= */
function startQuiz(){
  if(!QUIZ.length){toast('Klik "Muat soal ini" dulu!');return;}
  qi=0;ok=0;bad=0;streak=0;bestStreak=0;
  S.phase='idle';
  closeModal();
  $('#chip-mapel').textContent='KUIS BENAR-SALAH';
  $('#chip-kelas').textContent='KELAS '+CFG.kelas;
  show('scr-game');
  if(CFG.cam)enableCamera();else stopCamera(true);
  nextQuestion();
}
function stopTimer(){if(S.timerInt){clearInterval(S.timerInt);S.timerInt=null;}}
function nextQuestion(){
  if(qi>=QUIZ.length){finishQuiz();return;}
  S.phase='ask';
  qi++;
  $('#chip-n').textContent=qi;
  const q=QUIZ[qi-1];
  $('#qtext').textContent=q.text;
  $('#lbl-a').textContent=q.tA||'BENAR';
  $('#lbl-b').textContent=q.tB||'SALAH';
  $('#washL').className='wash';$('#washR').className='wash';
  $('#ans-pill').classList.remove('show');
  $('#flash').className='';$('#flash').classList.remove('show');
  $('#pbar-i').style.width=Math.round((qi-1)/QUIZ.length*100)+'%';
  $$('.zone .pr rect').forEach(r=>{r.style.strokeDashoffset=320;});
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
  if(k==='A')return {left:0,top:0,right:innerWidth/2,bottom:innerHeight,el:$('#zone-a')};
  return {left:innerWidth/2,top:0,right:innerWidth,bottom:innerHeight,el:$('#zone-b')};
}
function answer(k){
  if(S.phase!=='ask')return;
  S.phase='reveal';
  stopTimer();
  const q=QUIZ[qi-1];
  const K=q.key||'A';
  const pill=$('#ans-pill');
  $('#ans-k').textContent='JAWABAN: '+K;
  $('#ans-t').textContent=(K==='A'?q.tA:q.tB)+(q.fact?' \u2022 '+q.fact:'');
  pill.classList.add('show');
  const wl=$('#washL'),wr=$('#washR');
  if(k==null){ /* waktu habis → jawaban tampil otomatis */
    bad++;streak=0;Snd.sad();
    wl.className='wash on'+(K==='A'?'':' r');
    wr.className='wash on'+(K==='B'?'':' r');
    flash(false,'\u23f0 WAKTU HABIS!','Jawaban benar: '+K);
  }else{
    const isRight=(k===K);
    if(isRight){
      ok++;streak++;bestStreak=Math.max(bestStreak,streak);
      $('#gchip-v').textContent=ok;
      Snd.correct();
      if(K==='A')wl.className='wash on';else wr.className='wash on';
      flash(true,'BENAR! \ud83c\udf89'+(streak>=3?' \ud83d\udd25\u00d7'+streak:''),q.fact||('Jawaban: '+K));
      const r=zoneRect(K);
      FX.burst((r.left+r.right)/2,(r.top+r.bottom)/2,70);
    }else{
      bad++;streak=0;Snd.wrong();
      wl.className='wash on'+(K==='A'?'':' r');
      wr.className='wash on'+(K==='B'?'':' r');
      flash(false,'BELUM TEPAT \ud83d\ude05','Jawaban benar: '+K+(q.fact?' \u2014 '+q.fact:''));
    }
  }
  setTimeout(()=>{
    $('#flash').className='';$('#flash').classList.remove('show');
    pill.classList.remove('show');
    nextQuestion();
  },2200);
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
  $('#pbar-i').style.width='100%';
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
    if(h._k&&h._k!==k){const old=$( '#zone-'+h._k.toLowerCase()).querySelector('rect');if(old)old.style.strokeDashoffset=320;h._k=null;}
    const z=$('#zone-'+k.toLowerCase());
    const rect=z.querySelector('rect');
    if(h._k!==k){h._k=k;h._dwStart=now;}
    const prog=(now-h._dwStart)/DWELL_MS;
    if(rect)rect.style.strokeDashoffset=String(320*(1-clamp(prog,0,1)));
    if(prog>=1){h._k=null;if(rect)rect.style.strokeDashoffset=320;answer(k);}
  });
}

/* ================= HELP & BOOT ================= */
function showHelp(){
  showModal('<h3>\u2753 Cara Main</h3><ol>'+
    '<li>\ud83d\udd10 Masukkan password (default <b>1234</b>, bisa diganti lewat chip \ud83d\udd11).</li>'+
    '<li>\ud83d\udcda Pilih jenjang, kelas, mapel &amp; tingkat \u2192 <b>Muat soal ini</b> (25 soal otomatis, tetap bisa \u270f\ufe0f diedit) \u2192 <b>Mulai kuis</b>.</li>'+
    '<li>\ud83e\udd16 Kamera aktif: kelas tampil di layar; siswa sisi <b>A (kiri)</b> atau <b>B (kanan)</b> menunjuk/diangkat, tahan \u00b10,8 detik. Tanpa kamera: ketuk sisi.</li>'+
    '<li>\u23f1\ufe0f Saat waktu habis, <b>jawaban tampil otomatis</b>: sisi benar <b>hijau</b>, sisi salah <b>merah</b>.</li>'+
    '<li>\ud83c\udfc6 Siswa yang memilih benar terus sampai soal habis adalah juaranya!</li>'+
    '</ol><p>\ud83d\udca1 Butuh Chrome/Edge + izin kamera; internet saat pertama memuat AI. Soal guru bisa diedit di \u270f\ufe0f Edit soal.</p>',
    [{t:'Siap! \ud83c\udfaf',cls:'b-green'}]);
}
function toggleFS(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen();}catch(e){toast('Layar penuh tidak didukung');}}
function goHome(){stopTimer();S.phase='idle';stopCamera(true);closeModal();openSetup();}
function bind(){
  $('#btn-login').onclick=()=>{Snd.click();tryLogin();};
  $('#gate-pass').addEventListener('keydown',e=>{if(e.key==='Enter')tryLogin();});
  $('#btn-eye').onclick=()=>{const i=$('#gate-pass');i.type=i.type==='password'?'text':'password';};
  $('#btn-pass').onclick=()=>{Snd.click();
    showModal('<h3>\ud83d\udd11 Password Aplikasi</h3><p>Ganti password pembuka aplikasi (tersimpan di perangkat ini).</p><input id="np-pass" class="inp" style="text-align:center" autocomplete="off">',
      [{t:'Batal',cls:'b-ghost'},
       {t:'\ud83d\udcbe Simpan',cls:'b-green',f:()=>{
         const v=$('#np-pass').value.trim();
         if(v.length<3){toast('\u26a0\ufe0f Password minimal 3 karakter.');return;}
         LS.set('bs_pass',v);toast('\ud83d\udd11 Password tersimpan.');
       }}]);
    $('#np-pass').value=getPass();
  };
  $('#btn-help').onclick=()=>{Snd.click();showHelp();};
  $('#t-minus').onclick=()=>{Snd.click();updateTime(-5);};
  $('#t-plus').onclick=()=>{Snd.click();updateTime(5);};
  $$('.tpres').forEach(b=>b.onclick=()=>{Snd.click();CFG.time=+b.dataset.t;$('#tval').textContent=CFG.time;$$('.tpres').forEach(x=>x.classList.toggle('on',+x.dataset.t===CFG.time));updHomeInfo();});
  $('#sel-jenjang').onchange=()=>{CFG.jenjang=$('#sel-jenjang').value;fillKelasOpts();$('#btn-start').disabled=true;$('#load-note').textContent='';};
  $('#sel-kelas').onchange=()=>{CFG.kelas=$('#sel-kelas').value;$('#btn-start').disabled=true;$('#load-note').textContent='';};
  $('#sel-mapel').onchange=()=>{CFG.mapel=$('#sel-mapel').value;$('#btn-start').disabled=true;$('#load-note').textContent='';};
  $('#sel-level').onchange=()=>{CFG.level=$('#sel-level').value;$('#btn-start').disabled=true;$('#load-note').textContent='';};
  $('#btn-cam-chip').onclick=()=>{Snd.click();CFG.cam=!CFG.cam;fillSetup();};
  $('#btn-muat').onclick=()=>{Snd.click();loadQuiz(false);};
  $('#btn-muat-edit').onclick=()=>{Snd.click();loadQuiz(true);};
  $('#btn-edit-soal').onclick=()=>{Snd.click();if(!QUIZ.length){toast('Muat soal dulu.');return;}openEditorModal(false);};
  $('#btn-start').onclick=()=>{Snd.click();startQuiz();};
  $('#btn-again').onclick=()=>{Snd.click();startQuiz();};
  $('#btn-menu').onclick=()=>{Snd.click();goHome();};
  $('#btn-home').onclick=()=>{Snd.click();
    if(S.phase==='ask'||S.phase==='pause'){
      S.phase='pause';stopTimer();
      showModal('<h3>\ud83c\udfe0 Kembali ke Menu?</h3><p>Kuis berjalan akan dihentikan.</p>',
        [{t:'\ud83c\udfe0 Ya, ke Menu',cls:'b-ghost',f:goHome},
         {t:'\u25b6\ufe0f Lanjut Kuis',cls:'b-green',f:()=>{closeModal();S.phase='ask';S.timeLeft=S.timeLeft||CFG.time;nextTickResume();}}]);
    }else goHome();
  };
  $('#btn-fs').onclick=toggleFS;
  $('#btn-snd').onclick=()=>{Snd.on=!Snd.on;$('#btn-snd').textContent=Snd.on?'\ud83d\udd0a':'\ud83d\udd07';Snd.click();};
  ['a','b'].forEach(k=>{
    $('#zone-'+k).addEventListener('pointerdown',e=>{e.preventDefault();answer(k.toUpperCase());});
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
  let authed=false;try{authed=sessionStorage.getItem('bs_auth')==='1';}catch(e){}
  if(authed)openSetup();else show('scr-gate');
}
document.addEventListener('DOMContentLoaded',boot);

/* ================= HOOK UJI ================= */
window.S=S;window.CFG=CFG;
window.__AB={
  composeQuiz,parseBank,genMathQ,parseLines,bankToLines,loadQuiz,startQuiz,answer,nextQuestion,
  finishQuiz,openSetup,openEditorModal,zoneRect,flash,BANK,MAPEL_LIST,QUIZ_REF:()=>QUIZ,
  getStats:()=>({qi,ok,bad,streak,bestStreak}),Snd,FX,onHands,handsLive,DWELL_MS,updHomeInfo,
  checkPass,getPass,tryLogin,fillSetup,fillKelasOpts,readSetup
};
