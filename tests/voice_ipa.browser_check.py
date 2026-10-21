"""Local Chromium end-to-end smoke: IPA, speech partial/final, separate audio recorders, repeats."""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).parents[1]
doc=BeautifulSoup((root/'index.html').read_text(),'html.parser')
for el in doc.select('script,link[rel=stylesheet]'):el.decompose()
html=str(doc)
mock=r'''
window.__spoken=[];window.__mic={captures:0,stops:0,asr:0};
Object.defineProperty(window,'localStorage',{configurable:true,value:{_m:new Map(),getItem(k){return this._m.get(k)??null},setItem(k,v){this._m.set(k,String(v))},removeItem(k){this._m.delete(k)}}});
window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices(){return [{lang:'en-US',name:'TestVoice'}]},addEventListener(){},cancel(){},speak(u){window.__spoken.push(u.text);queueMicrotask(()=>u.onstart?.())}}});
Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks(){return [{stop(){}}]}})}});
window.MediaRecorder=class{static isTypeSupported(x){return x.startsWith('audio/webm')}constructor(){this.mimeType='audio/webm';this.state='inactive'}start(){this.state='recording';window.__mic.captures++}requestData(){}stop(){this.state='inactive';window.__mic.stops++;setTimeout(()=>{this.ondataavailable?.({data:new Blob(['hello world'],{type:'audio/webm'})});this.onstop?.()},4)}};
window.SpeechRecognition=class{start(){window.__mic.asr++;let part=[{transcript:'I work'}];part.isFinal=false;setTimeout(()=>this.onresult?.({results:[part]}),8)}stop(){let fin=[{transcript:'I work in sales'}];fin.isFinal=true;setTimeout(()=>{this.onresult?.({results:[fin]});this.onend?.()},10)}abort(){}};
'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':393,'height':852})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='load')
 for name in ['src/ui/base.css','src/ui/islands.css','src/ui/ipa-guide.css']:
  page.add_style_tag(content=(root/name).read_text())
 page.add_script_tag(content=mock)
 for path in ['src/core/voice-capture.js','src/phonetics/ipa-guide.js','src/legacy/training-data.js','src/legacy/training.js','src/data/islands-data.js','src/legacy/islands.js']:
  page.add_script_tag(content=(root/path).read_text())
 page.locator('#home [data-go="islands"]').first.evaluate('(el)=>el.click()')
 page.locator('.island-tile').first.click()
 assert page.locator('#is-card-text .ipa-chip').count()>3,'IPA per-word must render in shadow mode'
 assert page.locator('#is-card-text .ipa-symbol').first.inner_text().startswith('/'),'IPA text required'
 word=page.locator('#is-card-text button.ipa-chip').first
 word_text=word.locator('.ipa-word').inner_text();word.click()
 assert page.evaluate('window.__spoken.at(-1)')==word_text,'tap individual IPA word should speak it'
 page.locator('#island-mode-list [data-mode="recall"]').click()
 assert page.locator('#is-card-text .ipa-chip').count()==0,'recall must not reveal IPA before answer'
 page.locator('#is-reveal').click()
 assert page.locator('#is-card-text .ipa-chip').count()>0,'IPA appears after deliberate reveal'
 page.locator('#island-mode-list [data-mode="shadow"]').click()
 for i in range(3):
  page.locator('#is-record-audio').click()
  page.wait_for_function('document.getElementById("is-record-audio").textContent.includes("Detener")')
  page.locator('#is-record-audio').click()
  page.locator('#audio-playback audio').wait_for(state='attached')
  assert page.locator('#is-result').is_hidden(),'record-only does not fabricate a score'
 page.locator('#is-record').click()
 page.wait_for_function('document.getElementById("is-record").textContent.includes("Detener")')
 page.wait_for_function('!document.getElementById("is-live-text").hidden')
 assert 'borrador' in page.locator('#is-live-text').inner_text()
 page.locator('#is-record').click()
 page.locator('#is-speech-playback audio').wait_for(state='attached')
 page.wait_for_function('!document.getElementById("is-result").hidden')
 assert page.locator('#is-result').is_visible()
 assert 'no nota' in page.locator('#is-result').inner_text().lower() or 'no mide' in page.locator('#is-result').inner_text().lower() or 'no' in page.locator('#is-result .explain').inner_text().lower()
 page.locator('#is-next').click()
 assert page.locator('#is-speech-playback audio').count()==0
 assert page.locator('#is-card-text .ipa-chip').count()>3
 page.locator('#home [data-go="pronounce"]').first.evaluate('(el)=>el.click()')
 assert page.locator('#pron-ipa-guide .ipa-chip').count()>0
 assert not errors,errors
 print(json.dumps({'pass':True,'checks':['IPA words rendered and tappable','IPA hidden in recall until reveal','three local record replays','live partial Chrome transcript','ASR final and separate audio playback','next phrase cleanup','legacy pronunciation IPA'],'audioCaptures':page.evaluate('window.__mic.captures')},ensure_ascii=False))
 browser.close()
