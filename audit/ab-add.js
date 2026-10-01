/* AUDIT KUIS A/B — tambahan v2.1: jawaban turun, kecepatan, ring (jsdom) */
const {JSDOM}=require('jsdom');
const fs=require('fs');
const html=fs.readFileSync('/home/user/benar-salah/index.html','utf8');
let PASS=0,FAIL=0;
function T(n,k,c){if(k){PASS++;console.log('  ✓ '+n);}else{FAIL++;console.log('  ✗ GAGAL: '+n+' ['+String(c).slice(0,90)+']');}}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const w=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/'}).window;
  await sleep(300);
  const A=w.__AB,d=w.document;
  T('FALLS 3 kecepatan',A.FALLS.santai===4200&&A.FALLS.sedang===2400&&A.FALLS.cepat===1200);
  T('CFG.fall default sedang & select tersedia',w.CFG.fall==='sedang'&&d.getElementById('sel-fall')&&d.querySelectorAll('#sel-fall option').length===3);
  d.getElementById('gate-pass').value='1234';d.getElementById('btn-login').click();
  d.getElementById('sel-mapel').value='IPA';
  d.getElementById('btn-muat').click();
  d.getElementById('btn-start').click();
  const t0=Date.now();while(Date.now()-t0<6000&&w.S.phase!=='ask')await sleep(50);
  T('Game ask',w.S.phase==='ask');
  const za=d.getElementById('zwrap-a'),zb=d.getElementById('zwrap-b');
  T('Awal soal: zwrap di atas (-76vh) & transparan',za.style.transform==='translateY(-76vh)'&&za.style.opacity==='0');
  await sleep(200);
  T('Transisi durasi sedang (2400ms) → translateY(0)',za.style.transition.includes('2400ms')&&za.style.transform==='translateY(0)'&&zb.style.opacity==='1');
  d.getElementById('sel-fall').value='cepat';w.CFG.fall='cepat';
  A.nextQuestion();
  await sleep(150);
  T('Kecepatan cepat (1200ms) dipakai',za.style.transition.includes('1200ms'));
  const k=A.QUIZ_REF()[0].key;
  A.answer(k==='A'?'A':'B','tap');
  T('spawnRing: .hitring muncul',!!d.querySelector('.hitring'));
  await sleep(900);
  T('Ring dibuang setelah 0,7 dtk',!d.querySelector('.hitring'));
  await sleep(2200);
  const t2=Date.now();while(Date.now()-t2<6000&&w.S.phase!=='ask')await sleep(60);
  A.answer('A','hand');
  T('answer(k,"hand") jalan',w.S.phase==='reveal');
  console.log('TAMBAHAN A/B v2.1: '+PASS+' LULUS, '+FAIL+' GAGAL');
  process.exit(FAIL?1:0);
})().catch(e=>{console.error('FATAL:',e);process.exit(1);});
