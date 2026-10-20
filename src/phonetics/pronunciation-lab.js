import { prepareRecordedAudio } from '../phonetics/audio-processor.js';
import { LocalPhonemeEngine } from '../phonetics/phonemes-local.js';

/** Experimental phoneme transcription only; NEVER an assessment of user accuracy. */
const $ = id => document.getElementById(id);
const record = $('phonetic-record'), analyze = $('phonetic-analyze');
const status = $('phonetic-status'), playback = $('phonetic-playback');
const report = $('phonetic-result'), progress = $('phonetic-progress');
const metrics = $('phonetic-metrics'), target = $('target-phrase');
if (record && analyze && status && playback && report && progress && target) {
  let audio = null;
  let phraseRecorded = null;
  let busy = false;
  let epoch = 0;
  let abort = null;
  let engine = null;
  const update = text => { status.textContent = text; };
  const stageText = stage => ({'loading-library':'Preparando librería…','loading-feature-extractor':'Preparando extractor de voz…','loading-onnx-q4':'Cargando modelo Q4…','inferencing':'Reconociendo fonemas…'}[stage] || 'Cargando recursos del modelo…');
  function reset({cancelCapture=false}={}) {
    epoch++;
    abort?.abort();abort=null;
    busy=false;
    audio=null;phraseRecorded=null;
    if (cancelCapture) window.VoxVoice?.cancel();
    window.VoxVoice?.clearPlayback(playback);
    record.disabled=false;analyze.disabled=true;
    progress.hidden=true;progress.value=0;
    report.hidden=true;report.replaceChildren();
    metrics.textContent='';
    update('Graba la frase actual. El modelo no se descargará hasta que pulses analizar.');
  }
  const observer = new MutationObserver(() => reset({cancelCapture:true}));
  observer.observe(target,{childList:true,characterData:true,subtree:true});
  record.addEventListener('click',()=>{
    if (busy) return;
    // VOX Voice manages one active recorder, stopping it on the second tap.
    const chosenPhrase = target.textContent.trim();
    // Invalidate any old audio and pending analysis when a new recording begins.
    abort?.abort();abort=null;
    audio=null;phraseRecorded=null;analyze.disabled=true;
    report.hidden=true;report.replaceChildren();metrics.textContent='';
    window.VoxVoice?.toggle({
      button:record,status,playback,recognize:false,lang:'en-US',
      onAudio:({blob})=>{
        if (target.textContent.trim()!==chosenPhrase) return;
        audio=blob;phraseRecorded=chosenPhrase;
        analyze.disabled=false;
        update('Grabación disponible. Puedes escucharla antes de analizar los fonemas.');
      },
      // VoxVoice's generic finalizer otherwise shows an ASR warning for recognize:false.
      onComplete:({audioReady})=>{
        if (audioReady && audio && target.textContent.trim()===chosenPhrase)
          update('Grabación disponible. Puedes escucharla antes de analizar los fonemas.');
      },
    });
  });
  analyze.addEventListener('click',async()=>{
    if (busy || !audio) return;
    if (phraseRecorded!==target.textContent.trim()) {reset();return;}
    busy=true;
    const ticket=++epoch;
    abort = new AbortController();
    analyze.disabled=true;record.disabled=true;
    report.hidden=true;report.replaceChildren();progress.hidden=true;
    const signal=abort.signal;
    const keep=()=>ticket===epoch && !signal.aborted;
    const now=()=>performance.now();
    let then=now();
    try{
      update('Preparando audio mono de 16 kHz…');
      const prepared=await prepareRecordedAudio(audio);
      if(!keep())return;
      const preparationMs=Math.round(now()-then);
      update('Inicializando análisis IPA experimental. Primera descarga ≈90 MB, usa Wi-Fi.');
      engine??=new LocalPhonemeEngine({dtype:'q4',timeoutMs:240000});
      then=now();let inferenceMark=null;
      const result=await engine.analyze(prepared,{signal,onProgress:info=>{
        if(!keep())return;
        if(info.stage==='inferencing')inferenceMark=now();
        update(stageText(info.stage));
        if(info.percent!==null && info.percent!==undefined && Number.isFinite(Number(info.percent))){
          progress.hidden=false;
          progress.value=Math.min(100,Math.max(0,Number(info.percent)));
        }
      }});
      if(!keep())return;
      const warmMs=Math.max(0,Math.round((inferenceMark??now())-then));
      const heading=document.createElement('strong');heading.textContent='IPA detectada (no es una calificación)';
      const code=document.createElement('p');code.className='phonetic-ipa';code.textContent=result.ipaRaw;
      const note=document.createElement('p');note.className='muted-small';note.textContent='Resultado experimental Q4. No mide acento, articulación ni certeza de cada fonema. Una omisión o sustitución puede ser un fallo del modelo.';
      report.replaceChildren(heading,code,note);report.hidden=false;
      metrics.textContent=`Audio ${prepared.durationSeconds.toFixed(2)} s · preparación ${preparationMs} ms · carga ${warmMs} ms · inferencia ${result.inferenceMs} ms`;
      update('Análisis fonético local completado. Comprueba tu grabación antes de interpretar el IPA.');
    }catch(e){
      if(!keep() && e?.code==='aborted')return;
      if(!keep())return;
      const errorCode=typeof e.code==='string'?e.code:'error';
      update(`No se pudo analizar [${errorCode}]: ${String(e.message||'Error inesperado').slice(0,200)}. Conservamos tu audio; puedes reintentar.`);
      if(['model-failed','worker-error','timeout','worker-unavailable'].includes(errorCode)){engine?.dispose();engine=null;}
    }finally{
      if(ticket===epoch){busy=false;abort=null;record.disabled=false;analyze.disabled=!audio;}
    }
  });
  window.addEventListener('vox:tab-change',event=>{
    if(event.detail?.tab!=='pronounce'){
      abort?.abort();abort=null;epoch++;
      busy=false;
      // Navigating away from this test closes the recorder and clears the temporary blob.
      window.VoxVoice?.cancel();
      audio=null;phraseRecorded=null;
      analyze.disabled=true;record.disabled=false;
      window.VoxVoice?.clearPlayback(playback);
      report.hidden=true;report.replaceChildren();metrics.textContent='';progress.hidden=true;
    }
  });
  window.addEventListener('pagehide',()=>{abort?.abort();engine?.dispose();});
}
