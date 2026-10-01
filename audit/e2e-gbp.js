/* E2E GESTURE BATTLE PRO — Chrome: klik pil setup (bug dilaporkan) + kamera fake + pop + FPS */
const puppeteer=require('puppeteer');
const fs=require('fs');
let PASS=0,FAIL=0;
const T=(n,k,c)=>{if(k){PASS++;console.log('  ✓ '+n+(c!==undefined?'  ['+String(c).slice(0,110)+']':''));}else{FAIL++;console.log('  ✗ GAGAL: '+n+' ['+(c===undefined?'-':JSON.stringify(c)).slice(0,120)+']');}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--window-size=960,620']});
  const page=await browser.newPage();
  await page.setViewport({width:960,height:620});
  const errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120));});
  fs.mkdirSync('/tmp/shots-gbp',{recursive:true});
  await page.goto('file:///home/user/gesture-battle-pro/index.html');
  await sleep(1000);
  /* buka setup duel */
  await page.evaluate(()=>{[...document.querySelectorAll('button')].find(b=>/duel/i.test(b.textContent)).click();});
  await page.waitForSelector('#scr-setup.active',{timeout:3000});
  await sleep(300);
  await page.screenshot({path:'/tmp/shots-gbp/01-setup.png'});
  /* PIL KATEGORI: label terlihat & bisa diklik */
  const labels=await page.$$eval('#seg-cat .chip',els=>els.map(e=>e.textContent));
  T('Pil kategori berlabel (Campur/Umum/Matematika/Soal Guru)',labels.join('|')==='🎲 Campur|📚 Umum|🔢 Matematika|✏️ Soal Guru',labels.join('|'));
  await page.evaluate(()=>{[...document.querySelectorAll('#seg-cat .chip')].find(b=>/Matematika/.test(b.textContent)).click();});
  T('Klik 🔢 Matematika → terpilih (cfg)',await page.evaluate(()=>window.CFG.category==='matematika'));
  T('Pil jadi aktif (class on)',await page.evaluate(()=>[...document.querySelectorAll('#seg-cat .chip')][2].classList.contains('on')));
  await page.evaluate(()=>{[...document.querySelectorAll('#seg-rounds .chip')].find(b=>/10 soal/.test(b.textContent)).click();});
  await page.evaluate(()=>{[...document.querySelectorAll('#seg-time .chip')].find(b=>/20 dtk/.test(b.textContent)).click();});
  await page.evaluate(()=>{[...document.querySelectorAll('#seg-input .chip')].find(b=>/Kamera/.test(b.textContent)).click();});
  T('Jumlah/detik/mode terpilih (10/20/kamera)',await page.evaluate(()=>window.CFG.rounds===10&&window.CFG.time===20&&window.CFG.input==='auto'));
  await page.evaluate(()=>{document.getElementById('in-p1').value='Tim Kiri';document.getElementById('in-p2').value='Tim Kanan';});
  await page.evaluate(()=>document.getElementById('btn-start').click());
  await page.waitForSelector('#scr-game.active',{timeout:4000});
  /* kamera fake */
  let camOk=false,tag='';
  for(let i=0;i<24;i++){tag=await page.evaluate(()=>{const t=document.getElementById('camtag');return t?t.textContent:'';});if(/aktif|Kamera/.test(tag)&&!/Memuat/.test(tag)){camOk=true;break;}await sleep(500);}
  T('Kamera fake aktif (AI termuat)',camOk,tag);
  await page.waitForFunction("G.phase==='ask'",{timeout:15000});
  const round=await page.evaluate(()=>document.getElementById('chip-soal').textContent);
  T('Chip "Soal 1 / 10" tampil (sebelum pop)',/Soal 1\s*\/\s*10/.test(round),round);
  /* pop gelembung BENAR via pointerdown asli */
  const popped=await page.evaluate(()=>new Promise(res=>{
    const b=G.bubbles.find(x=>x.opt===G.correct);
    const r=b.el.getBoundingClientRect();
    b.el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));
    setTimeout(()=>res(G.players[0].score),500);
  }));
  T('Pop gelembung benar → skor tim kiri naik',popped>0,popped);
  await page.screenshot({path:'/tmp/shots-gbp/02-game-kamera.png'});
  /* selesai cepat via timeUp → hasil → main lagi → setup */
  const fin=await page.evaluate(()=>new Promise(res=>{
    const iv=setInterval(()=>{
      if(document.querySelector('.screen.active').id==='res'){clearInterval(iv);res('done');return;}
      if(G.phase==='ask')window.__GBP.timeUp();
    },2600);
    setTimeout(()=>{clearInterval(iv);res('timeout');},120000);
  }));
  T('10 ronde → layar hasil',fin==='done',fin);
  await page.screenshot({path:'/tmp/shots-gbp/03-hasil.png'});
  await page.evaluate(()=>{[...document.querySelectorAll('#res button')].find(b=>/lagi/i.test(b.textContent)).click();});
  await page.waitForSelector('#scr-setup.active',{timeout:3000});
  T('"Main lagi" → kembali ke setup',true);
  /* MODE SENTUH: ukur FPS UI tanpa beban AI */
  await page.evaluate(()=>{[...document.querySelectorAll('#seg-input .chip')].find(b=>/Sentuh/.test(b.textContent)).click();});
  await page.evaluate(()=>document.getElementById('btn-start').click());
  await page.waitForSelector('#scr-game.active',{timeout:4000});
  await page.waitForFunction("G.phase==='ask'",{timeout:15000});
  const fps=await page.evaluate(()=>new Promise(res=>{let n=0;const t0=performance.now();(function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else res(Math.round(n/2));})();}));
  T('FPS UI mode sentuh ≥ 50 (headless)',fps>=50,fps+' FPS');
  await page.screenshot({path:'/tmp/shots-gbp/04-game-sentuh.png'});
  T('0 page error kritis',errs.filter(e=>!/favicon|net::ERR|gpu|dbus|MediaPipe|WASM/.test(e)).length===0,errs.slice(0,3));
  await browser.close();
  console.log('\nE2E GBP: '+PASS+' LULUS, '+FAIL+' GAGAL');
  process.exit(FAIL?1:0);
})().catch(e=>{console.error('FATAL:',e);process.exit(1);});
