/** VOX Speak 3: data access. No legacy keys are ever overwritten here. */
export const KEYS = Object.freeze({legacyTraining:'vox_stage0_preview__vox_speak_free_v1',legacyIslands:'vox_stage0_preview__vox-islands-v2',app:'vox_stage0_preview__vox_speak_v3_stage0'});
export const VERSION = 3;
export class StorageError extends Error { constructor(message){super(message);this.name='StorageError'} }
function readRaw(store,key){try{return store.getItem(key)}catch(error){throw new StorageError(`No se pudo leer ${key}. Verifica el almacenamiento del navegador.`)}}
function parse(raw,key){if(raw===null)return null;try{const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('invalid object');return parsed}catch(_){throw new StorageError(`Los datos de ${key} están dañados. No se han modificado; exporta una copia antes de continuar.`)}}
export function loadApp(store=localStorage){const raw=readRaw(store,KEYS.app);const data=parse(raw,KEYS.app);if(data && (data.schemaVersion!==VERSION || !data.diagnostic || typeof data.diagnostic!=='object'))throw new StorageError('Se encontró una versión incompatible de VOX 3. No se sobrescribirá.');return data}
export function saveApp(data,store=localStorage){if(data?.schemaVersion!==VERSION)throw new StorageError('El formato de VOX 3 no es válido.');
 // Refuse to overwrite an existing corrupt or incompatible v3 object.
 loadApp(store);
 try{store.setItem(KEYS.app,JSON.stringify(data))}catch(_){throw new StorageError('No se pudo guardar VOX 3 (almacenamiento lleno o bloqueado). Exporta una copia de seguridad.')}
}
export function inspectLegacy(store=localStorage){const result={};for(const [name,key] of [['training',KEYS.legacyTraining],['islands',KEYS.legacyIslands]]){
 const raw=readRaw(store,key);if(raw===null){result[name]={present:false,valid:false};continue}
 try{const obj=parse(raw,key);result[name]={present:true,valid:true,bytes:raw.length,entries:name==='islands'?Object.keys(obj.cards||{}).length:Object.keys(obj.days||{}).length}}catch(_){result[name]={present:true,valid:false,bytes:raw.length}}
 }return result}
/** Exact, unmodified raw text snapshots permit restoring legacy data without schema guessing. */
export function createBackup(store=localStorage){const raw={};for(const key of Object.values(KEYS))raw[key]=readRaw(store,key);
 return {format:'vox-stage0-backup',version:1,exportedAt:new Date().toISOString(),raw};}
export function downloadBackup(store=localStorage,doc=document){const backup=createBackup(store);const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});const href=URL.createObjectURL(blob);const a=doc.createElement('a');a.href=href;a.download=`vox-speak-respaldo-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(href),2000)}
