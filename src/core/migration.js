import {VERSION,KEYS,loadApp,saveApp,inspectLegacy} from './storage.js';
import {createDiagnostic} from '../diagnostic/engine.js';
/** Stage 0 = non-destructive, read-through migration.
 * Previous training/islands code still writes its ORIGINAL storage keys.
 * V3 owns ONLY a new key, never deletes, rewrites, or duplicates legacy data.
 * The original records remain the source of truth until an explicitly approved future migration.
 */
export function initializeStage0(store=localStorage){const existing=loadApp(store);const legacy=inspectLegacy(store);
 if(existing)return {state:existing,legacy,firstRun:false};
 const state={schemaVersion:VERSION,createdAt:new Date().toISOString(),migration:{type:'read-through',legacyKeys:[KEYS.legacyTraining,KEYS.legacyIslands],legacyDetected:legacy,completedAt:new Date().toISOString()},diagnostic:createDiagnostic()};
 saveApp(state,store);return {state,legacy,firstRun:true};
}
