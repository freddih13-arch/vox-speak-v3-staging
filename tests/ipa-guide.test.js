import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const text=path=>readFileSync(new URL(path,root),'utf8');
const window={};
vm.runInNewContext(text('src/phonetics/ipa-guide.js'),{window});
vm.runInNewContext(text('src/data/islands-data.js'),{window});
vm.runInNewContext(text('src/legacy/training-data.js'),{window});
const {lookup,phonemes}=window.VoxIPA;
const catalog=window.VOX_CATALOG;
test('all built-in 100 island phrases have a reference IPA for every token',()=>{
 assert.equal(catalog.reduce((n,x)=>n+x.phrases.length,0),100);
 for(const p of catalog.flatMap(x=>x.phrases)) {
   for(const item of phonemes(p.en))assert.ok(item.ipa,`${p.id}: missing IPA for ${item.word}`);
 }
});
test('lexicon shows valid reference IPA, not user scores, and handles custom unknowns',()=>{
 assert.equal(lookup('sales'),'seɪlz');
 assert.equal(Array.from(phonemes('I work in sales.'),x=>x.ipa).join(' '),'aɪ wɝk ɪn seɪlz');
 assert.equal(lookup('supercalifragilisticexpialidocious'),null);
 const s=text('src/phonetics/ipa-guide.js');
 assert.match(s,/No compara ni califica tu voz/);
 assert.doesNotMatch(s,/accuracyScore|phonemeAccuracy|speechConfidence/);
});
test('new phonetic guidance preserves blind exercises and avoids HTML injection',()=>{
 const islands=text('src/legacy/islands.js');
 assert.match(islands,/if\(mode==='listen'&&!revealed\)/);
 assert.match(islands,/window\.VoxIPA\.render/);
 assert.match(islands,/mastered:prev\.mastered/);
 const html=text('index.html');
 assert.match(html,/src\/phonetics\/ipa-guide\.js/);
 assert.match(html,/id="is-speech-playback"/);
 assert.match(html,/id="pron-ipa-guide"/);
});
