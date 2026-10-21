from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
from bs4 import BeautifulSoup
root=Path(__file__).parents[1]
doc=BeautifulSoup((root/'index.html').read_text(),'html.parser')
for el in doc.select('script,link[rel=stylesheet]'): el.decompose()
html=str(doc)
bank=(root/'src/listening/bank.js').read_text().replace('export const FAMILIES','const FAMILIES')
engine=re.sub(r'\bexport\s+(?=const|function)','',(root/'src/coach/curriculum.js').read_text().replace("import {FAMILIES} from '../listening/bank.js';",''))
ui=(root/'src/coach/coach.js').read_text();ui=re.sub(r'^import .*?;\s*','',ui,flags=re.M)
bundle='(function(){\nconst FAMILIES=(function(){\n'+bank+'\nreturn FAMILIES;\n})();\n'+engine+'\n'+ui+'\n})();'
with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':393,'height':852});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  mock='''
  window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};window.__spoken=[];
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices(){return [{lang:'en-US',name:'Test Voice'}]},addEventListener(){},cancel(){},speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onstart?.(),25);}}});
  window.__voiceMic=[];
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}});
  window.MediaRecorder=class{static isTypeSupported(){return true}constructor(){this.mimeType='audio/webm';this.state='inactive'}start(){this.state='recording'}requestData(){}stop(){this.state='inactive';setTimeout(()=>{this.ondataavailable?.({data:new Blob(['test-audio'],{type:'audio/webm'})});this.onstop?.()},10)}};
  window.SpeechRecognition=class{start(){}stop(){setTimeout(()=>{this.onresult?.({results:[[{transcript:'I work in sales'}]]});this.onend?.()},10)}abort(){}};
  '''
  page.set_content(html,wait_until='load')
  page.add_script_tag(content=mock)
  for path in ['src/ui/base.css','src/ui/coach.css','src/ui/listening.css','src/ui/islands.css','src/ui/diagnostic.css','src/ui/phonetics.css']:
   page.add_style_tag(content=(root/path).read_text())
  page.add_script_tag(content="Object.defineProperty(window,'localStorage',{configurable:true,value:{_m:new Map(),getItem(k){return this._m.get(k)??null},setItem(k,v){this._m.set(k,String(v))},removeItem(k){this._m.delete(k)}}});")
  for path in ['src/core/voice-capture.js','src/legacy/training-data.js','src/legacy/training.js','src/data/islands-data.js','src/legacy/islands.js']:
   page.add_script_tag(content=(root/path).read_text())
  page.add_script_tag(content=bundle)
  page.wait_for_function('window.VoxCoach!==undefined',timeout=2000)
  assert page.locator('#coach-home h1').inner_text()=='Tu inglés, con dirección.'
  assert page.locator('nav [data-go="coach"]').count()==1
  # The exact previously broken CTA must open the coach every time.
  page.locator('#coach-home .coach-main-action').click();assert page.locator('#coach').is_visible()
  assert 'PASO 1/4' in page.locator('#coach-phase').inner_text()
  options=page.locator('#coach-content .coach-answer');assert options.count()==4
  assert all(options.nth(i).is_disabled() for i in range(4))
  page.get_by_role('button',name='🔊 Escuchar pregunta').click()
  assert all(options.nth(i).is_disabled() for i in range(4)),'locked until voice onstart'
  page.wait_for_function('Array.from(document.querySelectorAll("#coach-content .coach-answer")).every(b=>!b.disabled)')
  options.first.click();assert page.locator('#coach-feedback').is_visible()
  count=page.evaluate('window.VoxCoach.getProgress().activities');assert count==0
  page.get_by_role('button',name='🔊 Escuchar pregunta').click();page.get_by_role('button',name='🔊 Escuchar pregunta').click()
  assert page.locator('#coach-feedback').is_visible()
  page.locator('#coach-primary').click();assert page.evaluate('window.VoxCoach.getProgress().activities')==1
  page.locator('#coach-exit').click();assert page.locator('#home').is_visible();assert page.locator('#speech-tech-card').count()==1
  page.locator('#start-session').evaluate('(el)=>el.click()');assert page.locator('#coach').is_visible();assert 'PASO 2/4' in page.locator('#coach-phase').inner_text()
  # DOM harness operates on about:blank; complete reload is validated on deployed staging.
  page.locator('#start-session').evaluate('(el)=>el.click()');assert 'PASO 2/4' in page.locator('#coach-phase').inner_text()
  page.get_by_role('button',name='👁 Ver texto (sin nota)').click();page.locator('#coach-primary').click()
  assert 'PASO 3/4' in page.locator('#coach-phase').inner_text()
  page.get_by_role('button',name='🔊 Escuchar / repetir').click();page.get_by_role('button',name='✓ Ya la practiqué →').click();page.locator('#coach-primary').click()
  assert 'PASO 4/4' in page.locator('#coach-phase').inner_text()
  page.locator('#coach-content textarea').fill('I built a B2B pipeline and managed client relationships and I increased revenue with disciplined follow up.');page.get_by_role('button',name='🔎 Revisar mi respuesta').click();assert page.locator('#coach-feedback').is_visible();page.locator('#coach-primary').click()
  assert 'SESIÓN 2 DE 30' in page.locator('#coach-phase').inner_text()
  page.locator('#coach-exit').click();assert '1/30' in page.locator('#coach-home').inner_text()
  assert page.locator('#coach-home-tools #speech-tech-card').count()==1,'tech tools lost on rerender'
  assert not errors,errors
  print(json.dumps({'pass':True,'checks':['visible main CTA works','playback gated on speech start','postanswer replay repeatable','step preserved across exit and reentry','reveal no score','phrase and interview workflow','session completion','technical section persists','runtime no errors']},ensure_ascii=False))
  browser.close()

