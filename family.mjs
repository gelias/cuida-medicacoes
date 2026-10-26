import {validateState} from './core.mjs';
// Local edits and their base revision are kept together for recovery after a reload.
export function createFamilySync({storage,api,getLocal,applyRemote,onChange=()=>{}}){
 const KEY='cuida-cloud-v1';let meta=null,busy=false,error='',conflict=false,generation=0,ready=false;
 try{meta=JSON.parse(storage.getItem(KEY));}catch{}
 const view=()=>({ready,busy,error,conflict,dirty:!!meta?.dirty,updatedAt:meta?.updatedAt||null});
 const notify=()=>onChange(view());
 function persist(next){storage.setItem(KEY,JSON.stringify(next));meta=next;}
 function mark(next){validateState(next);const record={...meta,revision:meta?.revision??null,dirty:true,pending:structuredClone(next)};persist(record);generation++;notify();}
 function clear(saved){persist({revision:saved.revision,updatedAt:saved.updatedAt,dirty:false});}
 function accept(saved){validateState(saved.state);applyRemote(saved.state);clear(saved);}
 async function refresh(){
  if(busy)return;busy=true;error='';notify();
  try{
   const saved=await api('/family');if(!Number.isSafeInteger(saved.revision)||saved.revision<0)throw Error('Resposta de sincronização inválida.');
   if(saved.state)validateState(saved.state);
   // A request may complete after a local edit; inspect current metadata, not an old snapshot.
   if(meta?.dirty){
    if(meta.revision===null){if(saved.state&&JSON.stringify(saved.state)!==JSON.stringify(meta.pending))conflict=true;else persist({...meta,revision:saved.revision});}
    else if(meta.revision!==saved.revision)conflict=true;
   }else if(saved.state){
    if(!meta&&getLocal().meds.length&&JSON.stringify(getLocal())!==JSON.stringify(saved.state)){
     mark(getLocal());conflict=true;
    }else accept(saved);
   }else{
    persist({revision:0,dirty:false});
    if(getLocal().meds.length)mark(getLocal());
   }
   ready=true;
  }catch(e){error=e.message;}finally{busy=false;notify();}
  if(ready&&meta?.dirty&&!conflict&&!error)await flush();
 }
 async function flush(){
  if(busy||conflict)return;
  if(!ready){await refresh();return;}
  busy=true;error='';notify();
  try{
   while(meta?.dirty&&!conflict){
    const current=generation;const saved=await api('/family','PUT',{revision:meta.revision,state:meta.pending});
    if(generation===current)clear(saved);else persist({...meta,revision:saved.revision,updatedAt:saved.updatedAt});
   }
  }catch(e){if(e.status===409)conflict=true;error=e.message;}finally{busy=false;notify();}
 }
 async function resolve(choice){
  if(busy)return;busy=true;error='';notify();
  try{
   const saved=await api('/family');if(saved.state)validateState(saved.state);
   if(choice==='cloud'){
    if(!saved.state)throw Error('Ainda não há um cadastro salvo na nuvem.');
    // Keep a private local recovery copy before replacing an unsent draft.
    storage.setItem('cuida-before-cloud-restore',JSON.stringify(getLocal()));accept(saved);
   }else if(choice==='local')persist({...meta,revision:saved.revision,dirty:true,pending:structuredClone(getLocal())});
   else throw Error('Escolha inválida.');
   conflict=false;ready=true;
  }catch(e){error=e.message;}finally{busy=false;notify();}
  if(!error&&meta?.dirty)await flush();
 }
 function recover(){return meta?.dirty&&meta.pending?validateState(meta.pending):null;}
 return {view,mark,refresh,flush,resolve,recover};
}
