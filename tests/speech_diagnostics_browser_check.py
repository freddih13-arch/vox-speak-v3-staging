"""Simulated browser-only speech diagnostic and compatibility tests; NO Android device is claimed."""
from playwright.sync_api import sync_playwright
from pathlib import Path
from bs4 import BeautifulSoup
import json
root=Path(__file__).parents[1]
html=BeautifulSoup((root/'index.html').read_text(), 'html.parser')
for t in html.select('script,link[rel="stylesheet"]'): t.decompose()
mock=r'''
window.__test={fail:false,recorderStarts:0,recorded:false,asrStarts:0,shouldFailStart:false};
window.SpeechRecognition=class {
 constructor(){this.lang='en-US';this.continuous=false;this.interimResults=false}
 start(){ window.__test.asrStarts++; if(window.__test.shouldFailStart) throw new DOMException('blocked','NotAllowedError'); setTimeout(()=>this.onstart?.(),0) }
 stop(){setTimeout(()=>{if(window.__test.fail)this.onerror?.({error:'network'});else this.onresult?.({results:[[{transcript:'I work in sales'}]]});this.onend?.()},15)}
 abort(){}
};
Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}});
window.MediaRecorder=class { static isTypeSupported(){return true} constructor(){this.mimeType='audio/webm';this.state='inactive'} start(){window.__test.recorderStarts++;this.state='recording'} requestData(){} stop(){this.state='inactive';setTimeout(()=>{this.ondataavailable?.({data:new Blob(['a'],{type:'audio/webm'})});this.onstop?.()},1)}};
'''
checks=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':393,'height':852}, permissions=['microphone'])
 page.set_content(str(html))
 page.add_script_tag(content="Object.defineProperty(window,'localStorage',{configurable:true,value:{_m:new Map(),getItem(k){return this._m.get(k)??null},setItem(k,v){this._m.set(k,String(v))}}});")
 page.add_script_tag(content=mock)
 page.add_script_tag(content=(root/'src/core/speech-diagnostics.js').read_text())
 page.add_script_tag(content=(root/'src/core/voice-capture.js').read_text())
 page.locator('#speech-check-start').click()
 page.locator('#speech-check-start').click()
 page.wait_for_function('document.querySelector("#speech-check-result").textContent.includes("[ok]")')
 checks.append('Standalone recognition success without MediaRecorder')
 assert page.evaluate('window.__test.recorderStarts')==0
 page.evaluate('window.__test.fail=true')
 page.locator('#speech-check-start').click()
 page.locator('#speech-check-start').click()
 page.wait_for_function('document.querySelector("#speech-check-result").textContent.includes("[network]")')
 assert 'Código: network' in page.evaluate('VoxSpeechDiagnostics.report()')
 assert 'I work in sales' not in page.evaluate('VoxSpeechDiagnostics.report()')
 checks.append('Network error code visible and report excludes transcript')
 page.locator('#recognition-only-mode').check()
 assert page.evaluate('VoxSpeechDiagnostics.compatibleMode()')
 assert page.evaluate("localStorage.getItem('vox_stage0_preview__recognition_only_mode')")=='1'
 page.evaluate('window.__test.fail=false')
 page.evaluate("window.__test.result=null;VoxVoice.toggle({button:'record-pron',status:'pron-status',playback:'pron-audio-playback',recognize:true,lang:'en-US',onText:s=>{window.__test.result=s}})")
 page.wait_for_function('document.querySelector("#record-pron").textContent.includes("Detener")')
 page.evaluate("VoxVoice.toggle({button:'record-pron',status:'pron-status',playback:'pron-audio-playback',recognize:true})")
 page.wait_for_function('window.__test.result === "I work in sales"')
 assert page.evaluate('window.__test.recorderStarts')==0
 assert page.locator('#pron-audio-playback audio').count()==0
 checks.append('Compatibility mode recognition works without simultaneous MediaRecorder')
 page.locator('#recognition-only-mode').uncheck()
 page.evaluate("VoxVoice.toggle({button:'record-pron',status:'pron-status',playback:'pron-audio-playback',recognize:true,lang:'en-US',onText:s=>{window.__test.result=s}})")
 page.wait_for_function('document.querySelector("#record-pron").textContent.includes("Detener")')
 page.evaluate("VoxVoice.toggle({button:'record-pron',status:'pron-status',playback:'pron-audio-playback',recognize:true})")
 page.locator('#pron-audio-playback audio').wait_for()
 assert page.evaluate('window.__test.recorderStarts')==1
 checks.append('Normal mode still records playable audio')
 b.close()
print(json.dumps({'success':True,'checks':checks},ensure_ascii=False,indent=2))
