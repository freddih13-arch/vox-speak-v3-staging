/* VOX Speak · Android voice capture 0.2
   MediaRecorder: local playback. SpeechRecognition: optional, potentially remote, word transcript only.
   Stopping recognition uses stop(), not abort(); abort is reserved for leaving the exercise. */
(() => {
  'use strict';
  let active = null;
  const playbackUrls=new WeakMap();
  function clearPlayback(element){const el=typeof element==='string'?document.getElementById(element):element;if(!el)return;const url=playbackUrls.get(el);if(url){URL.revokeObjectURL(url);playbackUrls.delete(el)}el.replaceChildren()}
  const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
  const MSG = {
    'not-allowed':'Chrome denegó el micrófono. En ajustes del sitio, cambia Micrófono a Permitir.',
    'service-not-allowed':'El servicio de reconocimiento del navegador no está permitido.',
    'network':'El reconocimiento de Chrome no pudo conectarse. Tu grabación local sigue disponible.',
    'no-speech':'Chrome no detectó palabras durante el intento; revisa el volumen y vuelve a hablar.',
    'audio-capture':'El reconocimiento no consiguió utilizar el micrófono. Revisa si otra aplicación lo usa.',
    'language-not-supported':'El reconocimiento del idioma inglés no está disponible en el navegador.',
    'aborted':'El navegador interrumpió el reconocimiento.',
    'unknown':'El reconocimiento finalizó sin transcripción.',
    'unsupported':'Esta versión del navegador no dispone de SpeechRecognition.',
    'no-result':'La sesión terminó sin devolver palabras.',
    'timeout':'El servicio tardó demasiado en finalizar.'
  };
  const errText = e => ({NotAllowedError:'Permiso del micrófono denegado. Comprueba los permisos de Chrome.',NotFoundError:'No se encontró un micrófono.',NotReadableError:'El micrófono está siendo utilizado por otra aplicación.',SecurityError:'La página debe abrirse mediante HTTPS.',AbortError:'La captura del micrófono se interrumpió.'}[e?.name] || `Error de micrófono: ${e?.name || 'desconocido'}.`);
  const get = o => typeof o === 'string' ? document.getElementById(o) : o;
  const safeMsg = (s,msg)=>{if(s && s.isCurrent() && s.status) s.status.textContent=msg};
  const resetButton = s=>{if(s.button){s.button.disabled=false;s.button.classList.remove('recording');s.button.textContent=s.buttonLabel}};
  function destroy(s){
    if(s.timeout){clearTimeout(s.timeout);s.timeout=null}
    if(s.recognition){const r=s.recognition;r.onresult=null;r.onerror=null;r.onend=null;try{r.abort()}catch(_){}s.recognition=null}
    if(s.recorder){const r=s.recorder;r.ondataavailable=null;r.onstop=null;r.onerror=null;if(r.state==='recording'){try{r.stop()}catch(_){}}s.recorder=null}
    if(s.stream){s.stream.getTracks().forEach(t=>t.stop());s.stream=null}
    resetButton(s);
  }
  function cancel(){
    if(!active) return;
    const s=active;active=null;s.cancelled=true;destroy(s);
    if(s.url){URL.revokeObjectURL(s.url);s.url=null;if(s.playback){playbackUrls.delete(s.playback);s.playback.replaceChildren()}}
  }
  function toggle(options){
    const o={...options,button:get(options.button),status:get(options.status),playback:get(options.playback)};
    if(!o.button || !o.status){throw new Error('Faltan controles de voz')}
    if(active?.button===o.button){active.stop();return}
    cancel();
    if(o.playback)clearPlayback(o.playback);
    const s={...o,compatMode:!!(o.recognize && window.VoxSpeechDiagnostics?.compatibleMode?.()),buttonLabel:o.button.textContent,recording:false,stopping:false,speechDone:!o.recognize,speechStarted:false,recorderDone:false,transcript:'',speechError:'',recorderError:'',url:null,stream:null,recognition:null,recorder:null,chunks:[],startTime:0,timeout:null,cancelled:false,finished:false};
    s.isCurrent=()=>active===s && !s.cancelled;
    s.stop=()=>{
      if(!s.isCurrent()||s.stopping)return;
      s.stopping=true;
      s.button.textContent='⌛ Procesando…';s.button.disabled=true;
      if(s.recognition && !s.speechDone){
        try{s.recognition.stop()}catch(e){s.speechDone=true;s.speechError||='unknown'}
      }
      if(s.recorder && s.recorder.state==='recording'){
        try{s.recorder.requestData?.()}catch(_){}
        try{s.recorder.stop()}catch(e){s.recorderDone=true;s.recorderError=errText(e)}
      }else if(!s.recorder) s.recorderDone=true;
      safeMsg(s,'Finalizando grabación y transcripción. Espera unos segundos…');
      s.timeout=setTimeout(()=>{if(!s.isCurrent()||s.finished)return;s.speechDone=true;s.speechError||='timeout';finalize(s)},5500);
      finalize(s);
    };
    active=s;
    const start=async()=>{
      s.button.classList.add('recording');s.button.textContent='⌛ Activando micrófono…';s.button.disabled=true;
      safeMsg(s,'Pidiendo permiso al micrófono…');
      if(s.compatMode){s.recorderDone=true}
      else if(navigator.mediaDevices?.getUserMedia && window.MediaRecorder){
        try{
          const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
          if(!s.isCurrent()||s.stopping){stream.getTracks().forEach(t=>t.stop());if(s.stopping&&s.isCurrent()){s.recorderDone=true;finalize(s)}return}
          s.stream=stream;
          const formats=['audio/webm;codecs=opus','audio/webm','audio/mp4'];
          const mime=formats.find(type=>MediaRecorder.isTypeSupported?.(type));
          const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
          s.recorder=recorder;
          recorder.ondataavailable=e=>{if(e.data?.size>0)s.chunks.push(e.data)};
          recorder.onerror=e=>{s.recorderError=errText(e.error||e);safeMsg(s,s.recorderError)};
          recorder.onstop=()=>{
            s.recorderDone=true;
            if(s.stream){s.stream.getTracks().forEach(t=>t.stop());s.stream=null}
            const blob=new Blob(s.chunks,{type:recorder.mimeType||'audio/webm'});
            if(blob.size && s.isCurrent()){
              s.url=URL.createObjectURL(blob);
              if(s.playback){clearPlayback(s.playback);playbackUrls.set(s.playback,s.url);const audio=document.createElement('audio');audio.controls=true;audio.preload='metadata';audio.setAttribute('aria-label','Reproducir mi voz grabada');audio.src=s.url;s.playback.replaceChildren(audio)}
              s.audioReady=true;
              if(typeof s.onAudio==='function')s.onAudio({blob,durationSeconds:Math.max(1,Math.round((Date.now()-s.startTime)/1000)),url:s.url});
            }else if(s.isCurrent()){s.recorderError||='Grabación vacía. Prueba de nuevo.'}
            finalize(s);
          };
          recorder.start(250);
          s.startTime=Date.now();s.recording=true;
        }catch(e){s.recorderError=errText(e);s.recorderDone=true}
      }else{s.recorderError='Este navegador no permite grabar audio localmente.';s.recorderDone=true}
      if(!s.isCurrent())return;
      const Recognition=SR();
      if(s.recognize && Recognition){
        try{
          const r=new Recognition();s.recognition=r;r.lang=s.lang||'en-US';r.interimResults=false;r.continuous=false;r.maxAlternatives=1;
          r.onresult=e=>{if(!s.isCurrent())return;const parts=[];for(let i=0;i<e.results.length;i++){const result=e.results[i];if(result[0]?.transcript)parts.push(result[0].transcript)}if(parts.length)s.transcript=parts.join(' ').trim()};
          r.onerror=e=>{if(!s.isCurrent())return;s.speechError=e.error||'unknown';if(!s.stopping)safeMsg(s,`⚠️ Código [${s.speechError}]: ${MSG[s.speechError]||'Fallo no identificado.'}`)};
          r.onend=()=>{if(!s.isCurrent())return;s.speechDone=true;if(s.stopping){finalize(s);return}if(s.compatMode||!s.recording){s.stop();return}safeMsg(s,s.transcript?'✅ Transcripción recibida. Puedes continuar grabando y pulsar «Detener y evaluar».':'El reconocimiento terminó; la grabación sigue activa. Pulsa «Detener y evaluar» para guardar tu voz.');};
          r.start();s.speechStarted=true;
        }catch(e){s.speechError=e.name||'unknown';s.speechDone=true}
      }else if(s.recognize){s.speechError='unsupported';s.speechDone=true}
      if(!s.isCurrent())return;
      if(!s.recording&&!s.speechStarted){safeMsg(s,s.recorderError||'El reconocimiento y la grabación no están disponibles.');active=null;destroy(s);return}
      s.button.textContent='■ Detener y evaluar';s.button.disabled=false;
      safeMsg(s,s.compatMode?'🔎 Modo compatible: reconocimiento sin grabación simultánea. Habla y pulsa «Detener y evaluar».':s.recorderError?`${s.recorderError} Habla para intentar transcripción.`:'🎙 Grabando. Habla y pulsa «Detener y evaluar»; después podrás escuchar tu voz.');
    };
    start().catch(e=>{if(s.isCurrent()){safeMsg(s,errText(e));resetButton(s);active=null}});
  }
  function finalize(s){
    if(!s.isCurrent()||s.finished||!s.stopping||!s.speechDone||!s.recorderDone)return;
    s.finished=true;if(s.timeout){clearTimeout(s.timeout);s.timeout=null}
    resetButton(s);active=null;
    const spoken=s.transcript.trim();
    if(spoken){
      if(s.status)s.status.textContent=`Chrome reconoció: “${spoken}”. ${s.audioReady?'Puedes reproducir tu grabación abajo.':''}`;
      try{s.onText?.(spoken)}catch(error){if(s.status)s.status.textContent=`Audio listo. La evaluación falló: ${error.message}`}
    }else if(s.status && !s.recognize){
      s.status.textContent=s.audioReady?'Grabación disponible. Puedes reproducirla o grabar otra vez.':(s.recorderError||'No se recibió audio; puedes intentarlo nuevamente.');
    }else if(s.status){
      const code=s.speechError||'no-result';
      const reason=MSG[code]||MSG.unknown;
      const why=`⚠️ Reconocimiento [${code}]: ${reason} No se asigna puntuación sin transcripción. Abre «Diagnóstico del reconocimiento» en Inicio para enviar el código.`;
      s.status.textContent=s.audioReady?`✅ Grabación disponible para reproducir. ${why}`:(s.recorderError||why);
    }
    s.onComplete?.({transcript:spoken,audioReady:!!s.audioReady,recognitionError:s.speechError,recordError:s.recorderError});
  }
  window.VoxVoice={toggle,cancel,clearPlayback};
})();
