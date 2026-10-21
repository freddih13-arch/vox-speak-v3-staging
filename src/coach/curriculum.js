/** 30 guided sessions: use the existing 60-item authored listening corpus. */
import {FAMILIES} from '../listening/bank.js';
export const TOTAL_DAYS=30;
const professional=FAMILIES.filter(f=>f.domain==='professional').flatMap(f=>f.variants.map((q,i)=>({id:f.id+'-'+i,family:f.id,topic:f.topic,domain:f.domain,question:q,correct:f.correct,distractors:f.distractors,answer:f.answer,note:f.note})));
const general=FAMILIES.filter(f=>f.domain==='general').flatMap(f=>f.variants.map((q,i)=>({id:f.id+'-'+i,family:f.id,topic:f.topic,domain:f.domain,question:q,correct:f.correct,distractors:f.distractors,answer:f.answer,note:f.note})));
const pattern=['professional','professional','general','professional','general','professional','professional','general','professional','general'];
export const QUESTIONS=Object.freeze(Array.from({length:60},(_,i)=>{
 const category=pattern[i%10],offset=Math.floor(i/10)*(category==='professional'?6:4)+pattern.slice(0,i%10).filter(x=>x===category).length;
 const q=(category==='professional'?professional:general)[offset];if(!q)throw Error('Banco incompleto en '+i);return Object.freeze(q);
}));
export function planForDay(day,legacy){
 if(!Number.isInteger(day)||day<0||day>=TOTAL_DAYS)throw Error('Sesión fuera del currículo');
 const pron=legacy.PRON,interview=legacy.INTERVIEW;
 if(!Array.isArray(pron)||!pron.length||!Array.isArray(interview)||!interview.length)throw Error('No cargaron los ejercicios originales');
 const q1=QUESTIONS[day*2],q2=QUESTIONS[day*2+1],phrase=pron[day%pron.length],role=interview[day%interview.length];
 return [{id:'listen-'+q1.id,type:'listen',item:q1},{id:'listen-'+q2.id,type:'listen',item:q2},
 {id:'phrase-'+day,type:'phrase',item:{en:phrase[0],es:phrase[1],tip:phrase[2],topic:phrase[3]}},
 {id:'interview-'+day,type:'interview',item:role}];
}
export function getDayTheme(day){const themes=['Escuchar sin traducir cada palabra','Reconocer la intención','Responder con claridad','Explicar tu experiencia','Pedir aclaraciones','Hablar con clientes','Conversaciones cotidianas','Argumentar con ejemplos','Practicar sin leer','Consolidar y transferir'];return themes[day%themes.length]}
export function emptyState(){return {version:1,day:0,step:0,completed:[],answers:[],review:[],updatedAt:null};}
export const STORE_KEY='vox_stage0_preview__coach30_v1';
export function safeLoad(storage){try{const raw=storage.getItem(STORE_KEY);if(raw===null)return {state:emptyState(),writable:true};const s=JSON.parse(raw);if(!s||s.version!==1||!Number.isInteger(s.day)||s.day<0||s.day>30||!Number.isInteger(s.step)||s.step<0||s.step>4||!Array.isArray(s.completed)||!Array.isArray(s.answers)||!Array.isArray(s.review))throw Error('invalid');return {state:{...emptyState(),...s,completed:s.completed.filter(x=>Number.isInteger(x)&&x>=0&&x<30),answers:s.answers.filter(x=>x&&typeof x==='object').slice(-500),review:s.review.filter(x=>x&&typeof x==='object').slice(-120)},writable:true}}catch{return {state:emptyState(),writable:false}}}
export function safeSave(storage,state){try{storage.setItem(STORE_KEY,JSON.stringify({...state,updatedAt:new Date().toISOString()}));return true}catch{return false}}
export function finishStep(s,record){if(s.day>=30)return s;const key=s.day+'-'+s.step;if(s.answers.some(a=>a.key===key))return s;const answers=[...s.answers,{...record,key,day:s.day,step:s.step,at:new Date().toISOString()}].slice(-500);
 const newReview=[...s.review];if(record.type==='listen'&&record.correct===false){const old=newReview.findIndex(x=>x.id===record.id);if(old!==-1)newReview.splice(old,1);newReview.push({id:record.id,due:s.day+1,attempts:1});}
 let day=s.day,step=s.step+1,completed=[...s.completed];if(step>=4){completed=[...new Set([...completed,day])];day+=1;step=0;}
 return {...s,day,step,answers,completed,review:newReview.slice(-120)};
}
export function dueReviews(s){return s.review.filter(x=>x.due<=s.day).length}
export function progress(s){return {done:s.completed.length,activities:s.answers.length,correct:s.answers.filter(x=>x.type==='listen'&&x.correct).length,listenCount:s.answers.filter(x=>x.type==='listen'&&typeof x.correct==='boolean').length,remaining:Math.max(0,120-s.answers.length)}}
