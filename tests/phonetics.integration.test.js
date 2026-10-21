import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const html=read('index.html');
const panel=read('src/phonetics/pronunciation-lab.js');
const worker=read('src/phonetics/phoneme-worker.js');
const sw=read('sw.js');

test('phonetic panel integrated only as experimental module, never replacing existing recorder',()=>{
  for(const id of ['record-pron','pron-audio-playback','pron-feedback','phonetic-record','phonetic-analyze','phonetic-playback','phonetic-result','phonetic-status'])
    assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/src\/phonetics\/pronunciation-lab\.js/);
  assert.match(html,/src\/ui\/phonetics\.css/);
  assert.match(html,/No evalúa tu pronunciación/);
  assert.match(panel,/recognize:false/);
  assert.match(panel,/window\.VoxVoice\?\.toggle/);
  assert.doesNotMatch(panel,/updateActivity\(|lexScore\(|localStorage/);
});
test('Q4 model is lazily loaded, result displayed as raw IPA, no fabricated score',()=>{
  assert.match(panel,/new LocalPhonemeEngine\(\{dtype:'q4'/);
  assert.match(panel,/engine\.analyze\(prepared/);
  assert.match(panel,/result\.ipaRaw/);
  assert.match(panel,/phonetic-ipa/);
  assert.match(worker,/AutoFeatureExtractor/);
  assert.match(worker,/AutoModelForCTC/);
  assert.match(worker,/confidenceAvailable:false,phonemeScore:null/);
  assert.doesNotMatch(panel,/score\.percentage|% de pronunciaci[oó]n/i);
});
test('navigation and sentence changes cancel transient analyses and respect data separation',()=>{
  assert.match(panel,/MutationObserver/);
  assert.match(panel,/abort\?\.abort\(\)/);
  assert.match(panel,/vox:tab-change/);
  assert.match(panel,/window\.VoxVoice\?\.clearPlayback/);
  assert.match(read('src/core/storage.js'),/vox_stage0_preview__/);
  assert.match(sw,/const CACHE='vox-v3-coach30-20261021-r1'/);\n  for(const asset of ['src/coach/coach.js','src/coach/curriculum.js','src/ui/coach.css'])assert.match(sw,new RegExp(asset.replaceAll('.','\\\\.')));
  for(const file of ['pronunciation-lab.js','phoneme-worker.js','phonemes-local.js','audio-processor.js','ctc-decode.js','vocab-gruut.js']){
    assert.match(sw,new RegExp(file.replaceAll('.','\\.')));
  }
});
