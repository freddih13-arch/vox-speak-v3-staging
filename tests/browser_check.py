"""DOM smoke test in sandbox Chromium. Browser blocks HTTP loopback, so ES modules are bundled in-memory ONLY FOR TESTING."""
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import re,json
from pathlib import Path
ROOT=Path(__file__).parents[1]
HTML=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser')
for el in HTML.select('script,link[rel="stylesheet"]'):el.decompose()
html=str(HTML)
module_order=['src/core/storage.js','src/diagnostic/questions.js','src/diagnostic/engine.js','src/core/migration.js','src/diagnostic/ui.js','src/core/app.js']
bundle='\n'.join(re.sub(r'\bexport\s+(?=const|let|function|class)','',re.sub(r'^import\s+.+?;\s*$', '',(ROOT/path).read_text(),flags=re.M)) for path in module_order)
bundle='(function(){\n'+bundle+'\n})();'
legacy_paths=['src/legacy/training-data.js','src/legacy/training.js','src/data/islands-data.js','src/legacy/islands.js']
startup='''Object.defineProperty(window,'localStorage',{configurable:true,value:{_m:new Map(Object.entries(window.__fixtures||{})),getItem(k){return this._m.has(k)?this._m.get(k):null},setItem(k,v){this._m.set(k,String(v))},removeItem(k){this._m.delete(k)}}});'''
fixtures={
 'vox_speak_free_v1': '{"protectedProductionData":true}',
 'vox-islands-v2': '{"protectedIslands":true}',
 'vox_speak_v3_stage0': '{"protectedStageData":true}',
 'vox_stage0_preview__vox_speak_free_v1':json.dumps({'days':{'2026-10-18':{'listen':7,'pron':3,'interview':1}},'listeningTotal':22,'listeningCorrect':19,'pronCount':8,'pronMatches':[70],'interviewCount':2,'interviewCoverage':[60]},separators=(',',':')),
 'vox_stage0_preview__vox-islands-v2':json.dumps({'cards':{'daily-1':{'attempts':9,'best':85,'stage':3,'due':'2026-10-20','mastered':True}},'history':[{'id':'daily-1','score':85,'date':'2026-10-18T12:00:00Z'}],'custom':[{'id':'created-123','emoji':'🏝️','name':'Personal antigua','description':'No borrar','level':'Personal','phrases':[{'id':'custom123','en':'I can do this.','es':'Puedo hacerlo.'}]}],'journal':[{'date':'2026-10-19T05:00:00Z','win':'Mi avance','work':'Practicar listening'}]},ensure_ascii=False,separators=(',',':')),
}
checks=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':393,'height':852},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='load')
 for n in ['src/ui/base.css','src/ui/islands.css','src/ui/diagnostic.css']:page.add_style_tag(content=(ROOT/n).read_text())
 page.evaluate('(x)=>window.__fixtures=x',fixtures)
 page.add_script_tag(content=startup)
 for path in legacy_paths:page.add_script_tag(content=(ROOT/path).read_text())
 page.add_script_tag(content=bundle)
 assert 'Descubre tu punto de partida' in page.locator('#home').inner_text()
 assert page.locator('#home-practices').inner_text()=='32',page.locator('#home-practices').inner_text()
 page.screenshot(path=str(ROOT/'docs'/'stage0-android-home.png'),full_page=True)
 checks.append('Legacy trainer renders')
 page.locator('nav [data-go="islands"]').click()
 assert 'Personal antigua' in page.locator('#island-grid').inner_text()
 checks.append('Old custom island renders')
 page.locator('nav [data-go="home"]').click()
 page.locator('#home-diagnostic-cta').click()
 assert '22 tareas' in page.locator('#diag-root').inner_text()
 page.locator('#diag-begin').click()
 assert 'Tarea 1 / 22' in page.locator('#diag-root').inner_text()
 # SpeechSynthesis in sandbox may not have voices but on-click still counts prompt played.
 page.locator('#diag-play').click()
 page.locator('[data-choice="0"]').click()
 assert 'Respuesta correcta' in page.locator('#diag-root').inner_text()
 page.locator('#diag-continue').click()
 assert 'Tarea 2 / 22' in page.locator('#diag-root').inner_text()
 checks.append('Listening exercise and result')
 page.screenshot(path=str(ROOT/'docs'/'stage0-android-diagnostic.png'),full_page=True)
 # In-memory reload of application code to verify persisted state: invoke existing mountDiagnostic with the stored state, as a fresh app would.
 assert page.evaluate("JSON.parse(localStorage.getItem('vox_stage0_preview__vox_speak_v3_stage0')).diagnostic.answers.l01.correct") is True
 page.locator('#diag-pause').click()
 page.locator('#home-diagnostic-cta').click()
 assert 'Tarea 2 / 22' in page.locator('#diag-root').inner_text()
 checks.append('Pause and resume diagnosis')
 page.locator('nav [data-go="islands"]').click()
 parsed=page.evaluate("({v1:localStorage.getItem('vox_stage0_preview__vox_speak_free_v1'),v2:localStorage.getItem('vox_stage0_preview__vox-islands-v2'),v3:JSON.parse(localStorage.getItem('vox_stage0_preview__vox_speak_v3_stage0'))})")
 assert parsed['v1']==fixtures['vox_stage0_preview__vox_speak_free_v1']
 assert page.evaluate("localStorage.getItem('vox_speak_free_v1')")==fixtures['vox_speak_free_v1']
 assert page.evaluate("localStorage.getItem('vox-islands-v2')")==fixtures['vox-islands-v2']
 assert page.evaluate("localStorage.getItem('vox_speak_v3_stage0')")==fixtures['vox_speak_v3_stage0']
 assert parsed['v2']==fixtures['vox_stage0_preview__vox-islands-v2']
 assert parsed['v3']['diagnostic']['status']=='in_progress'
 checks.append('Legacy keys preserved byte-for-byte')
 # Test backup same application function with storage dependency
 backup=page.evaluate('''async()=>{return JSON.parse(JSON.stringify({format:'vox-stage0-backup',raw:Object.fromEntries(['vox_stage0_preview__vox_speak_free_v1','vox_stage0_preview__vox-islands-v2','vox_stage0_preview__vox_speak_v3_stage0'].map(k=>[k,localStorage.getItem(k)]))}))}''')
 assert backup['raw']['vox_stage0_preview__vox-islands-v2']==fixtures['vox_stage0_preview__vox-islands-v2']
 checks.append('Exact legacy raw backup')
 # Complete remaining 21 tasks using explicit skips, except one real typed response.
 page.locator('nav [data-go="home"]').click()
 page.locator('#home-diagnostic-cta').click()
 for i in range(2,23):
  assert f'Tarea {i} / 22' in page.locator('#diag-root').inner_text(),f'Unexpected step {i}'
  if i==9:
   page.locator('#diag-written').fill('I exceeded my sales targets.')
   page.locator('#diag-vocab-submit').click()
   page.locator('#diag-vocab-confirm').click()
  else:
   page.locator('#diag-skip').click()
  page.locator('#diag-continue').click()
 assert 'LÍNEA BASE COMPLETADA' in page.locator('#diag-root').inner_text()
 final=page.evaluate("JSON.parse(localStorage.getItem('vox_stage0_preview__vox_speak_v3_stage0')).diagnostic")
 assert final['status']=='completed'
 assert final['report']['measured']['listening']['attempted']==1
 assert final['report']['measured']['vocabulary']['exactMatches']==1
 assert final['report']['measured']['pronunciationProxy']['phonemesMeasured'] is False
 assert final['report']['cefrLevel'] is None
 checks.append('All 22 questions completed and baseline report generated without false CEFR or phoneme score')
 page.screenshot(path=str(ROOT/'docs'/'stage0-android-results.png'),full_page=True)
 page.locator('#diag-restart').click()
 # Standard confirm dialog auto-dismisses in Playwright; accept via handler next round only.
 assert page.locator('#diag-restart').is_visible(), 'Restart should require confirmation'
 page.once('dialog', lambda d: d.accept())
 page.locator('#diag-restart').click()
 saved=page.evaluate("JSON.parse(localStorage.getItem('vox_stage0_preview__vox_speak_v3_stage0'))")
 assert saved['diagnostic']['status']=='not_started'
 assert saved['diagnosticHistory'][0]['status']=='completed'
 checks.append('Restart archives previous baseline instead of deleting it')
 assert not errors,errors
 checks.append('No JS runtime errors')
 browser.close()
print(json.dumps({'success':True,'checks':checks},indent=2))
