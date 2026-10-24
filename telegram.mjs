import {projection} from './core.mjs';
export function purchasePlan(state){return {items:state.meds.flatMap(m=>{const p=projection(m);return p?[{id:m.id,name:m.name+(m.strength?' · '+m.strength:''),buyDate:p.buyDate,depletion:p.depletion,quantity:m.buyQty,panvel:m.panvel||''}]:[];})};}
const KEY='cuida-telegram-v1';let config=null,remote=null,error='',pairUrl='',syncing=false,changed=()=>{},queue=Promise.resolve();
try{config=JSON.parse(localStorage.getItem(KEY));}catch{}
export function onTelegramChange(fn){changed=fn;}
export function telegramView(){return {configured:!!config,remote,error,pairUrl,syncing};}
async function api(path,method='GET',body){
 if(!config)throw Error('Configure o serviço de envio primeiro.');
 const response=await fetch(config.url+path,{method,headers:{Authorization:'Bearer '+config.key,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(20000)});
 let result;try{result=await response.json();}catch{throw Error('O serviço não respondeu como esperado. Confira o endereço.');}
 if(!response.ok)throw Error(result.error||'O serviço não confirmou a operação.');return result;
}
export async function refreshTelegram(){try{remote=await api('/status');error='';}catch(e){error=e.message;}changed();return remote;}
export async function configureTelegram(url,key,state){
 const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.search||parsed.hash||parsed.pathname!=='/')throw Error('Use a URL HTTPS do serviço, sem caminho adicional.');
 if(key.trim().length<32)throw Error('A chave de acesso precisa ter pelo menos 32 caracteres.');
 const previous=config;config={url:parsed.origin,key:key.trim()};try{remote=await api('/status');await api('/plan','PUT',purchasePlan(state));localStorage.setItem(KEY,JSON.stringify(config));error='';await refreshTelegram();}catch(e){config=previous;throw e;}
}
export function syncTelegram(state){
 if(!config)return Promise.resolve();
 const plan=purchasePlan(state);syncing=true;changed();
 queue=queue.then(async()=>{try{await api('/plan','PUT',plan);remote=await api('/status');error='';}catch(e){error='Estoque salvo no celular, mas os avisos não foram atualizados: '+e.message;}finally{syncing=false;changed();}});return queue;
}
export async function pairTelegram(){const result=await api('/pair','POST',{});const url=new URL(result.url);if(url.origin!=='https://t.me')throw Error('Link de conexão inválido.');pairUrl=result.url;changed();}
export async function completeTelegram(){remote=await api('/pair/complete','POST',{});pairUrl='';error='';changed();}
export async function testTelegram(){remote=await api('/test','POST',{});error='';changed();}
export async function enableTelegram(enabled,state){await syncTelegram(state);if(error&&enabled)throw Error(error);remote=await api('/settings','POST',{enabled});error='';changed();}
