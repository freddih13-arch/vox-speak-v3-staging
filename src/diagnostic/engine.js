import {QUESTIONS} from './questions.js';
export const DIAGNOSTIC_VERSION=1;
export function createDiagnostic(){return {version:DIAGNOSTIC_VERSION,status:'not_started',startedAt:null,completedAt:null,answers:{},report:null}}
export function startDiagnostic(diag,now=new Date().toISOString()){if(diag.status==='completed')return diag;return {...diag,status:'in_progress',startedAt:diag.startedAt||now}}
export function nextQuestion(diag){return QUESTIONS.find(q=>!Object.hasOwn(diag.answers||{},q.id))||null}
export function clean(text){return String(text||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
export function wordMatch(target,transcribed){const a=clean(target).split(' ').filter(Boolean),b=clean(transcribed).split(' ').filter(Boolean);if(!a.length||!b.length)return 0;
 let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const row=[i];for(let j=1;j<=b.length;j++)row.push(Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1)));prev=row}
 return Math.max(0,Math.round(100*(1-prev[b.length]/Math.max(a.length,b.length))));}
export function evaluate(question,response){if(response?.skipped)return {skipped:true,domain:question.domain,kind:question.kind};
 if(question.kind==='listen')return {skipped:false,domain:question.domain,kind:'listen',correct:Number(response.choice)===question.answer,choice:Number(response.choice),plays:Math.max(0,Number(response.plays)||0)};
 if(question.kind==='vocab'){
   const text=String(response.text||'').trim().slice(0,400);if(!text)throw Error('Escribe una respuesta o selecciona Omitir.');
   const score=Math.max(...question.refs.map(ref=>wordMatch(ref,text)));return {skipped:false,kind:'vocab',domain:question.domain,text,reference:question.refs[0],matchPercent:score,exact:question.refs.some(ref=>clean(ref)===clean(text)),selfValidated:Boolean(response.selfValidated)};
 }
 if(question.kind==='pron'){
   const transcript=String(response.transcript||'').trim().slice(0,600);if(!transcript)throw Error('El motor no reconoció palabras. Repite u omite esta tarea.');
   return {skipped:false,kind:'pron',domain:question.domain,transcript,proxyWordMatch:wordMatch(question.en,transcript),engine:'web-speech',phonemeScore:null};
 }
 if(question.kind==='speak'){
  const rating=Number(response.rating),duration=Number(response.durationSeconds);if(!Number.isInteger(rating)||rating<0||rating>3||!Number.isFinite(duration)||duration<=0)throw Error('Grábate y elige una autoevaluación válida.');
  return {skipped:false,kind:'speak',domain:question.domain,rating,durationSeconds:Math.min(180,Math.round(duration)),assessor:'self',verifiedSpeakingScore:null};
 }
 throw Error('Tipo de pregunta desconocido.');
}
export function recordAnswer(diag,id,response,now=new Date().toISOString()){
 if(diag.status!=='in_progress')throw Error('El diagnóstico no está activo.');const next=nextQuestion(diag);
 if(!next || next.id!==id)throw Error('No corresponde a la siguiente pregunta.');
 const answer=evaluate(next,response);const answers={...diag.answers,[id]:{...answer,at:now}};
 return {...diag,answers};
}
const avg=a=>a.length?Math.round(a.reduce((s,x)=>s+x,0)/a.length):null;
export function summarize(diag){const pairs=QUESTIONS.map(q=>({q,a:diag.answers?.[q.id]})).filter(x=>x.a&&!x.a.skipped);
 const listen=pairs.filter(x=>x.q.kind==='listen'),vocab=pairs.filter(x=>x.q.kind==='vocab'),pron=pairs.filter(x=>x.q.kind==='pron'),speak=pairs.filter(x=>x.q.kind==='speak');
 const perDomain={};for(const d of ['professional','everyday'])perDomain[d]={completed:pairs.filter(x=>x.q.domain===d).length,total:QUESTIONS.filter(q=>q.domain===d).length};
 return {format:'vox-diagnostic-baseline',measured:{listening:{correct:listen.filter(x=>x.a.correct).length,attempted:listen.length,percent:listen.length?Math.round(100*listen.filter(x=>x.a.correct).length/listen.length):null},vocabulary:{exactMatches:vocab.filter(x=>x.a.exact).length,attempted:vocab.length,meanWordMatch:avg(vocab.map(x=>x.a.matchPercent)),selfValidated:vocab.filter(x=>x.a.selfValidated).length},pronunciationProxy:{attempted:pron.length,meanWordMatch:avg(pron.map(x=>x.a.proxyWordMatch)),phonemesMeasured:false}},selfReported:{speaking:{attempted:speak.length,meanConfidence:avg(speak.map(x=>x.a.rating*100/3)),recordedSeconds:speak.reduce((s,x)=>s+x.a.durationSeconds,0)}},perDomain,totalAnswered:Object.keys(diag.answers||{}).length,totalAvailable:QUESTIONS.length,cefrLevel:null};
}
export function finishDiagnostic(diag,now=new Date().toISOString()){
 if(diag.status!=='in_progress'||nextQuestion(diag))throw Error('Responde u omite todas las preguntas antes de finalizar.');
 return {...diag,status:'completed',completedAt:now,report:summarize(diag)};
}
