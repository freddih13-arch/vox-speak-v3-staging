"""Browser simulated Android voice-input tests. No real microphone or recognition service is used."""
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from pathlib import Path
import json,re
ROOT=Path(__file__).parents[1]
HTML=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser')
for el in HTML.select('script,link[rel="stylesheet"]'):el.decompose()
html=str(HTML)
module_order=['src/core/storage.js','src/diagnostic/questions.js','src/diagnostic/engine.js','src/core/migration.js','src/diagnostic/ui.js','src/core/app.js']
bundle='(function(){\n'+'\n'.join(re.sub(r'\bexport\s+(?=const|let|function|class)','',re.sub(r'^import\s+.+?;\s*$', '',(ROOT/path).read_text(),flags=re.M)) for path in module_order)+'\n})();'
legacy=['src/legacy/training-data.js','src/legacy/training.js','src/data/islands-data.js','src/legacy/islands.js']
MOCK=r'''
window.__mic={stops:0,aborts:0,fail:false,captures:0};
Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}});
window.MediaRecorder=class{
  static isTypeSupported(type){return type.startsWith('audio/webm')}
  constructor(){this.mimeType='audio/webm';this.state='inactive'}
  start(){this.state='recording';window.__mic.captures++}
  requestData(){}
  stop(){this.state='inactive';setTimeout(()=>{this.ondataavailable?.({data:new Blob(['fake-voice'],{type:'audio/webm'})});this.onstop?.()},1)}
};
window.SpeechRecognition=class{
  constructor(){this.lang='en-US'}
  start(){window.__mic.current=this}
  stop(){window.__mic.stops++;setTimeout(()=>{
    if(window.__mic.fail)this.onerror?.({error:'network'});
    else this.onresult?.({results:[[{transcript:'I achieved my sales targets',confidence:.85}]]});
    this.onend?.();
  },8)}
  abort(){window.__mic.aborts++}
};
'''
checks=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':393,'height':852})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='load')
 for path in ['src/ui/base.css','src/ui/islands.css','src/ui/diagnostic.css']:page.add_style_tag(content=(ROOT/path).read_text())
 page.add_script_tag(content="Object.defineProperty(window,'localStorage',{configurable:true,value:{_m:new Map(),getItem(k){return this._m.has(k)?this._m.get(k):null},setItem(k,v){this._m.set(k,String(v))},removeItem(k){this._m.delete(k)}}});")
 page.add_script_tag(content=MOCK)
 page.add_script_tag(content=(ROOT/'src/core/voice-capture.js').read_text())
 for path in legacy:page.add_script_tag(content=(ROOT/path).read_text())
 page.add_script_tag(content=bundle)
 # Legacy pronunciation: user presses the STOP button before a result is received.
 page.locator('nav [data-go="pronounce"]').click()
 page.locator('#record-pron').click()
 page.wait_for_function('document.getElementById("record-pron").textContent.includes("Detener")')
 page.locator('#record-pron').click()
 page.locator('#pron-audio-playback audio').wait_for()
 page.wait_for_function('document.getElementById("pron-status").textContent.includes("Escucha de nuevo")')
 assert 'I achieved my sales targets' in page.locator('#pron-feedback').inner_text()
 assert page.evaluate('window.__mic.stops')==1
 assert page.evaluate('window.__mic.aborts')==0
 checks.append('Manual stop preserves transcription and produces local audio playback')
 # Network fault: still playable, no fake pronunciation score.
 page.locator('#next-pron').click()
 page.evaluate('window.__mic.fail=true')
 count=page.locator('#home-practices').inner_text()
 page.locator('#record-pron').click()
 page.wait_for_function('document.getElementById("record-pron").textContent.includes("Detener")')
 page.locator('#record-pron').click()
 page.locator('#pron-audio-playback audio').wait_for()
 page.wait_for_function('document.getElementById("pron-status").textContent.includes("Grabación disponible")')
 assert page.locator('#home-practices').inner_text()==count
 assert not page.locator('#pron-feedback').is_visible()
 checks.append('Speech network failure retains audio and does not fabricate a zero score')
 # Island: local audio + speech recognition should use the same workflow.
 page.evaluate('window.__mic.fail=false')
 page.locator('nav [data-go="islands"]').click()
 page.locator('.island-tile').first.click()
 page.locator('#is-record').click()
 page.wait_for_function('document.getElementById("is-record").textContent.includes("Detener")')
 page.locator('#is-record').click()
 page.locator('#audio-playback audio').wait_for()
 page.wait_for_function('!document.getElementById("is-result").hidden')
 checks.append('Island speak captures audio and evaluates recognized words')
 # No transcription mode: there is always playback, never a silent reset.
 page.locator('#is-record-audio').click()
 page.wait_for_function('document.getElementById("is-record-audio").textContent.includes("Detener")')
 page.locator('#is-record-audio').click()
 page.locator('#audio-playback audio').wait_for()
 checks.append('Record-my-voice control produces audio without speech recognition')
 # Interview uses the same capture flow, with a spoken-word coverage proxy.
 page.locator('nav [data-go="interview"]').click()
 page.locator('#record-interview').click()
 page.wait_for_function('document.getElementById("record-interview").textContent.includes("Detener")')
 page.locator('#record-interview').click()
 page.locator('#interview-audio-playback audio').wait_for()
 page.locator('#interview-result').wait_for(state='visible')
 checks.append('Interview captures speech and keeps playable audio')
 # Diagnostic pronunciation can be auditioned before submitting.
 page.locator('nav [data-go="home"]').click()
 page.locator('#home-diagnostic-cta').click()
 page.locator('#diag-begin').evaluate('(el)=>el.click()')
 for i in range(1,15):
  page.locator('#diag-skip').click();page.locator('#diag-continue').click()
 assert page.locator('#diag-pron-mic').is_visible()
 page.locator('#diag-pron-mic').click()
 page.wait_for_function('document.getElementById("diag-pron-mic").textContent.includes("Detener")')
 page.locator('#diag-pron-mic').click()
 page.locator('#diag-pron-audio-playback audio').wait_for()
 page.locator('#diag-pron-confirm').wait_for(state='visible')
 assert 'Chrome reconoció' in page.locator('#diag-pron-text').inner_text()
 page.locator('#diag-pron-confirm').click()
 assert 'El navegador transcribió' in page.locator('#diag-root').inner_text()
 checks.append('Diagnostic lets user review own voice before saving transcript')
 # Diagnostic speaking is independent of transcription.
 for i in range(15,18):
  page.locator('#diag-continue').click()
  page.locator('#diag-skip').click()
 page.locator('#diag-continue').click()
 assert page.locator('#diag-speak-record').is_visible()
 page.locator('#diag-speak-record').click()
 page.wait_for_function('document.getElementById("diag-speak-record").textContent.includes("Detener")')
 page.locator('#diag-speak-record').click()
 page.locator('#diag-speak-audio-player audio').wait_for()
 page.locator('#diag-self-rating [data-rating="2"]').click()
 assert 'Autoevaluación registrada' in page.locator('#diag-root').inner_text()
 checks.append('Speaking diagnostic allows playback and self-rating with no ASR')
 assert not errors,errors
 checks.append('No browser runtime exceptions')
 browser.close()
print(json.dumps({'success':True,'checks':checks},ensure_ascii=False,indent=2))
