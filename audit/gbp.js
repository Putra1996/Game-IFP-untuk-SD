/* AUDIT GESTURE BATTLE PRO (jsdom) — fokus bug pil setup + regresi gameplay */
const {JSDOM}=require('jsdom');
const fs=require('fs');
const html=fs.readFileSync('/home/user/gesture-battle-pro/index.html','utf8');
let PASS=0,FAIL=0;
function T(n,k,c){if(k){PASS++;console.log('  ✓ '+n+(c!==undefined?'  ['+String(c).slice(0,100)+']':''));}else{FAIL++;console.log('  ✗ GAGAL: '+n+' ['+(c===undefined?'-':String(c)).slice(0,100)+']');}}
function mk(){return new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/'});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
/* A. PIL SETUP (bug dilaporkan user) */
{
  const w=mk().window,d=w.document;await sleep(300);
  const A=w.__GBP;
  T('Beranda → buka setup duel',(()=>{[...d.querySelectorAll('button')].find(b=>/duel/i.test(b.textContent))?.click();return d.querySelector('.screen.active').id==='scr-setup';})());
  const cat=[...d.querySelectorAll('#seg-cat .chip')];
  T('Pil kategori BERLABEL: Campur/Umum/Matematika/Soal Guru',cat.length===4&&cat.map(b=>b.textContent).join('|')==='🎲 Campur|📚 Umum|🔢 Matematika|✏️ Soal Guru',cat.map(b=>b.textContent).join('|'));
  T('Pil kategori: "Campur" aktif default',cat[0].classList.contains('on')&&!cat[1].classList.contains('on'));
  const rnd=[...d.querySelectorAll('#seg-rounds .chip')],tm=[...d.querySelectorAll('#seg-time .chip')],inp=[...d.querySelectorAll('#seg-input .chip')];
  T('Pil jumlah soal 5/10/15 berlabel',rnd.map(b=>b.textContent).join('|')==='5 soal|10 soal|15 soal',rnd.map(b=>b.textContent).join('|'));
  T('Pil detik 15/20/30 berlabel',tm.map(b=>b.textContent).join('|')==='15 dtk|20 dtk|30 dtk');
  T('Pil mode input Kamera/Sentuh berlabel',inp.map(b=>b.textContent).join('|')==='🤖 Kamera AI|👆 Sentuh');
  /* klik Matematika → cfg berubah & aktif pindah (dulu: cfg jadi undefined) */
  cat[2].click();
  T('Klik Matematika → cfg.category="matematika"',w.CFG.category==='matematika',w.CFG.category);
  const cat2=[...d.querySelectorAll('#seg-cat .chip')];
  T('Status aktif pindah ke Matematika',cat2[2].classList.contains('on')&&!cat2[0].classList.contains('on'));
  rnd[0].click();tm[2].click();inp[1].click();
  T('Klik 5 soal/30 dtk/Sentuh → cfg tersimpan benar',w.CFG.rounds===5&&w.CFG.time===30&&w.CFG.input==='touch',[w.CFG.rounds,w.CFG.time,w.CFG.input].join('|'));
  /* persist ke LS */
  T('LS gbp_cfg tersimpan setelah mulai',(()=>{w.__GBP.startGame();return JSON.parse(w.localStorage.getItem('gbp_cfg')).category==='matematika';})());
  w.close();
}
/* B. ALUR GAME: matematika, pop benar/salah, waktu habis, hasil */
{
  const w=mk().window,d=w.document;await sleep(300);
  const A=w.__GBP;
  [...d.querySelectorAll('button')].find(b=>/duel/i.test(b.textContent)).click();
  [...d.querySelectorAll('#seg-cat .chip')][2].click();
  w.CFG.input='touch';
  A.startGame();
  const t0=Date.now();while(Date.now()-t0<5000&&w.G.phase!=='ask')await sleep(40);
  T('Game fase ask dgn kartu soal matematika',w.G.phase==='ask'&&/\d+\s*[+\u2212\u00d7]\s*\d+\s*=/.test(d.getElementById('qtext').textContent),d.getElementById('qtext').textContent);
  T('Skor kiri = nama Tim Kiri',/TIM KIRI/.test(d.getElementById('sc-l-lbl').textContent));
  /* pop benar: bubble nilai benar */
  const q=w.G.q;
  const bub=w.G.bubbles.find(b=>b.opt===w.G.correct)||w.G.bubbles[0];
  const before=w.G.players[0].score;
  A.popBubble(bub,0);
  T('Pop nilai benar → skor kiri naik',w.G.players[0].score>before,w.G.players[0].score+' vs '+before);
  const tR=Date.now();while(Date.now()-tR<6000&&w.G.phase!=='ask')await sleep(50);
  T('Fase reveal → lanjut ask',w.G.phase==='ask',w.G.phase);
  /* pop salah */
  const q2=w.G.q;
  const wrong=w.G.bubbles.find(b=>b.opt!==w.G.correct);
  A.popBubble(wrong,1);
  T('Pop nilai salah → tim kanan BEKU (frozen)',w.G.players[1].frozenUntil>Date.now());
  const t2=Date.now();while(Date.now()-t2<6000&&w.G.phase!=='ask'&&w.G.phase!=='over')await sleep(50);
  /* habiskan sisa via nextRound */
  let g=0;
  while(g++<80&&d.querySelector('.screen.active').id!=='res'){
    if(w.G.phase==='ask'){A.timeUp();}
    await sleep(2600);
  }
  T('Semua ronde selesai → layar hasil',d.querySelector('.screen.active').id==='res');
  d.getElementById('btn-again').click();
  T('Main lagi → kembali ke setup',d.querySelector('.screen.active').id==='scr-setup');
  w.close();
}
/* C. SOAL GURU: kosong ditolak, terisi jalan */
{
  const w=mk().window,d=w.document;await sleep(300);
  const A=w.__GBP;
  [...d.querySelectorAll('button')].find(b=>/duel/i.test(b.textContent)).click();
  [...d.querySelectorAll('#seg-cat .chip')][3].click();
  A.startGame();
  T('Soal guru KOSONG → mulai ditolak + toast',d.querySelector('.screen.active').id==='scr-setup'&&/Soal guru kosong/.test(d.getElementById('toast').textContent));
  /* isi bank guru via editor LS (format kuis guru) */
  w.localStorage.setItem('gb_guru_kuis',JSON.stringify(['Ibu kota Indonesia? | Jakarta | Bandung | Surabaya']));
  A.loadGuruBanks();
  A.startGame();
  const t0=Date.now();while(Date.now()-t0<5000&&w.G.phase!=='ask')await sleep(40);
  T('Soal guru terisi → soal tampil',w.G.phase==='ask'&&/Ibu kota Indonesia/.test(d.getElementById('qtext').textContent),d.getElementById('qtext').textContent);
  T('Opsi berisi jawaban benar',w.G.bubbles.some(b=>b.val==='Jakarta'));
  w.close();
}
/* D. SOLO: skor kanan SOLO */
{
  const w=mk().window,d=w.document;await sleep(300);
  const A=w.__GBP;
  [...d.querySelectorAll('button')].find(b=>/solo/i.test(b.textContent)).click();
  T('Solo: panel pemain 2 disembunyikan',d.getElementById('wrap-p2').style.display==='none');
  w.CFG.input='touch';A.startGame();
  const tS=Date.now();while(Date.now()-tS<8000&&w.G.phase!=='ask')await sleep(60);
  T('Solo jalan: label SOLO + fase ask',/SOLO/.test(d.getElementById('sc-r-lbl').textContent)&&w.G.phase==='ask',w.G.phase);
  w.close();
}
console.log('\nAUDIT GBP: '+PASS+' LULUS, '+FAIL+' GAGAL');
process.exit(FAIL?1:0);
})().catch(e=>{console.error('FATAL:',e);process.exit(1);});
