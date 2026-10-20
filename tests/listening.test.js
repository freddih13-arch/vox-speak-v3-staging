import test from 'node:test';
import assert from 'node:assert/strict';
import {QUESTIONS,KEY,validateBank,defaultState,readState,persist,nextQuestion,recordAnswer,optionsFor,summarize} from '../src/listening/engine.js';
class Mem{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}

test('curated bank has 60 unique phrasings, 36 professional and 24 general',()=>{
 assert.equal(validateBank(),true);assert.equal(QUESTIONS.length,60);
 assert.equal(QUESTIONS.filter(q=>q.domain==='professional').length,36);
 assert.equal(QUESTIONS.filter(q=>q.domain==='general').length,24);
 assert.equal(new Set(QUESTIONS.map(q=>q.question.toLowerCase())).size,60);
});
test('choices are four unique and correct is never assumed first',()=>{
 for(const q of QUESTIONS){const opts=optionsFor(q,()=>0);assert.equal(opts.length,4);assert.equal(new Set(opts.map(x=>x.text)).size,4);assert.equal(opts.filter(x=>x.correct).length,1);assert.equal(opts.find(x=>x.correct).text,q.correct)}
});
test('mixed mode has precisely 6/4 domain ratio per completed ten-question block',()=>{
 let s=defaultState();const seen=[];
 for(let n=0;n<30;n++){const p=nextQuestion(s,'mixed',()=>0.44);s=p.state;seen.push(p.question.domain);}
 for(let i=0;i<3;i++)assert.deepEqual([seen.slice(i*10,(i+1)*10).filter(x=>x==='professional').length,seen.slice(i*10,(i+1)*10).filter(x=>x==='general').length],[6,4]);
});
test('60 unseen before any repeat in mixed mode',()=>{
 let s=defaultState(),seen=new Set();for(let i=0;i<60;i++){const p=nextQuestion(s,'mixed',()=>0.87);s=p.state;assert.ok(!seen.has(p.question.id),`repetition at ${i}: ${p.question.id}`);seen.add(p.question.id);}assert.equal(seen.size,60);
 const p=nextQuestion(s,'mixed',()=>0.2);assert.ok(seen.has(p.question.id),'review starts after full coverage');
});
test('specialized mode selects appropriate domain without touching pending mix schedule',()=>{
 let s=defaultState();const p=nextQuestion(s,'mixed',()=>0.1);const originalQueue=p.state.queue;
 let q=nextQuestion(p.state,'general',()=>0.8);assert.equal(q.question.domain,'general');assert.deepEqual(q.state.queue,originalQueue);
 q=nextQuestion(q.state,'professional',()=>0.8);assert.equal(q.question.domain,'professional');
});
test('answers, not transcript reveals, alter scored statistics',()=>{
 let s=defaultState();const q=QUESTIONS[0];let r=recordAnswer(s,q,{revealed:true});assert.equal(summarize(r).total,0);
 r=recordAnswer(r,q,{correct:true,plays:1});r=recordAnswer(r,q,{correct:false,plays:2});
 assert.deepEqual({...summarize(r)}, {total:2,correct:1,last20:50,firstListenCorrect:1});assert.throws(()=>recordAnswer(r,q,{correct:true,plays:0}),/sin escucha/);
});
test('staging-only storage is independent and corruption is not overwritten',()=>{
 const st=new Mem();st.setItem('vox_speak_free_v1','PROD');st.setItem('vox_stage0_preview__vox_speak_free_v1','LEGACY');const s=defaultState();
 assert.ok(KEY.startsWith('vox_stage0_preview__'));assert.equal(persist(s,st),true);assert.equal(readState(st).writable,true);assert.equal(st.getItem('vox_speak_free_v1'),'PROD');
 st.setItem(KEY,'{"version":123}');const info=readState(st);assert.equal(info.writable,false);assert.equal(st.getItem(KEY),'{"version":123}');
});
test('service worker precaches the module and legacy phonetic scripts',async()=>{
 const {readFileSync}=await import('node:fs');const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const s of ['src/listening/listening-lab.js','src/listening/engine.js','src/listening/bank.js','src/phonetics/phoneme-worker.js'])assert.ok(sw.includes(s));
});
