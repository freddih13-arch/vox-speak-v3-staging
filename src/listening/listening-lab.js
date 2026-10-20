import {readState,persist,nextQuestion,optionsFor,recordAnswer,summarize} from './engine.js';

const $=id=>document.getElementById(id);
const root=$('listen');
if(root){
  let {state,writable}=readState();
  const el={count:$('listen-count'),mode:$('listen-mode'),rate:$('listen-rate'),play:$('play-listen'),options:$('listen-options'),result:$('listen-result'),next:$('next-listen'),status:$('listen-status'),reveal:$('listen-reveal'),summary:$('listen-summary'),topic:$('listen-topic')};
  let current=null,choices=[],plays=0,answered=false,revealed=false,activeUtterance=null;
  if(!writable){el.status.textContent='El historial anterior de este módulo es incompatible o no se pudo leer. No se sobrescribirá; puedes practicar durante esta sesión.';}
  function save(){if(writable&&!persist(state)){writable=false;el.status.textContent='No se pudo guardar el progreso de listening. La práctica continuará en esta sesión.';}}
  function chooseVoice(){if(!('speechSynthesis'in window))return null;const v=speechSynthesis.getVoices();return v.find(x=>/^en[-_]US/i.test(x.lang)&&/google|natural|neural/i.test(x.name))||v.find(x=>/^en[-_](US|GB)/i.test(x.lang))||v.find(x=>/^en/i.test(x.lang))||null;}
  function say(text,rate){if(!('speechSynthesis'in window)||!window.SpeechSynthesisUtterance){el.status.textContent='La voz no está disponible en este navegador. Usa «Ver texto sin puntuar».';return false;}
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=Number(rate);u.pitch=1;const voice=chooseVoice();if(voice)u.voice=voice;activeUtterance=u;
      u.onerror=()=>{if(activeUtterance===u&&!answered&&!revealed){plays=Math.max(0,plays-1);if(plays===0)el.options.querySelectorAll('button').forEach(b=>b.disabled=true);el.status.textContent='La voz no pudo reproducirse. Intenta otra vez o revela el texto sin puntuar.';}};
      speechSynthesis.speak(u);return true;
    }catch{el.status.textContent='Falló la reproducción de voz. Puedes revelar el texto sin puntuar.';return false;}
  }
  function updateSummary(){const s=summarize(state);el.summary.textContent=(s.total?`${s.total} escuchas evaluadas · ${s.last20}% de aciertos en las últimas ${Math.min(state.history.length,20)} · ${s.firstListenCorrect} correctas al primer intento`:'Aún no hay respuestas evaluadas. Escucha primero, decide después.')+(!writable?' · ⚠️ Datos de listening solo en memoria; no se sobrescribe el historial anterior.':'');}
  function render(){if(!current)return;el.count.textContent=`Pregunta nueva ${Math.max(1,state.seen.length)} / banco de 60`;el.topic.textContent=`${current.domain==='professional'?'💼 Profesional':'🌎 Cotidiano'} · ${current.topic}`;
    el.result.className='feedback hidden';el.result.replaceChildren();el.next.classList.add('hidden');el.options.replaceChildren();el.reveal.hidden=false;
    choices=optionsFor(current);choices.forEach((o,i)=>{const b=document.createElement('button');b.type='button';b.className='opt';b.disabled=true;const letter=document.createElement('span');letter.className='letter';letter.textContent=String.fromCharCode(65+i);const text=document.createElement('span');text.textContent=o.text;b.append(letter,text);b.addEventListener('click',()=>choose(i));el.options.append(b);});
    el.play.textContent='🔊 Escuchar pregunta (sin texto)';el.status.textContent='Escucha la pregunta antes de responder. El texto en inglés está oculto.';
    plays=0;answered=false;revealed=false;updateSummary();
  }
  function newQuestion(){if('speechSynthesis'in window)speechSynthesis.cancel();const p=nextQuestion(state,el.mode.value);state=p.state;current=p.question;save();render();}
  function replay(){if(!current||answered||revealed)return;if(say(current.question,el.rate.value)){plays++;el.play.textContent=plays===1?'🔁 Escuchar de nuevo':'🔁 Repetir pregunta';el.status.textContent=plays===1?'Primera escucha. Elige qué te preguntaron.':'Escucha adicional. Identifica la intención, no palabras sueltas.';el.options.querySelectorAll('button').forEach(x=>x.disabled=false);}}
  function addP(parent,tag,text){const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;}
  function showResult(correct,skip=false){const box=el.result;box.className='feedback notice '+(skip?'warn':correct?'good':'warn');box.replaceChildren();
    addP(box,'strong',skip?'Texto revelado: intento sin puntuación.':correct?'✓ Interpretaste correctamente la pregunta.':'✦ La intención era diferente: revisa los matices.');
    addP(box,'p',`Preguntaron: “${current.question}”`);
    addP(box,'p',`Significa: ${current.correct}`);
    addP(box,'p',`Clave: ${current.note}`);
    addP(box,'p',`Respuesta breve que podrías practicar: “${current.answer}”`);
    const example=document.createElement('button');example.type='button';example.className='btn small ghost';example.textContent='🔊 Escuchar respuesta modelo';example.addEventListener('click',()=>say(current.answer,0.9));box.append(example);
    el.next.classList.remove('hidden');el.reveal.hidden=true;el.play.disabled=false;updateSummary();
  }
  function choose(index){if(!current||answered||revealed||plays===0)return;answered=true;const correct=choices[index].correct;
    state=recordAnswer(state,current,{correct,plays});save();
    el.options.querySelectorAll('button').forEach((b,i)=>{b.disabled=true;b.classList.toggle('correct',choices[i].correct);b.classList.toggle('incorrect',i===index&&!correct);});
    window.dispatchEvent(new CustomEvent('vox:listening-scored',{detail:{correct}}));
    showResult(correct);
  }
  el.play.addEventListener('click',replay);
  el.next.addEventListener('click',newQuestion);
  el.reveal.addEventListener('click',()=>{if(answered||revealed||!current)return;revealed=true;el.options.querySelectorAll('button').forEach(b=>b.disabled=true);showResult(false,true);});
  el.mode.addEventListener('change',()=>{if(!['mixed','professional','general'].includes(el.mode.value))return;state.queue=[];newQuestion();});
  window.addEventListener('vox:tab-change',({detail})=>{if(detail?.tab!=='listen'&&'speechSynthesis'in window){speechSynthesis.cancel();activeUtterance=null;}});
  el.mode.value=['mixed','professional','general'].includes(state.mode)?state.mode:'mixed';newQuestion();
}
