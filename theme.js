/* Tujuh pilihan sahaja; nilai lain tidak boleh menjadi CSS atau tema baharu. */
const AT_TEMA=Object.freeze({pilihan:Object.freeze([
  {id:"BIRU",nama:"Biru Safir"},{id:"UNGU",nama:"Ungu Amethyst"},
  {id:"HIJAU",nama:"Hijau Emerald"},{id:"MERAH",nama:"Merah Ruby"},
  {id:"EMAS",nama:"Emas Champagne"},{id:"ASAL",nama:"Tema Asal"},{id:"PUTIH",nama:"Putih"}
]),normal:n=>["BIRU","UNGU","HIJAU","MERAH","EMAS","ASAL","PUTIH"].includes(String(n||"").toUpperCase())?String(n).toUpperCase():"BIRU"});
let TEMA_MENYIMPAN=false,TEMA_VERSI=0,TEMA_BACA=false;
function temaSemasa(){return AT_TEMA.normal(document.documentElement.dataset.tema);}
function gunaTema(n){
  const tema=AT_TEMA.normal(n);
  document.documentElement.dataset.tema=tema;
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=getComputedStyle(document.documentElement).getPropertyValue('--bg2').trim();
  const sel=document.getElementById('temaApp');if(sel && !TEMA_MENYIMPAN)sel.value=tema;
}
async function tukarTemaApp(n){
  if(!isMaster())return toast('Hanya Master Admin boleh mengubah warna paparan.');
  if(TEMA_MENYIMPAN)return;
  const tema=AT_TEMA.normal(n),lama=temaSemasa(),sel=document.getElementById('temaApp'),status=document.getElementById('temaStatus');
  if(tema===lama)return;
  if(!U.tokenTema){if(sel)sel.value=lama;return maklum('Sila log keluar dan log masuk semula sebagai Master Admin untuk mengaktifkan kawalan tema.');}
  TEMA_MENYIMPAN=true;TEMA_VERSI++;if(sel)sel.disabled=true;
  if(status)status.textContent='Menyimpan…';
  try{
    const r=await api('simpanTetapan',{kunci:'TEMA_APP',nilai:tema,tokenTema:U.tokenTema,...who()});
    if(!DB)throw new Error('Data aplikasi belum dimuatkan.');
    DB.tetapan=Object.assign({},DB.tetapan||{},r.tetapan||{},{TEMA_APP:tema});
    gunaTema(tema);simpanCacheDB(DB);
    if(status)status.textContent='Tema disimpan.';
    toast('Warna paparan disimpan untuk semua pengguna.');
  }catch(e){gunaTema(lama);if(sel)sel.value=lama;if(status)status.textContent='Tema tidak disimpan.';toastRalat(e);}
  finally{TEMA_MENYIMPAN=false;TEMA_VERSI++;if(sel)sel.disabled=false;}
}
async function segerakTema(){
  if(TEMA_BACA||TEMA_MENYIMPAN||!API||document.visibilityState!=='visible'||!navigator.onLine)return;
  const versi=TEMA_VERSI;TEMA_BACA=true;
  try{
    const r=await apiJsonp('temaApp',{},10000);
    if(versi!==TEMA_VERSI||TEMA_MENYIMPAN)return;
    const tema=AT_TEMA.normal(r.tema);
    let modBerubah=false;
    if(DB){
      const lama=DB.tetapan||{},baru={TEMA_APP:tema};
      if(r.modPerlawanan){
        baru.MOD_PERLAWANAN=r.modPerlawanan;baru.NAMA_KEJOHANAN=r.namaKejohanan||"";
        modBerubah=String(lama.MOD_PERLAWANAN||"TIDAK")!==baru.MOD_PERLAWANAN||String(lama.NAMA_KEJOHANAN||"")!==baru.NAMA_KEJOHANAN;
      }
      DB.tetapan=Object.assign({},lama,baru);simpanCacheDB(DB);
    }
    gunaTema(tema);
    if(modBerubah){
      render();
      toast(DB.tetapan.MOD_PERLAWANAN==="AKTIF"?"🏟 Master Admin telah menukar ke Mod Perlawanan — "+(DB.tetapan.NAMA_KEJOHANAN||""):"🏃 Master Admin telah menukar ke Mod Latihan");
      try{const d=await api("data",{paksa:1});if(d&&Array.isArray(d.atlet)){d.tetapan=Object.assign({},d.tetapan||{},DB.tetapan);DB=d;simpanCacheDB(DB);if(bolehRenderSemula())render();}}catch(_){}
    }
  }catch(e){/* Internet putus: kekalkan tema terakhir. */}
  finally{TEMA_BACA=false;}
}
function mulaSegerakTema(){
  setInterval(segerakTema,20000);
  setTimeout(segerakTema,1500); /* semak mod & tema serta-merta selepas refresh */
  window.addEventListener('focus',segerakTema);window.addEventListener('online',segerakTema);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')segerakTema();});
}
