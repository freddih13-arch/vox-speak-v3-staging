/* VOX Stage 0: browser speech recognition troubleshooting. No local audio recording, scores, or transcripts persisted. */
(()=>{
  'use strict';
  const KEY='vox_stage0_preview__recognition_only_mode';
  const ERRORS={
    'network':'La grabación local funciona, pero el servicio de transcripción no consiguió conectarse. Abre en Chrome directamente (no dentro de otra app); cambia entre Wi-Fi y datos móviles y repite.',
    'not-allowed':'El navegador no permitió reconocer la voz. Revisa permisos del sitio y que Chrome esté actualizado.',
    'service-not-allowed':'El servicio de voz elegido fue rechazado por el navegador. Prueba Chrome actualizado; puede ser una limitación del dispositivo.',
    'no-speech':'No detectó habla. Habla durante 3–5 segundos, en un lugar silencioso.',
    'audio-capture':'El reconocedor no pudo usar el micrófono, aunque la grabación local puede funcionar. Cierra apps que usen micrófono y vuelve a intentarlo.',
    'aborted':'El navegador interrumpió la escucha. Mantén Chrome en primer plano.',
    'language-not-supported':'El idioma inglés seleccionado no está soportado por este motor.',
    'no-result':'El motor terminó sin palabras; prueba otra vez y espera antes de detener.',
    'timeout':'El motor no respondió a tiempo. Comprueba conectividad y servicios de voz.',
    'unsupported':'Este navegador no dispone de Web Speech Recognition. Prueba una versión reciente de Chrome.',
    'start-failed':'No se pudo iniciar el servicio de transcripción desde este navegador.',
    'unknown':'Chrome envió un error no especificado.'
  };
  let recognition=null, timer=null, running=false, resultCode='not-tested', eventSteps=[], transcriptReceived=false;
  const $=id=>document.getElementById(id);
  const ctor=()=>window.SpeechRecognition||window.webkitSpeechRecognition;
  function compatibleMode(){try{return localStorage.getItem(KEY)==='1'}catch{return !!$('recognition-only-mode')?.checked}}
  function update(msg){if($('speech-check-result'))$('speech-check-result').textContent=msg}
  function report(){return [
    'VOX Speak 3.0 — diagnóstico de reconocimiento',
    'Código: '+resultCode,
    'Reconocimiento soportado: '+!!ctor(),
    'Contexto seguro (HTTPS): '+window.isSecureContext,
    'Conexión según navegador: '+(navigator.onLine?'online':'offline'),
    'Modo compatible activado: '+compatibleMode(),
    'Navegador: '+navigator.userAgent.slice(0,170),
    'Eventos: '+eventSteps.slice(-12).join(' > '),
    'No incluye audio ni texto reconocido.'
  ].join('\n')}
  function finish(code,success=false){
    if(!running)return;
    running=false;
    if(timer){clearTimeout(timer);timer=null}
    resultCode=code;
    $('speech-check-start').disabled=false;
    $('speech-check-start').textContent='🎙 Repetir prueba de reconocimiento';
    $('speech-check-copy').hidden=false;
    if(success)update('✅ [ok] Chrome transcribió correctamente esta prueba sin grabación simultánea. Si los ejercicios siguen fallando, activa «Modo compatible».');
    else update('⚠️ Código ['+code+']: '+(ERRORS[code]||ERRORS.unknown)+' Copia el informe técnico para revisarlo.');
    if(recognition){const r=recognition;recognition=null;r.onresult=null;r.onerror=null;r.onend=null;try{r.abort()}catch{}}
  }
  function begin(){
    // Called synchronously from a tap; avoid delaying browser user activation.
    window.VoxVoice?.cancel();
    const SR=ctor();
    if(!SR){running=true;eventSteps=['unsupported'];finish('unsupported');return}
    running=true;transcriptReceived=false;eventSteps=['start-attempt'];resultCode='running';
    $('speech-check-copy').hidden=true;
    $('speech-check-start').textContent='■ Detener prueba';
    update('Escuchando... Di “I work in sales”. No se grabará ningún archivo de audio.');
    try{
      const r=new SR();recognition=r;r.lang='en-US';r.continuous=false;r.interimResults=false;r.maxAlternatives=1;
      r.onstart=()=>{eventSteps.push('start');update('Micrófono activado por el reconocedor. Di la frase ahora.')};
      r.onaudiostart=()=>eventSteps.push('audio-start');
      r.onspeechstart=()=>eventSteps.push('speech-start');
      r.onresult=e=>{eventSteps.push('result');let txt='';for(let i=0;i<e.results.length;i++)txt+=e.results[i]?.[0]?.transcript||'';transcriptReceived=!!txt.trim();if(transcriptReceived)finish('ok',true)};
      r.onerror=e=>{eventSteps.push('error:'+(e.error||'unknown'));finish(e.error||'unknown')};
      r.onend=()=>{eventSteps.push('end');if(running)finish(transcriptReceived?'ok':'no-result',transcriptReceived)};
      r.start();
      timer=setTimeout(()=>{eventSteps.push('timeout');finish('timeout')},15000);
    }catch(e){eventSteps.push('exception:'+(e?.name||'unknown'));finish(e?.name==='NotAllowedError'?'not-allowed':'start-failed')}
  }
  function stop(){if(!running)return;if(recognition){$('speech-check-start').disabled=true;update('Finalizando prueba…');eventSteps.push('manual-stop');try{recognition.stop()}catch{finish('start-failed')}}else finish('no-result')}
  function init(){
    const button=$('speech-check-start'),toggle=$('recognition-only-mode');if(!button||!toggle)return;
    toggle.checked=compatibleMode();
    toggle.addEventListener('change',()=>{try{localStorage.setItem(KEY,toggle.checked?'1':'0')}catch{update('No pude conservar el ajuste; estará disponible solo durante esta sesión.')}});
    button.addEventListener('click',()=>running?stop():begin());
    $('speech-check-copy').addEventListener('click',async()=>{
      const output=report();
      try{await navigator.clipboard.writeText(output);update('Informe técnico copiado. Pégalo en el chat para analizar el código ['+resultCode+'].')}catch{
        const pre=document.createElement('pre');pre.textContent=output;pre.style.whiteSpace='pre-wrap';pre.style.wordBreak='break-word';$('speech-check-result').replaceChildren(pre)
      }
    });
    window.addEventListener('vox:tab-change',e=>{if(e.detail?.tab!=='home'&&running){eventSteps.push('navigation');finish('aborted')}});
  }
  window.VoxSpeechDiagnostics={compatibleMode,report};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
