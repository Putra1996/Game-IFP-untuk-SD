/* AUDIT KUIS A/B — regresi v2.0+v2.1 (jsdom) */
const {JSDOM}=require('jsdom');
const fs=require('fs');
const html=fs.readFileSync('/home/user/benar-salah/index.html','utf8');
let PASS=0,FAIL=0;
function T(n,k,c){if(k){PASS++;console.log('  ✓ '+n+(c!==undefined?'  ['+String(c).slice(0,90)+']':''));}else{FAIL++;console.log('  ✗ GAGAL: '+n+' ['+String(c).slice(0,90)+']');}}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const w=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/'}).window;
  await sleep(300);const A=w.__AB,d=w.document;
  T('Gerbang→login→setup',d.querySelector('.screen.active').id==='scr-gate'&&A.getPass()==='1234');
  d.getElementById('gate-pass').value='1234';d.getElementById('btn-login').click();
  T('Setup: A•Mulai•B + preset 6 + jenjang 3',!!d.querySelector('.pill.pa')&&d.querySelectorAll('.tpres').length===6&&d.querySelectorAll('#sel-jenjang option').length===3);
  d.getElementById('sel-jenjang').value='SMP';d.getElementById('sel-jenjang').dispatchEvent(new w.Event('change'));
  T('SMP→Kelas 7 otomatis',d.getElementById('sel-kelas').value==='7');
  d.getElementById('sel-mapel').value='Informatika';d.getElementById('btn-muat').click();
  const q=A.QUIZ_REF();
  T('Muat 25 campuran PG+BS',d.getElementById('btn-start').disabled===false&&q.length===25&&q.some(e=>e.tA!=='BENAR')&&q.some(e=>e.tA==='BENAR'));
  T('Item Internet/LAN ada',q.concat(A.parseBank('Informatika')).some(e=>/Internet/.test(e.tA)&&/LAN/.test(e.tB)));
  let bad=0;for(let i=0;i<60;i++){const s=A.genMathQ(1,'2');const ans=+((s.fact.match(/= (\d+)$/)||[0,0])[1]);if(!(s.key==='A'?+s.tA===ans:+s.tB===ans)||+s.tA<0||+s.tB<0||s.tA===s.tB)bad++;}
  T('Matematika PG valid (60 sampel)',bad===0,'rusak='+bad);
  const pl=A.parseLines('Soal A? | Jakarta | Bandung | B | f | 3\nPernyataan Y | B | ft | 1');
  T('parseLines format ganda',pl[0].key==='B'&&pl[1].key==='A'&&pl[1].tA==='BENAR');
  d.getElementById('btn-muat-edit').click();
  d.getElementById('ta-q').value='Soal X? | a | b | B | f | 2\nPernyataan Y | B | ft | 1';
  [...d.querySelectorAll('#modal-root .mrow button')].find(b=>/Simpan/.test(b.textContent)).click();
  const saved=JSON.parse(w.localStorage.getItem('bs_bank_Informatika'));
  T('Editor→LS per mapel',/Soal X\?/.test(saved));
  d.getElementById('btn-muat').click();
  w.CFG.cam=false;d.getElementById('btn-start').click();
  const t0=Date.now();while(Date.now()-t0<6000&&w.S.phase!=='ask')await sleep(50);
  const q1=A.QUIZ_REF()[0];
  T('Label opsi = soal',d.getElementById('lbl-a').textContent===q1.tA&&d.getElementById('lbl-b').textContent===q1.tB);
  T('Chip SOAL/KELAS',d.getElementById('chip-n').textContent==='1'&&/KELAS 7/.test(d.getElementById('chip-kelas').textContent));
  A.answer(q1.key,'tap');
  T('Benar→wash hijau sisi kunci',q1.key==='A'?d.getElementById('washL').className==='wash on':d.getElementById('washR').className==='wash on');
  T('Pill JAWABAN',d.getElementById('ans-pill').classList.contains('show'));
  await sleep(2400);
  w.CFG.time=1;w.S.timeLeft=1;
  const t2=Date.now();while(Date.now()-t2<6000&&w.S.phase==='ask')await sleep(100);
  T('Timeout→jawaban otomatis',/WAKTU HABIS/.test(d.getElementById('flash-big').textContent));
  await sleep(2400);
  let g=0;while(g++<120){if(d.querySelector('.screen.active').id==='res')break;if(w.S.phase==='ask')A.answer('A');await sleep(2400);}
  T('25 soal→hasil',d.querySelector('.screen.active').id==='res');
  d.getElementById('btn-again').click();
  const t3=Date.now();while(Date.now()-t3<6000&&w.S.phase!=='ask')await sleep(60);
  T('Main Lagi OK',w.S.phase==='ask');
  console.log('REGRESI A/B: '+PASS+' LULUS, '+FAIL+' GAGAL');
  process.exit(FAIL?1:0);
})().catch(e=>{console.error('FATAL:',e);process.exit(1);});
