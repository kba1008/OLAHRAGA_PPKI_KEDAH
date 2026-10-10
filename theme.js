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
    if(DB){DB.tetapan=Object.assign({},DB.tetapan||{},{TEMA_APP:tema});simpanCacheDB(DB);}
    gunaTema(tema);
  }catch(e){/* Internet putus: kekalkan tema terakhir. */}
  finally{TEMA_BACA=false;}
}
function mulaSegerakTema(){
  setInterval(segerakTema,60000);
  window.addEventListener('focus',segerakTema);window.addEventListener('online',segerakTema);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')segerakTema();});
}
