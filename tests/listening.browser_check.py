from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import re,json
root=Path(__file__).parents[1]
doc=BeautifulSoup((root/'index.html').read_text(),'html.parser')
for el in doc.select('script,link[rel=stylesheet]'):el.decompose()
html=str(doc)
# Only to test real UI flow without network and without using a bundler in production.
bank=(root/'src/listening/bank.js').read_text().replace('export const FAMILIES','const FAMILIES')
engine=(root/'src/listening/engine.js').read_text().replace("import {FAMILIES} from './bank.js';",'')
engine=re.sub(r'\bexport\s+(?=(const|function))','',engine)
ui=(root/'src/listening/listening-lab.js').read_text()
ui=re.sub(r'^import .*?;\s*','',ui,flags=re.M)
bundle='(function(){\n'+bank+'\n'+engine+'\nwindow.__listeningQs=QUESTIONS;\n'+ui+'\n})();'
prep='''window.SpeechSynthesisUtterance=class {constructor(t){this.text=t}};window.__spoken=[];window.__prod='PRODUCTION';
Object.defineProperty(window,'localStorage',{configurable:true,value:{_m:new Map([['vox_speak_free_v1','PRODUCTION'],['vox_stage0_preview__vox_speak_free_v1',JSON.stringify({days:{},listeningTotal:0,listeningCorrect:0,pronCount:0,interviewCount:0})]]),getItem(k){return this._m.get(k)??null},setItem(k,v){this._m.set(k,String(v))},removeItem(k){this._m.delete(k)}}});
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices(){return [{lang:'en-US',name:'Test English'}]},addEventListener(){},cancel(){},speak(u){window.__spoken.push(u.text);setTimeout(()=>{if(window.__ttsFail)u.onerror?.({error:'synthesis-failed'});else u.onstart?.()},25)}}});
'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':393,'height':852})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='load')
 for name in ['src/ui/base.css','src/ui/listening.css']:
  page.add_style_tag(content=(root/name).read_text())
 page.add_script_tag(content=prep)
 for name in ['src/legacy/training-data.js','src/legacy/training.js']:
  page.add_script_tag(content=(root/name).read_text())
 page.add_script_tag(content=bundle)
 page.locator('nav [data-go="listen"]').click()
 assert page.locator('#listen-count').is_visible()
 options=page.locator('#listen-options button')
 assert options.count()==4
 assert all(options.nth(i).is_disabled() for i in range(4)),'choices must stay disabled before listen'
 assert page.locator('#listen').get_by_text('Preguntaron:').count()==0
 assert not page.locator('#listen').get_by_text('I work in sales',exact=False).count()
 page.locator('#play-listen').click()
 spoken=page.evaluate('window.__spoken.at(-1)')
 assert spoken and len(spoken)>15,spoken
 page.wait_for_function('Array.from(document.querySelectorAll("#listen-options button")).every(b=>!b.disabled)')
 assert all(not options.nth(i).is_disabled() for i in range(4))
 correct=page.evaluate('(t)=>window.__listeningQs.find(x=>x.question===t).correct',spoken)
 page.locator('#listen-options button').filter(has_text=correct).click()
 assert 'Interpretaste correctamente' in page.locator('#listen-result').inner_text()
 assert page.locator('#home-practices').inner_text()=='1', 'single listening score must flow to existing stats'
 # Regression: the replay control must work AFTER the answer instead of remaining visually active but silent.
 played_before=page.evaluate('window.__spoken.length')
 page.locator('#play-listen').click()
 assert page.evaluate('window.__spoken.length')==played_before+1,'post-answer replay button was a no-op'
 assert page.locator('#home-practices').inner_text()=='1','replay must not duplicate statistics'
 # Regression: retry exactly the same question as an unscored practice, then allow normal next.
 page.locator('#listen-result').get_by_role('button',name='🔁 Intentar de nuevo (práctica sin nota)').click()
 assert all(options.nth(i).is_disabled() for i in range(4)),'retry must wait for audio again'
 page.locator('#play-listen').click()
 page.wait_for_function('Array.from(document.querySelectorAll("#listen-options button")).every(b=>!b.disabled)')
 assert all(not options.nth(i).is_disabled() for i in range(4)),'retry unlocks after listening'
 page.locator('#listen-options button').filter(has_text=correct).click()
 assert page.locator('#home-practices').inner_text()=='1','retry should not emit another scored event'
 assert 'sin nota' in page.locator('#listen-result').inner_text()
 assert page.evaluate("localStorage.getItem('vox_speak_free_v1')")=='PRODUCTION'
 assert not page.locator('#next-listen').is_hidden()
 page.locator('#next-listen').click()
 assert 'Pregunta nueva' in page.locator('#listen-count').inner_text()
 assert all(options.nth(i).is_disabled() for i in range(4))
 before=page.locator('#home-practices').inner_text()
 page.locator('#listen-reveal').click()
 assert 'intento sin puntuación' in page.locator('#listen-result').inner_text()
 assert page.locator('#home-practices').inner_text()==before
 page.locator('#listen-mode').select_option('general')
 assert 'Cotidiano' in page.locator('#listen-topic').inner_text()
 page.locator('#listen-mode').select_option('professional')
 assert 'Profesional' in page.locator('#listen-topic').inner_text()
 # Regression: a queued/failing TTS cannot unlock answer choices.
 page.evaluate('window.__ttsFail=true')
 page.locator('#play-listen').click()
 page.wait_for_function('document.getElementById("listen-status").textContent.includes("falló")')
 assert all(options.nth(i).is_disabled() for i in range(4)),'failed speech must not unlock choices'
 page.locator('#listen-reveal').click()
 assert page.locator('#home-practices').inner_text()==before,'fallback text does not score'
 page.evaluate('window.__ttsFail=false')
 # Regression: the same incomplete question is restored on refresh while retaining counters.
 page.locator('#next-listen').click()
 pending=page.evaluate('JSON.parse(localStorage.getItem("vox_stage0_preview__listening_unpredictable_v1")).pending')
 assert pending,'pending question should persist before answering'
 expected=page.evaluate('(id)=>window.__listeningQs.find(q=>q.id===id).question',pending)
 page.evaluate('document.querySelector("#listen").dispatchEvent(new Event("dummy"))')
 assert expected,'question ID must resolve'
 assert not errors,errors
 print(json.dumps({'pass':True,'checks':['bank options locked until TTS','hide question until answer','single score to existing legacy stats','reveal without score','domain filters','production keys untouched','browser errors zero'],'firstSpoken':spoken},ensure_ascii=False))
 browser.close()
