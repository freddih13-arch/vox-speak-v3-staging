import {QUESTIONS} from './questions.js';
import {startDiagnostic,nextQuestion,recordAnswer,finishDiagnostic,createDiagnostic} from './engine.js';
import {saveApp,downloadBackup} from '../core/storage.js';
const byId=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));

/** Rendered exclusively on the client; audio from external providers is never fabricated. */
export function mountDiagnostic(initialState,storage=localStorage){
 const root=byId('diag-root');if(!root)return;
 let state=initialState,feedback=null,recognition=null,recorder=null,stream=null,audioURL=null,timer=null,recordStart=0,recordedSeconds=0,playing=0,preparedVocab=null,currentQuestionId=null;
 const persist=(nextState)=>{saveApp(nextState,storage);state=nextState;updateHome()};
 const status=(value)=>{const node=byId('diag-status');if(node)node.textContent=value};
 const updateHome=()=>{const el=byId('diagnostic-home-status');if(!el)return;const d=state.diagnostic;el.textContent=d.status==='completed'?'✓ Diagnóstico completado':d.status==='in_progress'?`${Object.keys(d.answers).length}/${QUESTIONS.length} tareas · continuar`:'Tu primer diagnóstico está listo';const btn=byId('home-diagnostic-cta');if(btn)btn.textContent=d.status==='completed'?'Ver mi diagnóstico →':d.status==='in_progress'?'Continuar diagnóstico →':'Iniciar diagnóstico →';};
 function cleanAudio(){
  window.VoxVoice?.cancel();window.VoxVoice?.clearPlayback('diag-pron-audio-playback');window.VoxVoice?.clearPlayback('diag-speak-audio-player');
  if(timer){clearInterval(timer);timer=null}
  if(recognition){try{recognition.abort()}catch(_){ }recognition=null}
  if(recorder?.state==='recording'){try{recorder.stop()}catch(_){}}
  recorder=null;if(stream){stream.getTracks().forEach(track=>track.stop());stream=null}
  if(audioURL){URL.revokeObjectURL(audioURL);audioURL=null}
  recordStart=0;recordedSeconds=0;
 }
 function update(next){persist({...state,diagnostic:next})}
 function download(){try{downloadBackup(storage)}catch(error){status(error.message)}}
 function speak(text,rate=.94){if(!window.speechSynthesis){status('Tu dispositivo no ofrece lectura de voz; puedes omitir esta pregunta.');return false}
  try{speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(text);utter.lang='en-US';utter.rate=rate;speechSynthesis.speak(utter);return true}catch(_){status('No se pudo reproducir la voz sintética. Puedes omitir esta pregunta.');return false}
 }
 function showIntro(){root.innerHTML=`<div class="card diag-card"><h2>Antes de empezar</h2><p>Este diagnóstico tiene <strong>22 tareas</strong>: 8 de listening, 6 de recuperación de frases, 4 de reconocimiento de palabras y 4 respuestas orales. Estimación: 30–40 minutos. Puedes pausarlo cuando quieras.</p><p class="muted-small">Las calificaciones no son certificaciones MCER. La pronunciación se estima solo por palabras reconocidas; el speaking usa una autoevaluación tras escuchar tu propia grabación.</p><div class="diag-notice">🎧 Haz la prueba en un lugar tranquilo. No leas transcripciones antes de contestar. No necesitas Azure ni registrarte.</div><div class="row"><button class="btn primary" id="diag-begin">Comenzar evaluación</button><button class="btn ghost" id="diag-backup">Descargar respaldo de mis datos</button></div><p class="fineprint">Los datos de VOX 2.1 siguen intactos. No almacenamos grabaciones en esta etapa. El reconocimiento del navegador puede procesar voz en servicios externos.</p></div>`;
  byId('diag-begin').onclick=()=>{update(startDiagnostic(state.diagnostic));render()};byId('diag-backup').onclick=download;
 }
 function chooseRating(){return `<div class="diag-choices" role="group" aria-label="Autoevaluación después de escucharte"><button class="btn small" data-rating="0">0 · No pude responder</button><button class="btn small" data-rating="1">1 · Respondí con mucha ayuda</button><button class="btn small" data-rating="2">2 · Respondí con algunas pausas</button><button class="btn small" data-rating="3">3 · Respondí con fluidez suficiente</button></div>`}
 function addFeedback(q,answer){const text=answer.skipped?'Tarea omitida. No se contará como un error de habilidad.':q.kind==='listen'?`Respuesta ${answer.correct?'correcta':'incorrecta'}. La pregunta era: “${q.en}”.`:q.kind==='vocab'?`Modelo de referencia: “${q.refs[0]}”. Coincidencia textual: ${answer.matchPercent}%. Las traducciones alternativas correctas podrían recibir una puntuación baja.`:q.kind==='pron'?`El navegador transcribió: “${answer.transcript}”. Palabras coincidentes: ${answer.proxyWordMatch}%. Esto NO mide fonemas ni acento.`:`Grabación realizada: ${answer.durationSeconds} segundos. Autoevaluación registrada: ${answer.rating}/3. No es una evaluación externa de fluidez.`;
  root.innerHTML=`<div class="card diag-card"><p class="eyebrow">Resultado de esta tarea</p><h2>${answer.skipped?'Sin calificación':q.kind==='speak'?'Reflexión registrada':'Retroalimentación'}</h2><p>${esc(text)}</p><div class="row"><button class="btn primary" id="diag-continue">Continuar →</button><button class="btn ghost" id="diag-save-exit">Pausar ahora</button></div></div>`;
  byId('diag-continue').onclick=()=>{feedback=null;render()};byId('diag-save-exit').onclick=()=>{feedback=null;window.scrollTo(0,0);document.querySelector('[data-go="home"]')?.click()};
 }
 function submit(q,response){try{cleanAudio();const updated=recordAnswer(state.diagnostic,q.id,response);update(updated);feedback=q.id;addFeedback(q,updated.answers[q.id])}catch(error){status(error.message)}}
 function frame(q){
  const completed=Object.keys(state.diagnostic.answers).length;
  root.innerHTML=`<div class="diag-progress"><div class="row" style="justify-content:space-between"><strong>Tarea ${completed+1} / ${QUESTIONS.length}</strong><span class="tiny">${q.domain==='professional'?'💼 Inglés profesional':'☀️ Vida cotidiana'}</span></div><div class="progressline"><div class="fill" style="width:${Math.round(100*completed/QUESTIONS.length)}%"></div></div></div><div class="card diag-card" id="diag-content"></div><div class="row" style="margin-top:14px"><button class="btn small ghost" id="diag-skip">Omitir esta tarea</button><button class="btn small ghost" id="diag-pause">Pausar y volver al inicio</button></div><div class="notice diag-status" id="diag-status" role="status" aria-live="polite">Tus respuestas se guardan automáticamente.</div>`;
  byId('diag-skip').onclick=()=>submit(q,{skipped:true});byId('diag-pause').onclick=()=>{cleanAudio();document.querySelector('[data-go="home"]')?.click()};
 }
 function listening(q){
  frame(q);const pane=byId('diag-content');pane.innerHTML=`<p class="eyebrow">01 · Comprensión auditiva</p><h2>¿Qué te preguntaron?</h2><p class="muted-small">Escucha sin ver el inglés. Elige el significado más preciso.</p><button class="btn primary" id="diag-play">🔊 Escuchar pregunta</button><div class="diag-choices">${q.choices.map((choice,i)=>`<button class="diag-answer" data-choice="${i}">${esc(choice)}</button>`).join('')}</div>`;
  byId('diag-play').onclick=()=>{if(speak(q.en))playing++};
  pane.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>{if(!playing){status('Escucha la pregunta antes de responder.');return}submit(q,{choice:Number(button.dataset.choice),plays:playing})});
 }
 function vocabulary(q){
  frame(q);byId('diag-content').innerHTML=`<p class="eyebrow">02 · Recuperación activa</p><h2>Exprésalo en inglés</h2><p class="diag-question">${esc(q.es)}</p><label for="diag-written" class="muted-small">Escribe la frase en inglés sin consultar la respuesta.</label><textarea id="diag-written" maxlength="400" rows="3" placeholder="I..." autocomplete="off"></textarea><div class="row"><button class="btn primary" id="diag-vocab-submit">Verificar mi intento</button></div>`;
  byId('diag-vocab-submit').onclick=()=>{
   const text=byId('diag-written').value.trim();if(!text){status('Escribe tu respuesta antes de continuar.');return}
   // Display alternatives before final confirmation; avoid falsely rejecting valid synonyms.
   preparedVocab=text;const provisional=q.refs.map(ref=>ref).join(' | ');
   byId('diag-content').innerHTML=`<p class="eyebrow">Comparación, no corrección automática de gramática</p><h2>Tu intento</h2><p class="diag-question">${esc(text)}</p><p class="muted-small">Referencias propuestas: ${esc(provisional)}</p><p>¿Tu frase también expresa correctamente esa idea aunque use otras palabras?</p><div class="row"><button class="btn primary" id="diag-vocab-confirm">Registrar sin validar equivalencia</button><button class="btn ghost" id="diag-vocab-alternate">Considero mi respuesta equivalente</button></div><p class="fineprint">La equivalencia marcada por ti aparecerá como autoevaluación, separada del resultado automático.</p>`;
   byId('diag-vocab-confirm').onclick=()=>submit(q,{text:preparedVocab,selfValidated:false});byId('diag-vocab-alternate').onclick=()=>submit(q,{text:preparedVocab,selfValidated:true});
  };
 }
 function pronunciation(q){
  frame(q);byId('diag-content').innerHTML=`<p class="eyebrow">03 · Inteligibilidad aproximada</p><h2>Escucha y repite</h2><p class="diag-question" lang="en">${esc(q.en)}</p><p class="muted-small">${esc(q.hint)}</p><div class="row"><button class="btn ghost" id="diag-pron-play">🔊 Escuchar modelo</button><button class="btn primary" id="diag-pron-mic">🎙 Repetir</button></div><div id="diag-pron-audio-playback" class="playback" aria-live="polite"></div><p id="diag-pron-text" class="muted-small" aria-live="polite">La grabación aparecerá aquí aunque Chrome no consiga transcribirla.</p><button class="btn primary" id="diag-pron-confirm" hidden>Guardar palabras reconocidas →</button><p class="fineprint">La grabación queda local; el navegador puede procesar el audio en un servicio externo para transcribirlo. Sin transcripción no asignamos nota ni un falso cero.</p>`;
  byId('diag-pron-play').onclick=()=>speak(q.en);
  let transcript='';
  byId('diag-pron-mic').onclick=()=>window.VoxVoice.toggle({button:'diag-pron-mic',status:'diag-status',playback:'diag-pron-audio-playback',recognize:true,lang:'en-US',onText:value=>{
    transcript=value;
    byId('diag-pron-text').textContent=`Chrome reconoció: “${value}”. Escucha tu grabación antes de guardar.`;
    byId('diag-pron-confirm').hidden=false;
  }});
  byId('diag-pron-confirm').onclick=()=>{if(transcript)submit(q,{transcript})};
 }
 function speaking(q){
  frame(q);byId('diag-content').innerHTML=`<p class="eyebrow">04 · Respuesta espontánea</p><h2>Contesta hablando en inglés</h2><p class="diag-question" lang="en">${esc(q.en)}</p><p class="muted-small">${esc(q.es)}</p><p>Graba una respuesta de 30–60 segundos. Después escúchate y valora tu desempeño. El audio es temporal y no se sube a nuestros servidores.</p><div class="row"><button class="btn ghost" id="diag-speak-play">🔊 Escuchar pregunta</button><button class="btn primary" id="diag-speak-record">⏺ Grabar respuesta</button></div><div id="diag-speak-audio-player" class="playback"></div><div id="diag-self-rating"></div>`;
  byId('diag-speak-play').onclick=()=>speak(q.en);
  byId('diag-speak-record').onclick=()=>window.VoxVoice.toggle({button:'diag-speak-record',status:'diag-status',playback:'diag-speak-audio-player',recognize:false,onAudio:({durationSeconds})=>{
    const panel=byId('diag-self-rating');if(!panel)return;
    panel.innerHTML=`<p>Reproduce tu voz y elige una autoevaluación. Grabación: ${durationSeconds} segundos.</p>${chooseRating()}`;
    panel.querySelectorAll('[data-rating]').forEach(button=>button.onclick=()=>submit(q,{rating:Number(button.dataset.rating),durationSeconds}));
  }});
 }
 function showDone(){const r=state.diagnostic.report;if(!r)return;
 const label=(n,total)=>total?`${n} de ${total}`:'Sin muestras';
 root.innerHTML=`<div class="card diag-card"><p class="eyebrow">Línea base completada</p><h2>Este es tu punto de partida</h2><p>Estas mediciones describen respuestas a ejercicios concretos; no equivalen a un examen MCER ni a un diagnóstico certificado de nivel.</p><div class="diag-results">
 <div class="metric"><strong>${label(r.measured.listening.correct,r.measured.listening.attempted)}</strong><span>Listening · respuestas correctas</span></div>
 <div class="metric"><strong>${label(r.measured.vocabulary.exactMatches,r.measured.vocabulary.attempted)}</strong><span>Traducciones exactas aceptadas</span></div>
 <div class="metric"><strong>${r.measured.pronunciationProxy.meanWordMatch===null?'—':r.measured.pronunciationProxy.meanWordMatch+'%'}</strong><span>Palabras reconocidas · NO puntuación fonética</span></div>
 <div class="metric"><strong>${r.selfReported.speaking.attempted}</strong><span>Autoevaluaciones orales (no verificadas)</span></div></div>
 <div class="diag-notice">Pruebas finalizadas: ${r.totalAnswered}/${r.totalAvailable}. Speaking autoevaluado: ${r.selfReported.speaking.meanConfidence===null?'sin muestras':r.selfReported.speaking.meanConfidence+'% de la escala subjetiva'}. No constituye una puntuación externa. Áreas medidas con límites explícitos.</div>
 <div class="row"><button class="btn primary" id="diag-done-home">Volver a entrenar</button><button class="btn ghost" id="diag-done-backup">Descargar respaldo</button><button class="btn ghost" id="diag-restart">Repetir diagnóstico (guardar historial)</button></div>
 <p class="fineprint">La primera evaluación queda guardada en VOX 3. El entrenamiento anterior de VOX 2.1 permanece separado e intacto.</p></div>`;
 byId('diag-done-home').onclick=()=>document.querySelector('[data-go="home"]')?.click();byId('diag-done-backup').onclick=download;
 byId('diag-restart').onclick=()=>{if(!confirm('¿Repetir diagnóstico? Guardaremos la evaluación anterior en el historial de VOX 3.'))return;
  const previous=state.diagnostic;persist({...state,diagnosticHistory:[...(state.diagnosticHistory||[]),previous].slice(-12),diagnostic:createDiagnostic()});render()};
 }
 function render(){cleanAudio();playing=0;const d=state.diagnostic;
  if(d.status==='not_started'){showIntro();return}if(d.status==='completed'){showDone();return}
  const q=nextQuestion(d);if(!q){try{update(finishDiagnostic(d));render()}catch(error){status(error.message)}return}
  currentQuestionId=q.id;
  if(feedback===q.id){addFeedback(q,d.answers[q.id]);return}
  if(q.kind==='listen')listening(q);else if(q.kind==='vocab')vocabulary(q);else if(q.kind==='pron')pronunciation(q);else speaking(q);
 }
 window.addEventListener('vox:tab-change',e=>{if(e.detail?.tab!=='diagnostic'){cleanAudio();speechSynthesis?.cancel?.()}});
 updateHome();render();return {getState:()=>state,render};
}
