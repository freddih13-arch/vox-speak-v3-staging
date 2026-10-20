import {initializeStage0} from './migration.js';
import {mountDiagnostic} from '../diagnostic/ui.js';
import {downloadBackup} from './storage.js';
try {
 const {state,legacy}=initializeStage0();
 mountDiagnostic(state);
 if(Object.values(legacy).some(x=>x.present&&!x.valid)){
  const message=document.createElement('p');message.className='notice warn';message.textContent='Se detectaron datos antiguos que no pueden interpretarse. Permanecen intactos; descarga una copia antes de continuar.';
  document.getElementById('diag-root')?.prepend(message);
 }
} catch(error){
 const root=document.getElementById('diag-root');if(root){root.replaceChildren();const panel=document.createElement('div');panel.className='notice warn';panel.textContent=`VOX 3 está en modo de protección: ${error.message} No se ha modificado la información anterior.`;
  const btn=document.createElement('button');btn.className='btn';btn.textContent='Descargar copia de emergencia';btn.onclick=()=>{try{downloadBackup()}catch(e){panel.textContent=e.message}};root.append(panel,btn)}
 console.error('VOX 3 boot blocked:',error.message);
}
