'use strict';
/* ================= STATE ================= */
const CFG=Object.assign({cls:null,mode:'kamera',rcls:null,rdate:null,tts:true},getCfg());
function persistCfg(){saveCfg({cls:CFG.cls,mode:CFG.mode,rcls:CFG.rcls,rdate:CFG.rdate,tts:CFG.tts});}
let SES=null;               /* sesi scan aktif */
const AW={ai:null,pend:null,editId:null,stream:null,tmr:null,busy:false};
const FACEAPI_URL='https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
const MODEL_URL='https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

/* ================= NAV & UTIL UI ================= */
function show(id){
  $$('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById(id);
  if(el)el.classList.add('active');
}
let toastT;
function toast(m,ms){
  const t=$('#toast');if(!t)return;
  t.textContent=m;t.classList.add('show');
  clearTimeout(toastT);
  toastT=setTimeout(()=>t.classList.remove('show'),ms||2600);
}
function showModal(html,btns){
  const root=$('#modal-root');
  root.innerHTML='<div class="modal">'+html+'<div class="mrow"></div></div>';
  const row=root.querySelector('.mrow');
  (btns||[]).forEach(b=>{
    const bt=document.createElement('button');
    bt.className='btn small '+(b.cls||'b-blue');
    bt.textContent=b.t;
    bt.onclick=()=>{Snd.click();if(b.f)b.f();else closeModal();};
    row.appendChild(bt);
  });
  root.classList.add('open');
}
function closeModal(){$('#modal-root').classList.remove('open');}
function avEl(s,cls){
  const el=document.createElement(s.av?'img':'div');
  el.className='av'+(cls?' '+cls:'');
  if(s.av)el.src=s.av;else el.textContent=(s.nm||'?').trim().charAt(0).toUpperCase();
  return el;
}

/* ================= PILIH KELAS (dipakai 3 layar) ================= */
function renderClsChips(elId,active,onPick){
  const wrap=$(elId);if(!wrap)return;
  wrap.innerHTML='';
  const cls=getClasses();
  if(!cls.length){wrap.innerHTML='<span class="hint">— belum ada kelas —</span>';return;}
  cls.forEach(c=>{
    const b=document.createElement('button');
    b.type='button';b.className='chip'+(c===active?' on':'');
    b.textContent=c;
    b.onclick=()=>{Snd.click();onPick(c);};
    wrap.appendChild(b);
  });
}

/* ================= PANEL MODE ABSENSI ================= */
function renderScanPanel(){
  if(!CFG.cls){const c0=getClasses()[0]||null;if(c0){CFG.cls=c0;persistCfg();}}
  renderClsChips('#cls-chips-s',CFG.cls,c=>{CFG.cls=c;persistCfg();renderScanPanel();});
  const n=getStudents().length;
  $('#cls-empty').style.display=n?'none':'block';
  const seg=$('#seg-mode');seg.innerHTML='';
  [{v:'kamera',l:'🤖 Kamera AI'},{v:'manual',l:'👆 Manual (Sentuh)'}].forEach(o=>{
    const b=document.createElement('button');
    b.type='button';b.className='chip'+(CFG.mode===o.v?' on':'');
    b.textContent=o.l;
    b.onclick=()=>{Snd.click();CFG.mode=o.v;persistCfg();renderScanPanel();};
    seg.appendChild(b);
  });
  const note=$('#setup-note');
  if(CFG.cls){
    const st=stuOf(getStudents(),CFG.cls);
    const withFace=st.filter(s=>s.desc&&s.desc.length).length;
    note.textContent=CFG.cls+': '+st.length+' siswa terdaftar • '+withFace+' dengan data wajah 📷'+(SES&&SES.running?' • SESI BERJALAN':'');
  }else note.textContent='Pilih kelas untuk memulai.';
  $('#ai-date').textContent='• '+fmtDate(todayISO());
  $('#scan-title').textContent=SES?('📋 '+SES.cls+' • '+fmtDate(SES.iso)):(CFG.cls?('📋 '+CFG.cls+' • siap mulai'):'—');
  const go=$('#btn-start');
  go.disabled=!CFG.cls||!n||(SES&&SES.running);
  go.textContent=(SES&&SES.running)?'▶️ SESI BERJALAN…':'🚀 MULAI SESI';
}
function openSetup(){renderScanPanel();show('scr-scan');}
/* TTS: sebut nama siswa setelah tercatat */
function speakName(nm){
  if(!CFG.tts)return;
  try{
    if(typeof speechSynthesis==='undefined')return;
    const u=new SpeechSynthesisUtterance(nm+' hadir');
    u.lang='id-ID';u.rate=1;
    speechSynthesis.cancel();speechSynthesis.speak(u);
  }catch(e){}
}


/* ================= LAYAR DATA SISWA ================= */
function renderData(){
  if(!CFG.cls){const cls=getClasses();CFG.cls=cls[0]||null;}
  renderClsChips('#cls-chips-d',CFG.cls,c=>{CFG.cls=c;persistCfg();renderData();});
  const list=$('#stu-list');list.innerHTML='';
  const st=CFG.cls?stuOf(getStudents(),CFG.cls):[];
  const rekap=getRekap();
  $('#data-note').textContent=CFG.cls?(st.length+' siswa di kelas '+CFG.cls):'Belum ada kelas — buat dulu dengan "Kelas Baru".';
  if(!st.length){
    const p=document.createElement('p');
    p.className='hint';
    p.textContent='Belum ada siswa. Tap "Tambah Siswa" di bawah.';
    list.appendChild(p);
  }
  st.forEach(s=>{
    const row=document.createElement('div');row.className='row';
    row.appendChild(avEl(s));
    const nm=document.createElement('div');nm.className='nm';
    nm.textContent=s.nm;
    const meta=document.createElement('small');
    const pct=pctOf(rekap,s.id,s.cls);
    meta.textContent=(s.desc&&s.desc.length?'📷 data wajah ✓':'⚠️ tanpa data wajah')+(pct==null?'':' • 📊 '+pct+'% hadir');
    nm.appendChild(meta);
    row.appendChild(nm);
    const bed=document.createElement('button');
    bed.className='btn small b-ghost';bed.textContent='✏️';
    bed.onclick=()=>{Snd.click();openStuModal(s.id);};
    row.appendChild(bed);
    const bdel=document.createElement('button');
    bdel.className='btn small b-red';bdel.textContent='🗑';
    bdel.onclick=()=>{Snd.click();confirmDelStu(s.id);};
    row.appendChild(bdel);
    list.appendChild(row);
  });
}
function openData(){renderData();show('scr-data');}
function confirmDelStu(id){
  const s=getStudents().find(x=>x.id===id);
  if(!s)return;
  showModal('<h3>🗑 Hapus Siswa?</h3><p>"'+esc(s.nm)+'" akan dihapus dari kelas '+esc(s.cls)+'. Catatan lama di rekap tetap tersimpan.</p>',
    [{t:'🗑 Ya, Hapus',cls:'b-red',f:()=>{closeModal();delStudent(id);}},
     {t:'Batal',cls:'b-ghost'}]);
}
function delStudent(id){
  saveStudents(getStudents().filter(s=>s.id!==id));
  toast('🗑 Siswa dihapus.');
  renderData();
}
function openClsModal(){
  showModal('<h3>➕ Kelas Baru</h3><input class="inp" id="in-clsname" placeholder="Contoh: 5A" maxlength="24">'+
    '<p class="hint" style="margin-top:1vmin">Nama kelas bebas (contoh: 5A, 6B, Robotik).</p>',
    [{t:'Batal',cls:'b-ghost'},
     {t:'💾 Simpan',cls:'b-green',f:()=>{
        const nm=$('#in-clsname').value.trim();
        if(!nm){toast('⚠️ Nama kelas masih kosong!');return;}
        registerClass(nm);
        CFG.cls=nm;persistCfg();closeModal();renderData();toast('✅ Kelas '+nm+' dibuat.');
     }}]);
  $('#in-clsname').focus();
}
function confirmDelCls(){
  if(!CFG.cls){toast('⚠️ Pilih kelas dulu.');return;}
  const n=stuOf(getStudents(),CFG.cls).length;
  showModal('<h3>🗑 Hapus Kelas '+esc(CFG.cls)+'?</h3><p>'+n+' siswa di kelas ini akan ikut terhapus. Riwayat rekap tetap tersimpan.</p>',
    [{t:'🗑 Ya, Hapus',cls:'b-red',f:()=>{
      saveStudents(getStudents().filter(s=>s.cls!==CFG.cls));
      saveClasses(getClasses().filter(c=>c!==CFG.cls));
      CFG.cls=null;persistCfg();closeModal();renderData();toast('🗑 Kelas dihapus.');
    }},{t:'Batal',cls:'b-ghost'}]);
}
/* ---- modal tambah/edit siswa ---- */
function openStuModal(editId){
  AW.editId=editId||null;AW.pend=null;
  const s=editId?getStudents().find(x=>x.id===editId):null;
  const all=Array.from(new Set(s?[s.cls,...getClasses()]:getClasses()));
  let optHtml=all.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
  optHtml+='<option value="__baru">➕ Kelas baru…</option>';
  showModal(
    '<h3>'+(s?'✏️ Edit Siswa':'➕ Tambah Siswa')+'</h3>'+
    '<label class="flab">Nama Lengkap</label>'+
    '<input class="inp" id="in-nm" placeholder="Contoh: Budi Santoso" maxlength="40">'+
    '<label class="flab">Kelas</label>'+
    '<select class="inp" id="in-cls">'+(optHtml||'<option value="__baru">➕ Kelas baru…</option>')+'</select>'+
    '<div id="wrap-newcls" style="display:none"><label class="flab">Nama Kelas Baru</label>'+
    '<input class="inp" id="in-newcls" placeholder="Contoh: 5A" maxlength="24"></div>'+
    '<label class="flab">Foto Wajah <span class="hint">(opsional — untuk absensi otomatis)</span></label>'+
    '<div style="display:flex;gap:1.6vmin;align-items:center">'+
      '<div id="photo-prev" class="av" style="width:12vmin;height:12vmin;font-size:5vmin">'+(s&&s.av?'':'👤')+'</div>'+
      '<input type="file" id="in-photo" accept="image/*" capture="user" class="inp" style="padding:.8vmin">'+
    '</div>'+
    '<p class="hint" style="margin-top:1vmin">Tanpa foto, siswa tetap bisa diabsen lewat panel manual.</p>',
    [{t:'Batal',cls:'b-ghost'},
     {t:'💾 Simpan',cls:'b-green',f:saveStuModal}]
  );
  if(s){
    $('#in-nm').value=s.nm;
    $('#in-cls').value=s.cls;
    if($('#in-cls').selectedIndex<0)$('#in-cls').value='__baru';
    if(s.av){const im=document.createElement('img');im.className='av';im.style.width='12vmin';im.style.height='12vmin';im.src=s.av;const pv=$('#photo-prev');pv.innerHTML='';pv.appendChild(im);}
    if(s.desc)AW.pend={av:s.av,desc:s.desc};
  }
  $('#in-cls').onchange=()=>{$('#wrap-newcls').style.display=$('#in-cls').value==='__baru'?'block':'none';};
  $('#in-photo').onchange=onPhotoPicked;
  $('#in-nm').focus();
}
function saveStuModal(){
  const nm=$('#in-nm').value.trim();
  if(!nm){toast('⚠️ Nama siswa masih kosong!');return;}
  let cls=$('#in-cls').value;
  if(cls==='__baru'){
    cls=$('#in-newcls').value.trim();
    if(!cls){toast('⚠️ Nama kelas baru masih kosong!');return;}
    registerClass(cls);
  }
  if(!cls){toast('⚠️ Pilih kelas dulu!');return;}
  const students=getStudents();
  if(AW.editId){
    const s=students.find(x=>x.id===AW.editId);
    if(s){s.nm=nm;s.cls=cls;if(AW.pend){s.av=AW.pend.av;s.desc=AW.pend.desc;}}
    toast('✅ Perubahan disimpan.');
  }else{
    const s={id:'s'+Date.now()+ri(100,999),nm:nm,cls:cls,av:AW.pend?AW.pend.av:null,desc:AW.pend&&AW.pend.desc?AW.pend.desc:null};
    students.push(s);
    toast('✅ '+nm+' ditambahkan ke '+cls+'.');
  }
  saveStudents(students);
  CFG.cls=cls;persistCfg();
  closeModal();renderData();
}
function onPhotoPicked(e){
  const file=e.target.files&&e.target.files[0];
  if(!file)return;
  const rd=new FileReader();
  rd.onload=()=>{
    const img=new Image();
    img.onload=async()=>{
      /* thumbnail 96x96 (potong tengah) */
      const cv=document.createElement('canvas');cv.width=96;cv.height=96;
      const cx=cv.getContext('2d');
      const sc=Math.max(96/img.width,96/img.height);
      cx.drawImage(img,(96-img.width*sc)/2,(96-img.height*sc)/2,img.width*sc,img.height*sc);
      let desc=null;
      try{
        toast('⏳ Menganalisis wajah…',4000);
        await loadAI();
        const res=await faceapi.detectSingleFace(img,new faceapi.TinyFaceDetectorOptions({inputSize:512,scoreThreshold:0.4})).withFaceLandmarks().withFaceDescriptor();
        if(res)desc=roundDesc(res.descriptor);
      }catch(err){desc=null;}
      AW.pend={av:cv.toDataURL('image/jpeg',.82),desc:desc};
      const pv=$('#photo-prev');pv.innerHTML='';
      const im=document.createElement('img');im.className='av';im.style.width='12vmin';im.style.height='12vmin';im.src=AW.pend.av;
      pv.appendChild(im);
      toast(desc?'✅ Data wajah tersimpan — siap absen otomatis!':'⚠️ Wajah tidak terdeteksi — siswa disimpan tanpa data wajah.');
    };
    img.src=rd.result;
  };
  rd.readAsDataURL(file);
}

/* ================= SESI SCAN ================= */
function startSession(){
  const students=getStudents();
  if(!CFG.cls){toast('⚠️ Pilih kelas dulu!');return;}
  const st=stuOf(students,CFG.cls);
  if(!st.length){toast('⚠️ Kelas '+CFG.cls+' belum punya siswa!');openData();return;}
  SES={cls:CFG.cls,iso:todayISO(),mode:CFG.mode,marks:{},running:true,notified:{},faces:[]};
  $('#scan-title').textContent='📋 '+SES.cls+' • '+fmtDate(SES.iso);
  $('#ai-date').textContent='• '+fmtDate(SES.iso);
  $('#welcome').textContent='👋 Ayo antre menghadap kamera!';
  const sb=$('#scanband');if(sb)sb.classList.toggle('on',SES.mode==='kamera');
  renderScanList(true);
  updateCount();
  show('scr-scan');
  renderScanPanel();
  Snd.go();
  if(SES.mode==='kamera')enableCam();
  else toast('👆 Mode manual: tap huruf status pada tiap siswa.');
}
function renderScanList(rebuild){
  const list=$('#scan-list');
  if(rebuild){
    list.innerHTML='';
    stuOf(getStudents(),SES.cls).forEach(s=>{
      const row=document.createElement('div');row.className='row';row.dataset.sid=s.id;
      const stok=document.createElement('div');stok.className='stok';stok.textContent='•';
      row.appendChild(stok);
      row.appendChild(avEl(s));
      const nm=document.createElement('div');nm.className='nm';nm.textContent=s.nm;
      row.appendChild(nm);
      const ms=document.createElement('div');ms.className='minis';
      STATUS.forEach(st=>{
        const b=document.createElement('button');
        b.type='button';b.className='mini';b.dataset.k=st.k;b.textContent=st.k;b.title=st.n;
        b.onclick=()=>{Snd.click();mark(s.id,st.k,true);};
        ms.appendChild(b);
      });
      row.appendChild(ms);
      const tm=document.createElement('div');tm.className='tm';tm.textContent='-';
      row.appendChild(tm);
      list.appendChild(row);
    });
  }
  /* update badge secara in-place (pelajaran Family 100: jangan rebuild DOM) */
  $$('#scan-list .row').forEach(row=>{
    const m=SES.marks[row.dataset.sid];
    const stok=row.querySelector('.stok');
    if(stok){stok.className='stok'+(m?(' s'+m.s):'');stok.textContent=m?m.s:'•';}
    const tm=row.querySelector('.tm');
    if(tm)tm.textContent=m?fmtClock(m.t):'-';
    row.querySelectorAll('.mini').forEach(b=>{
      b.classList.remove('on-H','on-I','on-S','on-A');
      if(m&&b.dataset.k===m.s)b.classList.add('on-'+m.s);
    });
  });
}
function updateCount(){
  const total=stuOf(getStudents(),SES.cls).length;
  const h=Object.values(SES.marks).filter(m=>m.s==='H').length;
  $('#scan-count').textContent=h+'/'+total+' Hadir';
  $('#scan-prog').style.width=(total?Math.round(h/total*100):0)+'%';
}
function mark(sid,k,manual){
  if(!SES||!SES.running)return;
  SES.marks[sid]={s:k,t:Date.now()};
  const rekap=getRekap();
  if(!rekap[SES.cls])rekap[SES.cls]={};
  if(!rekap[SES.cls][SES.iso])rekap[SES.cls][SES.iso]={};
  rekap[SES.cls][SES.iso][sid]={s:k,t:SES.marks[sid].t};
  saveRekap(rekap);
  renderScanList(false);
  updateCount();
  if(manual)Snd.ok();
}
function autoMark(sid){
  const cur=SES.marks[sid];
  if(cur){
    if(cur.s!=='H'&&!SES.notified[sid]){
      SES.notified[sid]=true;
      toast('ℹ️ '+nameOf(sid)+' sudah dicatat '+stName(cur.s)+'.');
    }
    return;
  }
  mark(sid,'H',false);
  Snd.ok();
  const s=getStudents().find(x=>x.id===sid);
  const nm=s?s.nm:'Siswa';
  const strip=$('#scan-strip');
  if(strip){
    strip.textContent='Terdeteksi: '+nm.toUpperCase()+' ('+SES.cls+') — HADIR!';
    strip.classList.add('show');
    clearTimeout(strip._t);
    strip._t=setTimeout(()=>strip.classList.remove('show'),2600);
  }
  const wel=$('#welcome');
  if(wel)wel.textContent='👋 Selamat Datang, '+nm+'!';
  speakName(nm);
}
function nameOf(sid){const s=getStudents().find(x=>x.id===sid);return s?s.nm:'Siswa';}
function markAll(){
  showModal('<h3>✅ Tandai Semua Hadir?</h3><p>Semua siswa di '+esc(SES.cls)+' akan dicatat HADIR pukul '+fmtClock(Date.now())+'.</p>',
    [{t:'✅ Ya, Semua Hadir',cls:'b-green',f:()=>{
      closeModal();
      stuOf(getStudents(),SES.cls).forEach(s=>mark(s.id,'H',false));
      Snd.fanfare();FX.rain(2500);
      toast('🎉 Semua siswa hadir!');
    }},{t:'Batal',cls:'b-ghost'}]);
}
function resetSession(){
  showModal('<h3>↺ Reset Sesi?</h3><p>Semua catatan sesi hari ini dihapus (belum tentu tersimpan di rekap jika belum ditandai).</p>',
    [{t:'↺ Ya, Reset',cls:'b-red',f:()=>{
      closeModal();
      SES.marks={};SES.notified={};
      const rekap=getRekap();
      if(rekap[SES.cls])delete rekap[SES.cls][SES.iso];
      saveRekap(rekap);
      renderScanList(false);updateCount();
      toast('↺ Sesi direset.');
    }},{t:'Batal',cls:'b-ghost'}]);
}
function finishSession(){
  if(!SES)return;
  const st=stuOf(getStudents(),SES.cls);
  const unmarked=st.filter(s=>!SES.marks[s.id]);
  showModal('<h3>📥 Selesaikan Absensi?</h3>'+
    '<p>Siswa yang belum tercatat: <b>'+unmarked.length+' orang</b>.</p>'+
    '<p style="margin-top:.6vmin">Finalisasi akan <b>menandai mereka ALPA otomatis</b> (status tetap bisa diedit di panel).</p>',
    [{t:'📝 Simpan Saja',cls:'b-ghost',f:()=>{closeModal();doFinish(false);}},
     {t:'🅰️ Finalisasi (kosong → Alpa)',cls:'b-red',f:()=>{closeModal();doFinish(true);}}]);
}
function doFinish(autoAlpa){
  if(!SES)return;
  let n=0;
  if(autoAlpa){
    stuOf(getStudents(),SES.cls).forEach(s=>{
      if(!SES.marks[s.id]){mark(s.id,'A',false);n++;}
    });
  }
  SES.running=false; /* dimatikan SETELAH penandaan selesai */
  stopCam();
  const wel=$('#welcome');if(wel)wel.textContent='👋 Siswa tinggal menghadap kamera — absen otomatis!';
  renderScanPanel();
  const total=stuOf(getStudents(),SES.cls).length;
  const h=Object.values(SES.marks).filter(m=>m.s==='H').length;
  const a=Object.values(SES.marks).filter(m=>m.s==='A').length;
  CFG.rcls=SES.cls;CFG.rdate=SES.iso;persistCfg();
  openRecap();
  if(n)toast('🅰️ '+n+' siswa dinyatakan Alpa — bisa diedit di sesi berikutnya.',3600);
  if(total&&h===total){Snd.fanfare();FX.rain(4000);toast('🎉 SEMPURNA! Semua hadir!');}
  else{Snd.go();toast('📥 Sesi disimpan: '+h+'/'+total+' hadir'+(a?' • '+a+' alpa':'')+'.');}
}

/* ================= WAJAH: DETEKSI, MATCHING, KOTAK ================= */
/* faces: [{x,y,w,h,d}] ternormalisasi 0..1 relatif frame video */
function onFaces(faces){
  if(!SES||!SES.running)return;
  SES.faces=faces||[];
  drawBoxes(SES.faces);
  if(!SES.faces.length)return;
  const cands=stuOf(getStudents(),SES.cls).filter(s=>s.desc&&s.desc.length===128)
    .map(s=>({sid:s.id,nm:s.nm,desc:s.desc}));
  for(const f of SES.faces){
    if(!f.d)continue;
    const m=bestMatch(f.d,cands);
    if(m&&m.d<=DESC_TH)autoMark(m.sid);
  }
}
function drawBoxes(faces){
  const layer=$('#boxlayer');
  if(!layer)return;
  layer.innerHTML='';
  if(!faces||!faces.length)return;
  const v=$('#cam');
  const vw=(v&&v.videoWidth)||1280,vh=(v&&v.videoHeight)||720;
  const card=$('#camcard')||v;
  const cr=card.getBoundingClientRect();
  const W=cr.width||innerWidth,H=cr.height||innerHeight;
  const sc=Math.max(W/vw,H/vh);
  const ox=(W-vw*sc)/2,oy=(H-vh*sc)/2;
  const cands=SES?stuOf(getStudents(),SES.cls).filter(s=>s.desc&&s.desc.length===128):[];
  for(const f of faces){
    const pw=f.w*vw*sc,px=ox+f.x*vw*sc;
    const py=oy+f.y*vh*sc,ph=f.h*vh*sc;
    const X=W-px-pw; /* cermin */
    let matched=null;
    if(f.d&&SES){
      const m=bestMatch(f.d,cands);
      if(m&&m.d<=DESC_TH)matched=m;
    }
    const box=document.createElement('div');
    box.className='facebox'+(matched?'':' unk');
    box.style.left=X+'px';box.style.top=py+'px';box.style.width=pw+'px';box.style.height=ph+'px';
    const lbl=document.createElement('span');
    lbl.className='flbl';
    lbl.textContent=matched?('✓ '+matched.nm):'? Tidak dikenal';
    box.appendChild(lbl);
    layer.appendChild(box);
  }
}

/* ================= KAMERA + MODEL AI ================= */
function loadScript(src,timeout){
  return new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src=src;
    const to=setTimeout(()=>rej(new Error('timeout memuat skrip')),timeout||20000);
    s.onload=()=>{clearTimeout(to);res();};
    s.onerror=()=>{clearTimeout(to);rej(new Error('gagal memuat skrip'));};
    document.head.appendChild(s);
  });
}
function loadAI(){
  if(!AW.ai){
    AW.ai=(async()=>{
      if(typeof faceapi==='undefined')await loadScript(FACEAPI_URL,25000);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      return true;
    })().catch(e=>{AW.ai=null;throw e;});
  }
  return AW.ai;
}
function camTag(t){const el=$('#camtag');if(el){el.textContent=t;el.classList.add('show');}}
function camTagHide(){const el=$('#camtag');if(el)el.classList.remove('show');}
async function enableCam(){
  if(AW.stream)return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    toast('📷 Kamera tidak didukung — pakai panel manual di kanan.');
    return;
  }
  try{
    AW.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false});
    const v=$('#cam');
    v.srcObject=AW.stream;
    await v.play();
    document.body.classList.add('cam');
    camTag('⏳ Memuat AI… (sekali saja, ±7 MB)');
    try{
      await loadAI();
      camTag('🤖 AI aktif');
      startDetectLoop();
      toast('📷 Arahkan wajah siswa ke kamera — otomatis tercatat hadir!');
    }catch(e){
      camTag('⚠️ AI gagal — mode manual');
      toast('⚠️ Model AI tidak bisa dimuat (butuh internet). Panel manual tetap bisa dipakai.',4000);
    }
  }catch(e){
    AW.stream=null;
    document.body.classList.remove('cam');
    toast('📷 Kamera tidak tersedia/ditolak — pakai panel manual di kanan.',4000);
  }
}
function stopCam(){
  if(AW.tmr){clearInterval(AW.tmr);AW.tmr=null;}
  if(AW.stream){try{AW.stream.getTracks().forEach(t=>t.stop());}catch(e){}}
  AW.stream=null;AW.busy=false;
  const v=$('#cam');if(v)v.srcObject=null;
  document.body.classList.remove('cam');
  camTagHide();
  const layer=$('#boxlayer');
  if(layer)layer.innerHTML='';
  const sb=$('#scanband');if(sb)sb.classList.remove('on');
}
function startDetectLoop(){
  if(AW.tmr)clearInterval(AW.tmr);
  AW.tmr=setInterval(async()=>{
    if(!SES||!SES.running||!AW.stream){return;}
    if(AW.busy||typeof faceapi==='undefined')return;
    const v=$('#cam');
    if(!v||v.readyState<2)return;
    AW.busy=true;
    try{
      const res=await faceapi.detectAllFaces(v,new faceapi.TinyFaceDetectorOptions({inputSize:320,scoreThreshold:0.5}))
        .withFaceLandmarks().withFaceDescriptors();
      const faces=res.map(r=>({
        x:r.detection.box.x/v.videoWidth,
        y:r.detection.box.y/v.videoHeight,
        w:r.detection.box.width/v.videoWidth,
        h:r.detection.box.height/v.videoHeight,
        d:Array.from(r.descriptor)
      }));
      onFaces(faces);
    }catch(e){}
    AW.busy=false;
  },550);
}

/* ================= REKAP ================= */
function openRecap(){
  if(!CFG.rcls){const cls=getClasses();CFG.rcls=cls[0]||null;}
  const xm=$('#xls-month');if(xm&&!xm.value)xm.value=todayISO().slice(0,7);
  renderRecap();
  show('scr-recap');
}
function renderRecap(){
  renderClsChips('#cls-chips-r',CFG.rcls,c=>{CFG.rcls=c;CFG.rdate=null;persistCfg();renderRecap();});
  const rekap=getRekap();
  const dates=CFG.rcls&&rekap[CFG.rcls]?Object.keys(rekap[CFG.rcls]).sort().reverse():[];
  const dwrap=$('#rc-dates');dwrap.innerHTML='';
  $('#rc-empty').style.display=dates.length?'none':'block';
  $('#rc-wrap').style.display=dates.length?'block':'none';
  if(!CFG.rdate||!dates.includes(CFG.rdate))CFG.rdate=dates[0]||null;
  dates.forEach(iso=>{
    const b=document.createElement('button');
    b.type='button';b.className='chip'+(iso===CFG.rdate?' on':'');
    b.textContent=fmtDate(iso);
    b.onclick=()=>{Snd.click();CFG.rdate=iso;persistCfg();renderRecap();};
    dwrap.appendChild(b);
  });
  const lg=$('#rc-legend')||(()=>{const d=document.createElement('div');d.className='legend';d.id='rc-legend';
    const listEl=$('#rc-list');listEl.parentNode.insertBefore(d,listEl);return d;})();
  lg.innerHTML='<span class="lg lH">H • Hadir</span><span class="lg lI">I • Izin</span><span class="lg lS">S • Sakit</span><span class="lg lA">A • Alpa</span>';
  const sum=$('#rc-sum');sum.innerHTML='';
  const list=$('#rc-list');list.innerHTML='';
  if(!CFG.rcls||!CFG.rdate)return;
  const day=rekap[CFG.rcls][CFG.rdate]||{};
  const st=stuOf(getStudents(),CFG.rcls);
  const cnt={H:0,I:0,S:0,A:0};
  st.forEach(s=>{const m=day[s.id];if(m)cnt[m.s]++;});
  const noRec=st.length-(cnt.H+cnt.I+cnt.S+cnt.A);
  const pct=st.length?Math.round(cnt.H/st.length*100):0;
  [['🟢 Hadir',cnt.H],['🔵 Izin',cnt.I],['🟠 Sakit',cnt.S],['🔴 Alpa',cnt.A],['⚫ Tanpa Catatan',noRec],['📊 Persen Hadir',pct+'%']].forEach(x=>{
    const d=document.createElement('div');d.className='cnt';
    const b=document.createElement('b');b.textContent=String(x[1]);
    const sm=document.createElement('small');sm.textContent=x[0];
    d.appendChild(b);d.appendChild(sm);
    sum.appendChild(d);
  });
  if(!st.length){
    const p=document.createElement('p');p.className='hint';p.textContent='Tidak ada siswa terdaftar di kelas ini.';
    list.appendChild(p);
  }
  st.forEach((s,i)=>{
    const m=day[s.id];
    const row=document.createElement('div');row.className='row';
    const no=document.createElement('div');no.className='av';no.textContent=(i+1);no.style.fontSize='2.4vmin';
    row.appendChild(no);
    const nm=document.createElement('div');nm.className='nm';nm.textContent=s.nm;
    row.appendChild(nm);
    const bd=document.createElement('span');bd.className='st '+(m?('st-'+m.s):'');bd.textContent=m?stName(m.s):'Tidak Tercatat';
    row.appendChild(bd);
    const tm=document.createElement('small');tm.style.color='var(--mut)';tm.textContent=m?fmtClock(m.t):'-';
    row.appendChild(tm);
    list.appendChild(row);
  });
}
function showCsvModal(){
  if(!CFG.rcls||!CFG.rdate){toast('⚠️ Belum ada data untuk diekspor.');return;}
  const csv=buildCSV(getStudents(),getRekap(),CFG.rcls,CFG.rdate);
  showModal('<h3>👁 CSV — '+esc(CFG.rcls)+' • '+fmtDate(CFG.rdate)+'</h3>'+
    '<textarea class="inp" id="csv-view" rows="10" readonly style="font-family:monospace;font-size:2vmin"></textarea>'+
    '<p class="hint" style="margin-top:1vmin">File dapat dibuka di Excel / Google Sheets.</p>',
    [{t:'Tutup',cls:'b-ghost'},
     {t:'📥 Unduh',cls:'b-green',f:downloadCsv}]);
  $('#csv-view').value=csv;
}
function downloadCsv(){
  if(!CFG.rcls||!CFG.rdate)return;
  const csv=buildCSV(getStudents(),getRekap(),CFG.rcls,CFG.rdate);
  try{
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='absensi_'+CFG.rcls+'_'+CFG.rdate+'.csv';
    document.body.appendChild(a);a.click();a.remove();
    toast('📥 CSV diunduh.');
  }catch(e){
    showCsvModal();
  }
}
function confirmDelDate(){
  if(!CFG.rcls||!CFG.rdate){toast('⚠️ Pilih tanggal dulu.');return;}
  showModal('<h3>🗑 Hapus Catatan?</h3><p>Semua catatan '+esc(CFG.rcls)+' tanggal '+fmtDate(CFG.rdate)+' akan dihapus permanen.</p>',
    [{t:'🗑 Ya, Hapus',cls:'b-red',f:()=>{
      const rekap=getRekap();
      if(rekap[CFG.rcls])delete rekap[CFG.rcls][CFG.rdate];
      saveRekap(rekap);
      CFG.rdate=null;persistCfg();
      closeModal();renderRecap();
      toast('🗑 Catatan tanggal dihapus.');
    }},{t:'Batal',cls:'b-ghost'}]);
}

/* ================= EXCEL DAFTAR HADIR BULANAN (semua kelas) ================= */
function xmlEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function monthLabel(iso){const b=['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI','JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'];return b[(+iso.slice(5,7))-1]+' '+iso.slice(0,4);}
function daysInMonth(mo){return new Date(+mo.slice(0,4),+mo.slice(5,7),0).getDate();}
function dowChar(isoM){return ['M','S','S','R','K','J','S'][new Date(isoM+'T00:00:00').getDay()];}
function sheetName(cl){return String(cl).replace(/[:\\\/\?\*\[\]]/g,'-').slice(0,31)||'KELAS';}
function buildXLS(mo){
  if(!/^\d{4}-\d{2}$/.test(mo||''))mo=todayISO().slice(0,7);
  const nD=daysInMonth(mo);
  const isoD=n=>mo+'-'+String(n).padStart(2,'0');
  const rekap=getRekap();
  const classes=getClasses().filter(c=>stuOf(getStudents(),c).length);
  let sheets='';
  classes.forEach(cl=>{
    const st=stuOf(getStudents(),cl);
    let head1='<Row><Cell ss:StyleID="sHead"><Data ss:Type="String">NO</Data></Cell><Cell ss:StyleID="sHead"><Data ss:Type="String">NAMA</Data></Cell>';
    let head2='<Row><Cell ss:StyleID="sHead"><Data ss:Type="String"></Data></Cell><Cell ss:StyleID="sHead"><Data ss:Type="String"></Data></Cell>';
    for(let n=1;n<=nD;n++){
      const h=dowChar(isoD(n));
      const st2=(h==='S'&&new Date(isoD(n)+'T00:00:00').getDay()===1)?'sHeadMon':'sHead';
      head1+='<Cell ss:StyleID="'+st2+'"><Data ss:Type="String">'+h+'</Data></Cell>';
      head2+='<Cell ss:StyleID="'+st2+'"><Data ss:Type="Number">'+n+'</Data></Cell>';
    }
    head1+='<Cell ss:StyleID="sHead"><Data ss:Type="String">JML H</Data></Cell><Cell ss:StyleID="sHead"><Data ss:Type="String">JML S</Data></Cell><Cell ss:StyleID="sHead"><Data ss:Type="String">JML I</Data></Cell><Cell ss:StyleID="sHead"><Data ss:Type="String">JML A</Data></Cell></Row>';
    head2+='</Row>';
    const rows=st.map((s,i)=>{
      const cnt={H:0,S:0,I:0,A:0};
      let cells='';
      for(let n=1;n<=nD;n++){
        const m=((rekap[cl]||{})[isoD(n)]||{})[s.id];
        if(m)cnt[m.s]++;
        const v=m?(m.s==='H'?'\u2713':m.s):'';
        const mon=(dowChar(isoD(n))==='S'&&new Date(isoD(n)+'T00:00:00').getDay()===1);
        cells+='<Cell ss:StyleID="'+(mon?'cMon':'cCell')+'"><Data ss:Type="String">'+v+'</Data></Cell>';
      }
      return '<Row><Cell ss:StyleID="cCell"><Data ss:Type="Number">'+(i+1)+'</Data></Cell>'+
        '<Cell ss:StyleID="cName"><Data ss:Type="String">'+xmlEsc(s.nm)+'</Data></Cell>'+cells+
        '<Cell ss:StyleID="cTot"><Data ss:Type="Number">'+cnt.H+'</Data></Cell>'+
        '<Cell ss:StyleID="cTot"><Data ss:Type="Number">'+cnt.S+'</Data></Cell>'+
        '<Cell ss:StyleID="cTot"><Data ss:Type="Number">'+cnt.I+'</Data></Cell>'+
        '<Cell ss:StyleID="cTot"><Data ss:Type="Number">'+cnt.A+'</Data></Cell></Row>';
    }).join('');
    let foot='<Row><Cell ss:StyleID="sFoot"><Data ss:Type="String">BULAN EFEKTIF</Data></Cell><Cell ss:StyleID="sFoot"><Data ss:Type="String">Hadir/hari:</Data></Cell>';
    for(let n=1;n<=nD;n++){
      let h=0;const day=(rekap[cl]||{})[isoD(n)]||{};
      Object.values(day).forEach(m=>{if(m.s==='H')h++;});
      foot+='<Cell ss:StyleID="cCell"><Data ss:Type="Number">'+h+'</Data></Cell>';
    }
    foot+='<Cell ss:StyleID="sFoot"><Data ss:Type="String"></Data></Cell><Cell ss:StyleID="sFoot"><Data ss:Type="String"></Data></Cell><Cell ss:StyleID="sFoot"><Data ss:Type="String"></Data></Cell><Cell ss:StyleID="sFoot"><Data ss:Type="String"></Data></Cell></Row>';
    sheets+='<Worksheet ss:Name="'+xmlEsc(sheetName(cl))+'"><Table>'+
      '<Row><Cell ss:StyleID="sTitle"><Data ss:Type="String">DAFTAR HADIR SISWA KELAS '+xmlEsc(String(cl).toUpperCase())+'</Data></Cell></Row>'+
      '<Row><Cell ss:StyleID="sSub"><Data ss:Type="String">BULAN: '+monthLabel(mo)+'</Data></Cell></Row>'+
      '<Row></Row>'+head1+head2+rows+foot+'</Table></Worksheet>';
  });
  if(!sheets)sheets='<Worksheet ss:Name="KOSONG"><Table><Row><Cell><Data ss:Type="String">Belum ada kelas/siswa terdaftar</Data></Cell></Row></Table></Worksheet>';
  return '<?xml version="1.0"?>\n'+
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'+
    '<Styles>'+
    '<Style ss:ID="sTitle"><Font ss:Bold="1" ss:Size="13" ss:FontName="Times New Roman"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>'+
    '<Style ss:ID="sSub"><Font ss:Bold="1" ss:Size="11" ss:FontName="Times New Roman"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>'+
    '<Style ss:ID="sHead"><Font ss:Bold="1" ss:Size="9"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Interior ss:Color="#EAEAEA" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>'+
    '<Style ss:ID="sHeadMon"><Font ss:Bold="1" ss:Size="9"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Interior ss:Color="#EAEAEA" ss:Pattern="Solid"/><Borders><Border ss:Position="Left" ss:Color="#FF0000" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>'+
    '<Style ss:ID="cCell"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>'+
    '<Style ss:ID="cMon"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Left" ss:Color="#FF0000" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>'+
    '<Style ss:ID="cName"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:Size="9"/><Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>'+
    '<Style ss:ID="cTot"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Color="#C00000"/><Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>'+
    '<Style ss:ID="sFoot"><Font ss:Bold="1" ss:Size="9"/></Style>'+
    '</Styles>'+sheets+'</Workbook>';
}
function downloadXLS(mo){
  const xml=buildXLS(mo);
  const fname='daftar_hadir_'+(mo||todayISO().slice(0,7))+'.xls';
  try{
    const blob=new Blob([xml],{type:'application/vnd.ms-excel'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download=fname;
    document.body.appendChild(a);a.click();a.remove();
    toast('📥 '+fname+' diunduh (1 lembar per kelas).');
  }catch(e){
    try{
      const a=document.createElement('a');
      a.href='data:application/vnd.ms-excel;charset=utf-8,'+encodeURIComponent(xml);
      a.download=fname;
      document.body.appendChild(a);a.click();a.remove();
      toast('📥 '+fname+' diunduh.');
    }catch(e2){toast('⚠️ Unduhan tidak didukung di browser ini.');}
  }
}

/* ================= BANTUAN ================= */
function showHelp(){
  showModal(
    '<h3>❓ Cara Pakai</h3>'+
    '<ol>'+
    '<li>👥 <b>Data Siswa</b> → buat kelas, tambahkan siswa + foto wajah (wajib terlihat jelas, 1 foto cukup).</li>'+
    '<li>📷 <b>Mulai Absensi</b> → pilih kelas &amp; mode. Arahkan kamera ke siswa: wajah yang dikenali otomatis tercatat <b>HADIR</b> (kotak hijau + nama).</li>'+
    '<li>👆 <b>Manual</b>: tap huruf H / I / S / A di panel kanan untuk atur status siapa pun.</li>'+
    '<li>📥 <b>Selesai</b> → rekap otomatis tersimpan, bisa diunduh sebagai CSV (Excel/Sheets).</li>'+
    '<li>📊 <b>Rekap</b> menyimpan riwayat per tanggal + persentase kehadiran tiap siswa.</li>'+
    '</ol>'+
    '<p>💡 Tips: pencahayaan cukup &amp; wajah tegak = pengenalan akurat. Model AI (±7 MB) diunduh sekali saja.<br>🔒 Semua data (foto &amp; rekap) tersimpan di perangkat ini, tidak dikirim ke mana pun.</p>',
    [{t:'Mengerti! 👍',cls:'b-gold'}]
  );
}

/* ================= BOOT ================= */
function toggleFS(){
  try{
    if(document.fullscreenElement)document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }catch(e){toast('Layar penuh tidak didukung di sini');}
}
function exitToHome(){
  if(SES){SES.running=false;}
  stopCam();
  closeModal();
  openSetup();
}
function bindButtons(){
  $('#btn-start').onclick=()=>{Snd.click();startSession();};
  $('#btn-add-cls').onclick=()=>{Snd.click();openClsModal();};
  $('#btn-del-cls').onclick=()=>{Snd.click();confirmDelCls();};
  $('#btn-add-stu').onclick=()=>{Snd.click();openStuModal(null);};
  $('#btn-csv').onclick=()=>{Snd.click();downloadCsv();};
  $('#btn-csv-view').onclick=()=>{Snd.click();showCsvModal();};
  $('#btn-del-date').onclick=()=>{Snd.click();confirmDelDate();};
  const dl=()=>{Snd.click();downloadXLS($('#xls-month').value||todayISO().slice(0,7));};
  $('#btn-xls').onclick=dl;
  $('#btn-xls2').onclick=dl;
  $('#btn-all').onclick=()=>{Snd.click();markAll();};
  $('#btn-reset').onclick=()=>{Snd.click();resetSession();};
  $('#btn-done').onclick=()=>{Snd.click();finishSession();};
  $('#btn-fs').onclick=toggleFS;
  $('#btn-help').onclick=()=>{Snd.click();showHelp();};
  $('#btn-snd').onclick=()=>{Snd.on=!Snd.on;$('#btn-snd').textContent=Snd.on?'🔊':'🔇';$('#btn-snd').classList.toggle('on',!Snd.on===false);Snd.click();};
  $('#btn-tts').onclick=()=>{Snd.click();CFG.tts=!CFG.tts;persistCfg();
    $('#btn-tts').classList.toggle('on',CFG.tts);
    toast(CFG.tts?'🗣 Nama siswa akan disebut saat absen.':'🔇 Sebut nama dimatikan.');
    if(CFG.tts)speakName('Tes suara');};
}
function syncTabOn(go){
  $$('.tabs').forEach(t=>{t.querySelectorAll('.tbtn2').forEach(b=>b.classList.toggle('on',b.dataset.go===go));});
}
function wireTabs(){
  $$('.tabs .tbtn2').forEach(b=>{
    b.onclick=()=>{
      Snd.click();
      const go=b.dataset.go;
      if(go==='data'){renderData();show('scr-data');}
      else if(go==='recap'){openRecap();}
      else{ /* absen */
        if(SES&&SES.running){show('scr-scan');}
        else{openSetup();}
      }
      syncTabOn(go);
    };
  });
}
function boot(){
  FX.init();
  bindButtons();
  wireTabs();
  requestAnimationFrame(fxLoop);
  const xm=$('#xls-month');if(xm)xm.value=todayISO().slice(0,7);
  $('#btn-tts').classList.toggle('on',!!CFG.tts);
  openSetup();
}
document.addEventListener('DOMContentLoaded',boot);

/* ================= HOOK UJI & LOOP FX ================= */
function setDesc(sid,desc){
  const st=getStudents();
  const s=st.find(x=>x.id===sid);
  if(s&&Array.isArray(desc)&&desc.length===128){s.desc=roundDesc(desc);saveStudents(st);return true;}
  return false;
}
function addStudent(nm,cls,desc){
  const st=getStudents();
  const s={id:'s'+Date.now()+ri(100,999),nm:String(nm),cls:String(cls),av:null,desc:desc?roundDesc(desc):null};
  st.push(s);saveStudents(st);
  return s.id;
}
function fxLoop(){
  FX.step();
  requestAnimationFrame(fxLoop);
}
window.__AW={
  onFaces,euclid,bestMatch,buildCSV,setDesc,addStudent,mark,startSession,openStuModal,
  saveStuModal,delStudent,renderData,renderRecap,openRecap,openData,openSetup ,renderScanPanel,
  confirmDelDate,downloadCsv,showCsvModal,finishSession,markAll,resetSession,exitToHome,speakName,buildXLS,downloadXLS,syncTabOn,downloadXLS:downloadXLS,
  getSES:()=>SES,CFG,STATUS,stName,todayISO,fmtDate,fmtClock,DESC_TH,Snd,FX,clsList,stuOf,pctOf,AW,getClasses,registerClass,loadAI,getStudents,getRekap,setDesc,addStudent,saveStudents,saveRekap,doFinish,wireTabs,autoMark,renderData,openSetup
};
