import {FAMILIES} from './bank.js';
export const KEY='vox_stage0_preview__listening_unpredictable_v1';
export const QUESTIONS=Object.freeze(FAMILIES.flatMap(f=>f.variants.map((question,i)=>Object.freeze({id:`${f.id}-${i}`,family:f.id,domain:f.domain,topic:f.topic,question,correct:f.correct,distractors:f.distractors,answer:f.answer,note:f.note}))));
export function validateBank(){
  if(QUESTIONS.length!==60||QUESTIONS.filter(x=>x.domain==='professional').length!==36||QUESTIONS.filter(x=>x.domain==='general').length!==24)throw new Error('La mezcla debe conservar 36/24 preguntas');
  if(new Set(QUESTIONS.map(x=>x.id)).size!==QUESTIONS.length||new Set(QUESTIONS.map(x=>x.question)).size!==QUESTIONS.length)throw new Error('Preguntas duplicadas');
  for(const q of QUESTIONS){if(q.distractors.length!==3||new Set([q.correct,...q.distractors]).size!==4)throw new Error('Opciones ambiguas: '+q.id)}
  return true;
}
validateBank();
export const defaultState=()=>({version:1,seen:[],queue:[],history:[],total:0,correct:0,firstListenCorrect:0,mode:'mixed'});
export function readState(store=localStorage){
  try{const text=store.getItem(KEY);if(text===null)return {state:defaultState(),writable:true};const s=JSON.parse(text);
    if(s?.version!==1||!Array.isArray(s.seen)||!Array.isArray(s.queue)||!Array.isArray(s.history))return {state:defaultState(),writable:false};
    return {state:{...defaultState(),...s,seen:s.seen.filter(x=>typeof x==='string').slice(-60),queue:s.queue.filter(x=>x==='professional'||x==='general').slice(0,10),history:s.history.filter(x=>x&&typeof x==='object').slice(-100)},writable:true};
  }catch{return {state:defaultState(),writable:false}}
}
export function persist(state,store=localStorage){try{store.setItem(KEY,JSON.stringify(state));return true}catch{return false}}
const shuf=(arr,random=Math.random)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){let j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[a[i],a[j]]=[a[j],a[i]]}return a;};
export function optionsFor(q,random=Math.random){return shuf([{text:q.correct,correct:true},...q.distractors.map(text=>({text,correct:false}))],random)};
/** Exactly 6 professional + 4 general per complete 10-item mixed block. */
export function nextQuestion(state,mode='mixed',random=Math.random){
  if(!['mixed','professional','general'].includes(mode))throw new Error('Modo desconocido');
  const s={...state,seen:[...state.seen],queue:[...state.queue],history:[...state.history],mode};
  if(mode==='mixed'&&!s.queue.length)s.queue=shuf([...Array(6).fill('professional'),...Array(4).fill('general')],random);
  const domain=mode==='mixed'?s.queue.shift():mode;
  let choices=QUESTIONS.filter(q=>q.domain===domain&&!s.seen.includes(q.id));
  if(!choices.length){s.seen=s.seen.filter(id=>!QUESTIONS.some(q=>q.id===id&&q.domain===domain));choices=QUESTIONS.filter(q=>q.domain===domain);}
  const recentFamilies=new Set(s.history.slice(-4).map(x=>x.family));
  const preferred=choices.filter(q=>!recentFamilies.has(q.family));
  if(preferred.length)choices=preferred;
  const q=choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))];
  s.seen.push(q.id);s.seen=s.seen.slice(-60);
  return {state:s,question:q};
}
export function recordAnswer(state,question,{correct,plays,revealed=false}={}){
  const s={...state,history:[...state.history]};
  if(revealed)return s;
  if(typeof correct!=='boolean'||!Number.isInteger(plays)||plays<1)throw new Error('Respuesta sin escucha válida');
  s.total=Math.max(0,Number(s.total)||0)+1;
  s.correct=Math.max(0,Number(s.correct)||0)+Number(correct);
  s.firstListenCorrect=Math.max(0,Number(s.firstListenCorrect)||0)+Number(correct&&plays===1);
  s.history.push({id:question.id,family:question.family,domain:question.domain,correct,plays,at:new Date().toISOString()});
  s.history=s.history.slice(-100);
  return s;
}
export function summarize(state){const h=state.history||[];const recent=h.slice(-20);return {total:Number(state.total)||0,correct:Number(state.correct)||0,last20:recent.length?Math.round(recent.filter(x=>x.correct).length/recent.length*100):null,firstListenCorrect:Number(state.firstListenCorrect)||0};}
