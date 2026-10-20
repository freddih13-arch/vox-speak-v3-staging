from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
r=Path(__file__).parents[1]
src=(r/'src/phonetics/pronunciation-lab.js').read_text()
src=re.sub(r'^import .+;$','',src,flags=re.M)
fakes='''
window.__test={recorderToggles:0,ran:0,disposed:0,lastBlob:null,ctrl:null};
window.VoxVoice={
 toggle(opts){
  window.__test.recorderToggles++;
  if(opts.button.dataset.recording==='1'){
   delete opts.button.dataset.recording;
   opts.button.textContent='Grabar para IPA';
   const blob=new Blob(['wave'],{type:'audio/webm'});
   window.__test.lastBlob=blob;
   opts.onAudio({blob});
  }else{opts.button.dataset.recording='1';opts.button.textContent='Detener y evaluar';}
 },
 cancel(){}, clearPlayback(){},
};
class LocalPhonemeEngine{
 constructor(options){this.options=options;window.__test.ran++}
 async analyze(audio,{signal,onProgress}){
  window.__test.ctrl=signal;
  onProgress({stage:'inferencing',percent:25});
  return {ipaRaw:'aɪ w ɚ k',inferenceMs:1723};
 }
 dispose(){window.__test.disposed++}
}
async function prepareRecordedAudio(blob){return {samples:new Float32Array(1600),sampleRate:16000,durationSeconds:1.2}}
'''
html='''<!doctype html><html><body><p id="target-phrase">I work in sales.</p>
<button id="phonetic-record">Grabar para IPA</button>
<button id="phonetic-analyze" disabled>Analizar</button>
<p id="phonetic-status"></p><div id="phonetic-playback"></div>
<progress id="phonetic-progress" hidden max="100" value="0"></progress>
<div id="phonetic-result" hidden></div><p id="phonetic-metrics"></p></body></html>'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':393,'height':852})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html)
 page.add_script_tag(content=fakes+src)
 assert page.evaluate('window.__test.ran')==0
 page.locator('#phonetic-record').click();page.locator('#phonetic-record').click()
 assert not page.locator('#phonetic-analyze').is_disabled()
 assert page.locator('#phonetic-status').inner_text().startswith('Grabación disponible')
 page.locator('#phonetic-analyze').click()
 page.wait_for_function('document.querySelector("#phonetic-result").textContent.includes("aɪ w")')
 assert page.evaluate('window.__test.ran')==1
 assert 'no es una calificación' in page.locator('#phonetic-result').inner_text()
 assert page.locator('#phonetic-metrics').inner_text().find('1723 ms')!=-1
 # Switching sentence must invalidate recording and IPA.
 page.locator('#target-phrase').evaluate('(e)=>e.textContent="I achieved my sales targets."')
 page.wait_for_function('document.querySelector("#phonetic-analyze").disabled')
 assert page.locator('#phonetic-result').is_hidden()
 # Leave tab, ensure no errors.
 page.evaluate('window.dispatchEvent(new CustomEvent("vox:tab-change",{detail:{tab:"islands"}}))')
 assert not errors,errors
 print(json.dumps({'pass':True,'ui_flow':['model lazy','record -> stop','analyze -> IPA','phrase changes clear old results','navigation cleans audio'],'errors':errors},ensure_ascii=False))
 browser.close()
