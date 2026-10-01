/* E2E CHROME — KUIS FAMILY 100 (v1.1: fix papan tak tampil) */
const puppeteer=require('puppeteer');
const fs=require('fs');
let PASS=0,FAIL=0;
const T=(n,k,c)=>{if(k){PASS++;console.log('  ✓ '+n+(c!==undefined?'  ['+String(c).slice(0,110)+']':''));}else{FAIL++;console.log('  ✗ GAGAL: '+n+' ['+(c===undefined?'-':JSON.stringify(c)).slice(0,120)+']');}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--window-size=1566,866']});
  const page=await browser.newPage();
  await page.setViewport({width:1566,height:866});
  const errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120));});
  fs.mkdirSync('/tmp/shots-ff',{recursive:true});
  await page.goto('file:///home/user/family-100/index.html');
  await sleep(900);
  await page.screenshot({path:'/tmp/shots-ff/01-menu.png'});
  await page.evaluate(()=>{[...document.querySelectorAll('button')].find(b=>/MULAI BERMAIN/.test(b.textContent)).click();});
  await page.evaluate(()=>document.getElementById('btn-start').click());
  await sleep(300);
  await page.evaluate(()=>{[...document.querySelectorAll('#modal-root.open .modal button')].find(b=>/🟡/.test(b.textContent)).click();});
  await page.waitForFunction("S.phase==='play'",{timeout:4000});
  await sleep(600);
  /* PAPAN JAWABAN — bug dilaporkan: tak ada tombol jawaban */
  const board=await page.evaluate(()=>{
    const ts=[...document.querySelectorAll('#board .tile')];
    const rs=ts.map(t=>t.getBoundingClientRect());
    return {n:ts.length,terlihat:rs.filter(r=>r.width>80&&r.height>24&&getComputedStyle(ts[rs.indexOf(r)]).display!=='none').length,
      q:document.getElementById('qbanner').textContent.slice(0,40),
      mm:ts.map(t=>getComputedStyle(t.querySelector('.ttext'),'::after').content).join('|').slice(0,40)};
  });
  T('Papan jawaban TERLIHAT & bisa diketuk (bug v1.0)',board.n>=2&&board.terlihat===board.n,board.n+' petak, '+board.terlihat+' terlihat');
  T('Soal survei tampil di banner',board.q.length>8,board.q);
  T('Petak tertutup bertanda ? ? ? (pseudo ::after)',/\? \? \?/.test(board.mm),board.mm);
  /* ketuk petak pertama */
  const tap=await page.evaluate(()=>new Promise(res=>{
    const t=document.querySelector('#board .tile');
    const r=t.getBoundingClientRect();
    t.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));
    setTimeout(()=>res({cls:t.className,pot:window.S.pot}),450);
  }));
  T('Ketuk petak → terbuka + POT bertambah',/revealed/.test(tap.cls)&&tap.pot>0,tap);
  await page.screenshot({path:'/tmp/shots-ff/02-game.png'});
  /* FPS UI */
  const fps=await page.evaluate(()=>new Promise(res=>{let n=0;const t0=performance.now();(function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else res(Math.round(n/2));})();}));
  T('FPS UI ≥ 50',fps>=50,fps+' FPS');
  /* alur cepat sampai hasil via API internal (UI path sudah teruji di atas) */
  await page.evaluate(()=>{
    while(S.phase==='play')window.__FF.doStrike();
    if(S.phase==='steal')window.__FF.missSteal();
  });
  await sleep(400);
  await page.evaluate(()=>{[...document.querySelectorAll('#modal-root.open .modal button')].slice(-1)[0].click();});
  await sleep(400);
  const fin=await page.evaluate(()=>new Promise(res=>{
    let n=0;
    const iv=setInterval(()=>{
      n++;
      if(document.querySelector('.screen.active').id==='scr-result'){clearInterval(iv);res('done');}
      else if(n>80){clearInterval(iv);res('timeout:'+S.phase);}
      else{
        if(S.phase==='play'){const h=S.q.a.findIndex(x=>!x.r);if(h>=0)window.__FF.doReveal(h,false);}
        if(S.phase==='steal')window.__FF.missSteal();
        const mb=[...document.querySelectorAll('#modal-root.open .modal button')];
        if(mb.length&&S.phase==='roundend')mb[mb.length-1].click();
      }
    },250);
  }));
  T('Pertandingan penuh → layar hasil',fin==='done',fin);
  const resv=await page.evaluate(()=>{const el=document.getElementById('board-res');const r=el.getBoundingClientRect();return {aktif:document.querySelector('.screen.active').id,papan:/PAPAN JUARA/.test(el.textContent),h:r.height|0};});
  T('Papan juara tampil di layar hasil (#board-res, bukan #board game)',resv.papan&&resv.h>40,resv);
  await page.screenshot({path:'/tmp/shots-ff/03-hasil.png'});
  /* MODE KAMERA AI: dwell jari menunjuk membuka petak */
  await page.evaluate(()=>{[...document.querySelectorAll('#scr-result button')].find(b=>/Menu Utama/.test(b.textContent)).click();});
  await sleep(200);
  await page.evaluate(()=>{[...document.querySelectorAll('button')].find(b=>/MULAI BERMAIN/.test(b.textContent)).click();
    [...document.querySelectorAll('#seg-input button')].find(b=>/Kamera/.test(b.textContent)).click();});
  await page.evaluate(()=>document.getElementById('btn-start').click());
  await sleep(300);
  await page.evaluate(()=>{[...document.querySelectorAll('#modal-root.open .modal button')].find(b=>/🟡/.test(b.textContent)).click();});
  await page.waitForFunction("S.phase==='play'",{timeout:4000});
  let camOk=false,tag='';
  for(let i=0;i<24;i++){tag=await page.evaluate(()=>document.getElementById('camtag').textContent);if(/aktif/.test(tag)){camOk=true;break;}await sleep(500);}
  T('Kamera fake aktif (AI termuat)',camOk,tag);
  /* feed landmark sintetis dari sisi NODE (evaluate panjang kena timer-throttle);
     bekukan inferensi MediaPipe agar main thread bebas utk mainLoop dwell */
  await page.evaluate(()=>{window.CAM.on=false;}); /* hentikan inferensi asli: onResults frame-kosong tak lagi menghapus pointer sintetis */
  await sleep(300);
  let dwellOk='gagal';
  for(let i=0;i<70;i++){
    dwellOk=await page.evaluate(()=>{
      const target=document.querySelector('#board .tile:not(.revealed)');
      if(!target)return 'nol';
      const r=target.getBoundingClientRect();
      const cx=r.left+r.width/2,cy=r.top+r.height/2;
      const v=document.getElementById('cam');
      const vw=v.videoWidth||1280,vh=v.videoHeight||720,sw=innerWidth,sh=innerHeight;
      const sc=Math.max(sw/vw,sh/vh),ox=(sw-vw*sc)/2,oy=(sh-vh*sc)/2;
      const nx=1-(cx-ox)/(vw*sc),ny=(cy-oy)/(vh*sc);
      const lm=Array.from({length:21},()=>({x:nx,y:ny}));
      lm[0]={x:nx-.3,y:ny+.3};lm[6]={x:nx-.27,y:ny+.27};lm[8]={x:nx,y:ny};lm[12]={x:nx-.18,y:ny+.24};
      window.__FF.onHands({multiHandLandmarks:[lm]});
      return target.classList.contains('revealed')?('terbuka, pot='+window.S.pot):'belum';
    });
    if(dwellOk!=='belum')break;
    await sleep(85);
  }
  const nRev=await page.evaluate(()=>document.querySelectorAll('#board .tile.revealed').length);
  T('Dwell gesture 1 dtk → petak terbuka (kamera AI)',/terbuka/.test(dwellOk)||(dwellOk==='nol'&&nRev>0),dwellOk+' terbuka='+nRev);
  await page.screenshot({path:'/tmp/shots-ff/04-kamera-dwell.png'});
  T('0 page error kritis',errs.filter(e=>!/favicon|net::ERR|gpu|dbus|MediaPipe|WASM/.test(e)).length===0,errs.slice(0,3));
  await browser.close();
  console.log('\nE2E FAMILY 100: '+PASS+' LULUS, '+FAIL+' GAGAL');
  process.exit(FAIL?1:0);
})().catch(e=>{console.error('FATAL:',e);process.exit(1);});
