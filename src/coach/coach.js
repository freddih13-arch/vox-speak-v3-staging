import {TOTAL_DAYS,QUESTIONS,STORE_KEY,planForDay,getDayTheme,emptyState,safeLoad,safeSave,finishStep,dueReviews,progress} from './curriculum.js';
/** VOX Coach: additive session shell. Reuses authored exercises, microphone and browser voices.
 * All voice/phoneme limitations stay explicit: never claim pronunciation scores or CEFR certification. */
const $=id=>document.getElementById(id);
const legacy=window.VOX_LEGACY_EXERCISES;
const home=$('coach-home'),screen=$('coach');
const technicalCard=$('speech-tech-card'),diagnosticCard=$('diagnostic-callout');
if(home&&screen&&legacy){
 const saved=safeLoad(localStorage);let state=saved.state,writable=saved.writable;
 let now=null,tries=0,answered=false,firstVerdict=null,attemptedVoice=false,recording=false,activeUtterance=null,epoch=0,reviewItem=null;
 const lesson=$('coach-content'),feedback=$('coach-feedback'),status=$('coach-status'),progressEl=$('coach-progress-text'),primary=$('coach-primary');
 const ensureSave=()=>{if(writable&&!safeSave(localStorage,state)){writable=false;showStatus('Tu práctica continúa, pero el navegador no está guardando avances. Usa Exportar para conservarla.');}};
 function showStatus(s){if(status)status.textContent=s}
 function voiceStop(){if('speechSynthesis' in window)try{speechSynthesis.cancel()}catch{};activeUtterance=null}
 function stopActivity(){epoch++;voiceStop();window.VoxVoice?.cancel();recording=false;}
 function speak(text,rate=0.92,onStart){if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){showStatus('Este navegador no ofrece voz. Puedes mostrar el texto y practicar sin calificación.');return false}
  try{voiceStop();const id=++epoch,u=new SpeechSynthesisUtterance(text);activeUtterance=u;u.lang='en-US';u.rate=rate;u.pitch=1;const voices=speechSynthesis.getVoices?.()||[];u.voice=voices.find(v=>/^en-US/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang))||null;
   u.onstart=()=>{if(activeUtterance!==u||id!==epoch)return;onStart?.();showStatus('Escuchando. Puedes repetir cuantas veces necesites.')};
   u.onerror=()=>{if(activeUtterance!==u)return;showStatus('La voz no pudo reproducirse. Prueba de nuevo o muestra el texto.');activeUtterance=null};
   u.onend=()=>{if(activeUtterance===u)activeUtterance=null};speechSynthesis.speak(u);return true;
  }catch{showStatus('No se pudo iniciar la voz. Puedes leer el texto y continuar como práctica.');return false}}
 const stopAndLeave=()=>{stopActivity();document.querySelector('nav [data-go="home"]')?.click()};
 function openCoach(){document.querySelector('nav [data-go="coach"]')?.click();render();}
 // Override the old button's handler, which jumps between legacy tabs without a saved session.
 const original=$('start-session');if(original)original.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openCoach()},{capture:true});
 function makeButton(label,fn,cls='btn ghost'){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.addEventListener('click',fn);return b}
 function makeParagraph(text,cls){const p=document.createElement('p');p.textContent=text;if(cls)p.className=cls;return p}
 function renderHome(){const p=progress(state),done=state.day>=TOTAL_DAYS,idx=Math.min(state.day+1,TOTAL_DAYS);home.replaceChildren();
  const hero=document.createElement('div');hero.className='coach-hero';hero.innerHTML='<div class="coach-kicker">VOX SPEAK · TU ENTRENADOR</div><h1>Tu inglés, con dirección.</h1><p>Entiende preguntas nuevas, responde en voz alta y repasa lo que te costó. Sin perderte entre menús.</p>';home.append(hero);
  const card=document.createElement('div');card.className='coach-card';
  const kicker=document.createElement('div');kicker.className='coach-kicker';kicker.textContent=done?'Ruta inicial completada':'Sesión '+idx+' de 30';card.append(kicker);
  const title=document.createElement('h2');title.textContent=done?'30 sesiones completadas':getDayTheme(state.day);title.style.marginTop='8px';card.append(title);
  card.append(makeParagraph(done?'Ahora puedes repasar y volver a los ejercicios que más necesitas.':'Hoy trabajaremos cuatro pasos claros. Tiempo sugerido: 20–30 minutos, a tu ritmo.','coach-muted'));
  const rail=document.createElement('div');rail.className='coach-progress';const fill=document.createElement('span');fill.style.width=((state.completed.length/TOTAL_DAYS)*100)+'%';rail.append(fill);card.append(rail);
  const pills=document.createElement('div');pills.className='coach-pills';for(const v of ['60 % profesional · 40 % cotidiano','Sin APIs de pago','Tu avance se guarda aquí']){const sp=document.createElement('span');sp.className='coach-pill';sp.textContent=v;pills.append(sp)}card.append(pills);
  const steps=document.createElement('div');steps.className='coach-steps';for(const [i,label,tip] of [[1,'Comprende preguntas nuevas','Dos audios; identifica el significado.'],[2,'Imita una frase útil','Escucha, repite y graba si quieres.'],[3,'Responde en contexto','Practica una entrevista con feedback guiado.']]){const row=document.createElement('div');row.className='coach-step';const n=document.createElement('span');n.className='coach-index';n.textContent=i;const col=document.createElement('div');const b=document.createElement('b');b.textContent=label;col.append(b,makeParagraph(tip,'coach-muted'));row.append(n,col);steps.append(row)}card.append(steps);
  card.append(makeButton(done?'Repasar mis preguntas difíciles':state.step?'▶ Retomar mi sesión':'▶ Comenzar mi sesión',done?()=>{reviewItem=findReview();openCoach()}:openCoach,'coach-main-action'));home.append(card);
  const stats=document.createElement('div');stats.className='coach-card';stats.append(makeParagraph('TU AVANCE REAL','coach-kicker'));const grid=document.createElement('div');grid.className='coach-numbers';for(const [a,b] of [[p.done+'/30','sesiones'],[p.listenCount?Math.round(100*p.correct/p.listenCount)+'%':'—','comprensión'],[dueReviews(state),'por repasar']]){const box=document.createElement('div'),n=document.createElement('strong');n.textContent=a;box.append(n,makeParagraph(b));grid.append(box)}stats.append(grid);const review=makeButton('↻ Repasar preguntas difíciles',()=>{reviewItem=findReview();if(!reviewItem){openCoach();showStatus('Aún no tienes preguntas pendientes. Empieza una sesión para crear tus repasos.');return}openCoach()},'btn ghost full');review.style.marginTop='12px';stats.append(review);home.append(stats);
  const tools=document.createElement('details');tools.id='coach-home-tools';tools.className='coach-card';const summary=document.createElement('summary');summary.textContent='Explorar herramientas, diagnóstico y entrenamiento libre';tools.append(summary);const menu=document.createElement('div');menu.className='coach-tool-grid';for(const [dest,title] of [['listen','Listening libre'],['pronounce','Pronunciación'],['interview','Entrevista libre'],['islands','Islas de frases'],['diagnostic','Diagnóstico inicial'],['progress','Historial clásico']])menu.append(makeButton(title,()=>document.querySelector(`[data-go="${dest}"]`)?.click(),'btn ghost small'));tools.append(menu);if(technicalCard){technicalCard.style.display='';tools.append(technicalCard)}if(diagnosticCard){diagnosticCard.style.display='';tools.append(diagnosticCard)}home.append(tools);
  if(!writable)home.prepend(makeParagraph('Aviso: el almacenamiento del navegador no está disponible. Tu progreso anterior permanece intacto; esta sesión puede no persistir.','notice warn'));
 }
 function findReview(){return state.review.find(x=>x.due<=state.day&&QUESTIONS.some(q=>q.id===x.id))||null}
 function setReview(id,success){const item=state.review.find(x=>x.id===id);if(!item)return;const count=(item.attempts||1)+1;if(success){state.review=state.review.filter(x=>x.id!==id)}else{item.attempts=count;item.due=Math.max(state.day,0)+Math.min(7,Math.pow(2,Math.min(count,3))-1)}ensureSave();renderHome()}
 function render(){stopActivity();tries=0;answered=false;firstVerdict=null;attemptedVoice=false;feedback.hidden=true;feedback.replaceChildren();status.textContent='';progressEl.textContent='';primary.hidden=true;reviewItem=reviewItem&&state.review.find(x=>x.id===reviewItem.id)||null;
  const done=state.day>=TOTAL_DAYS;
  $('coach-exit').onclick=stopAndLeave;
  $('coach-review').onclick=()=>{reviewItem=findReview();render();if(!reviewItem)showStatus('No tienes repasos pendientes. Continúa con tu sesión.')};
  if(reviewItem){renderReview();return}
  if(done){renderCompleted();return}
  const plan=planForDay(state.day,legacy),task=plan[state.step],top=state.step+1;
  $('coach-phase').textContent='Sesión '+(state.day+1)+' de 30 · Paso '+top+'/4';$('coach-heading').textContent=task.type==='listen'?'Entiende antes de responder':task.type==='phrase'?'Escucha y repite':'Responde en inglés';
  const bar=$('coach-lesson-bar');bar.style.width=(((state.day*4+state.step)/120)*100)+'%';progressEl.textContent='Progreso: '+(state.day*4+state.step)+' de 120 ejercicios · '+(dueReviews(state))+' repasos pendientes';
  if(task.type==='listen')renderListen(task);else if(task.type==='phrase')renderPhrase(task);else renderInterview(task);
 }
 function showFeedback(lines){feedback.replaceChildren();(Array.isArray(lines)?lines:[lines]).forEach(x=>feedback.append(makeParagraph(x)));feedback.hidden=false;}
 function finish(record){const beforeDay=state.day;state=finishStep(state,record);ensureSave();reviewItem=null;renderHome();if(state.day>beforeDay&&state.day<=30){showStatus('Sesión completada. Tu siguiente sesión está disponible cuando quieras.');}render()}
 function nextButton(record,label='Continuar →'){primary.hidden=false;primary.textContent=label;primary.onclick=()=>finish(record);}
 function addVoiceButton(text,parent,rate=.92,onstart){parent.append(makeButton('🔊 Escuchar / repetir',()=>speak(text,rate,onstart),'btn violet'))}
 function renderListen(task){const q=task.item;lesson.replaceChildren();lesson.append(makeParagraph('🎧 COMPRENSIÓN · '+(q.domain==='professional'?'PROFESIONAL':'COTIDIANA')+' · '+q.topic,'coach-kicker'),makeParagraph('Escucha antes de ver la pregunta. Puedes repetir el audio sin límite.','coach-muted'));
 const controls=document.createElement('div');controls.className='coach-actions';let started=false;
 controls.append(makeButton('🔊 Escuchar pregunta',()=>{speak(q.question,.90,()=>{started=true;if(!answered)options.querySelectorAll('button').forEach(b=>b.disabled=false)})},'btn violet'));
 controls.append(makeButton('👁 Ver texto (sin nota)',()=>{if(answered)return;answered=true;showFeedback(['La pregunta fue: '+q.question,'Significa: '+q.correct,'Pista: '+q.note,'No se asigna nota a este intento.']);nextButton({type:'listen',id:q.id,correct:null,assistance:true},'Continuar sin nota →');},'btn ghost'));
 lesson.append(controls);const options=document.createElement('div');const all=[{label:q.correct,correct:true},...q.distractors.map(label=>({label,correct:false}))];
 // Stable, visibly varied order per question; no random choices lost after navigating.
 const seed=[...(q.id||'')].reduce((a,c)=>a+c.charCodeAt(0),0);for(let i=all.length-1;i>0;i--){const k=(seed+i*7)%(i+1);[all[i],all[k]]=[all[k],all[i]]}
 function respond(choice){if(answered||!started)return;answered=true;firstVerdict=choice.correct;for(const b of options.querySelectorAll('button')){b.disabled=true;const item=all[Number(b.dataset.index)];b.classList.toggle('correct',item.correct);b.classList.toggle('incorrect',item===choice&&!choice.correct)}
  showFeedback([choice.correct?'✓ Entendiste correctamente.':'La interpretación correcta es: '+q.correct,'Pregunta: '+q.question,'Pista: '+q.note,'Respuesta útil: '+q.answer]);nextButton({type:'listen',id:q.id,correct:choice.correct,plays:tries||1});
 }
 all.forEach((x,i)=>{const b=makeButton(String.fromCharCode(65+i)+'. '+x.label,()=>respond(x),'coach-answer');b.dataset.index=i;b.disabled=true;options.append(b)});lesson.append(options);
 lesson.append(makeParagraph('Si no sale audio en tu Android, usa «Ver texto»; esa actividad no afectará tus aciertos.','coach-muted'));
 const replay=makeButton('↻ Practicar de nuevo esta pregunta',()=>{answered=false;started=false;options.querySelectorAll('button').forEach(b=>{b.disabled=true;b.classList.remove('correct','incorrect')});feedback.hidden=true;primary.hidden=true;showStatus('Reintento libre; el próximo registro contará solo la respuesta final.');},'btn ghost');lesson.append(replay);
 }
 function captureSpeech(prompt,container,output){const play=document.createElement('div');play.className='playback';container.append(play);let ended=false;const mic=makeButton('🎤 Grabar mi voz',()=>{
  if(!window.VoxVoice){showStatus('La grabación no está disponible. Puedes escribir o practicar por tu cuenta.');return}
  if(!recording){ended=false;attemptedVoice=false}recording=!recording;
  try{window.VoxVoice.toggle({button:mic,status,playback:play,recognize:true,lang:'en-US',onAudio:()=>{attemptedVoice=true;showStatus('Audio listo. Puedes reproducir tu grabación.');},onText:spoken=>{ended=true;attemptedVoice=true;output.value=spoken;output.dispatchEvent(new Event('input'));showStatus('Transcripción aproximada de Chrome. Revisa lo reconocido antes de continuar.');},onComplete:info=>{recording=false;if(info.audioReady)attemptedVoice=true;if(!ended&&!info.transcript&&info.recognitionError)showStatus('Chrome no transcribió ('+info.recognitionError+'). Tu audio se puede reproducir; puedes continuar sin puntuación.')}})}catch(e){recording=false;showStatus('No se pudo iniciar la grabación: '+e.message)}
 },'btn primary');container.append(mic);
 }
 function renderPhrase(task){const p=task.item;lesson.replaceChildren();lesson.append(makeParagraph('🎙 EXPRESIÓN · '+p.topic,'coach-kicker'));const phrase=makeParagraph(p.en,'coach-question');lesson.append(phrase,makeParagraph('Objetivo: pronunciar la frase, escuchar tu voz y repetirla hasta sentir más fluidez.','coach-muted'));
 addVoiceButton(p.en,lesson,.88);lesson.append(makeButton('🐢 Escuchar más lento',()=>speak(p.en,.72),'btn ghost'));
 const hidden=makeParagraph(p.es+' · Consejo: '+p.tip,'coach-muted');hidden.hidden=true;lesson.append(makeButton('👁 Mostrar significado y consejo',()=>{hidden.hidden=!hidden.hidden},'btn ghost'));lesson.append(hidden);
 const typed=document.createElement('textarea');typed.placeholder='Opcional: escribe lo que dijiste o lo que entendió Chrome.';typed.setAttribute('aria-label','Texto opcional de la frase pronunciada');lesson.append(typed);captureSpeech(p.en,lesson,typed);
 const mark=makeButton('✓ Ya la practiqué →',()=>{answered=true;const text=typed.value.trim();if(text){const expected=p.en.toLowerCase().match(/[a-z']+/g)||[],actual=text.toLowerCase().match(/[a-z']+/g)||[];const matched=expected.filter(w=>actual.includes(w)).length;showFeedback(['Chrome o tu texto coincidió con '+matched+' de '+expected.length+' palabras esperadas.','Esta es una comparación de palabras, NO una nota de pronunciación.','Vuelve a escuchar y repite el fragmento más difícil.'])}else{showFeedback(['Práctica registrada por ti. Sin transcripción no se asigna nota.','Escucha el modelo otra vez, repite y utiliza la frase en una situación propia.'])}nextButton({type:'phrase',id:task.id,voiceAttempt:attemptedVoice,textProvided:!!text});},'coach-main-action');lesson.append(mark);
 }
 function renderInterview(task){const p=task.item;lesson.replaceChildren();lesson.append(makeParagraph('💼 ENTREVISTA · '+p.role,'coach-kicker'),makeParagraph('Escucha la pregunta, luego responde en voz alta. Puedes apoyarte en texto si Chrome no transcribe.','coach-muted'));
 addVoiceButton(p.q,lesson,.9);const question=makeParagraph(p.q,'coach-question');question.hidden=true;lesson.append(question);lesson.append(makeButton('👁 Mostrar pregunta',()=>{question.hidden=!question.hidden},'btn ghost'));
 const typed=document.createElement('textarea');typed.placeholder='Escribe una respuesta propia o dicta con el micrófono. Ejemplo: I managed a B2B pipeline by...';typed.setAttribute('aria-label','Mi respuesta a la entrevista');lesson.append(typed);captureSpeech(p.q,lesson,typed);
 lesson.append(makeButton('🔎 Revisar mi respuesta',()=>{const content=typed.value.trim();if(!content){showFeedback(['Habla primero y escucha la grabación. Si Chrome no transcribe, puedes escribir una respuesta o comparar tu respuesta oral con el modelo.','Sin texto no hay revisión automática.']);nextButton({type:'interview',id:task.id,mode:'self-check'});return}
 const lower=content.toLowerCase(),terms=p.keys||[],hit=terms.filter(w=>lower.includes(w.toLowerCase()));const wordcount=content.split(/\s+/).length;
 showFeedback(['Ideas incluidas: '+(hit.join(', ')||'No se detectaron las palabras guía; también puedes expresarlas con sinónimos.')+'.','Extensión: '+wordcount+' palabras. '+(wordcount<18?'Prueba incluir situación, acción y resultado concreto.':'Buen punto de partida; revisa si incluyes un resultado verificable.'),'Sugerencia: '+p.tip,'Modelo para comparar, no memorizar: '+p.model,'Esta revisión de contenido es orientativa; no califica pronunciación, gramática integral ni nivel CEFR.']);nextButton({type:'interview',id:task.id,mode:'text-guided',wordcount});},'coach-main-action'));
 lesson.append(makeButton('💡 Ver ejemplo sin calificación',()=>showFeedback(['Referencia: '+p.model,'Pistas: '+p.tip,'Escúchala y luego contesta con tu experiencia real.']),'btn ghost'));
 }
 function renderReview(){const question=QUESTIONS.find(q=>q.id===reviewItem.id);if(!question){reviewItem=null;render();return}
 $('coach-phase').textContent='Repaso de errores';$('coach-heading').textContent='Vuelve a escuchar lo difícil';progressEl.textContent=dueReviews(state)+' pendientes de repaso';$('coach-lesson-bar').style.width=(state.completed.length/30*100)+'%';lesson.replaceChildren();lesson.append(makeParagraph('No buscamos memorizar la respuesta: escucha de nuevo, identifica la intención y luego vuelve a intentarlo.','coach-muted'));
 addVoiceButton(question.question,lesson,.91);const answer=makeParagraph('Significa: '+question.correct+' · '+question.note,'coach-muted');answer.hidden=true;lesson.append(makeButton('👁 Ver significado',()=>{answer.hidden=!answer.hidden},'btn ghost'));lesson.append(answer);
 lesson.append(makeButton('✓ Ahora la entendí',()=>{setReview(question.id,true);reviewItem=findReview();render()},'coach-main-action'));
 lesson.append(makeButton('↻ Necesito volver a repasar',()=>{setReview(question.id,false);reviewItem=findReview();render()},'btn ghost'));
 lesson.append(makeButton('Volver a mi sesión',()=>{reviewItem=null;render()},'btn ghost'));
 }
 function renderCompleted(){lesson.replaceChildren();$('coach-phase').textContent='Ruta completada · 30/30';$('coach-heading').textContent='30 sesiones terminadas';$('coach-lesson-bar').style.width='100%';progressEl.textContent='Has registrado '+state.answers.length+' actividades. El aprendizaje continúa con los repasos.';
 lesson.append(makeParagraph('Completaste las 30 sesiones guiadas. No significa un B2 certificado: ahora practica con preguntas nuevas, casos reales y repasos.','coach-muted'));
 lesson.append(makeButton('↻ Repasar preguntas difíciles',()=>{reviewItem=findReview();render()},'coach-main-action'));
 lesson.append(makeButton('Empezar otra ruta de 30 sesiones',()=>{if(!confirm('¿Iniciar otra ruta? Exporta antes tu progreso si deseas conservar este ciclo.'))return;state=emptyState();ensureSave();renderHome();render()},'btn ghost'));
 }
 $('coach-export').addEventListener('click',()=>{const a=document.createElement('a'),blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);a.href=url;a.download='vox-coach-30-progreso.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 window.addEventListener('vox:tab-change',e=>{if(e.detail?.tab!=='coach'){stopActivity();renderHome()}else render()});
 window.addEventListener('pagehide',stopActivity);
 window.VoxCoach={open:openCoach,getProgress:()=>progress(state)};
 renderHome();
}
