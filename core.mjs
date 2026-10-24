export const DAY=86400000;
export function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}
export function addDays(s,n){return new Date(Date.parse(s+'T12:00:00Z')+n*DAY).toISOString().slice(0,10);}
export function daysBetween(a,b){return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/DAY);}
export function initialState(){return {version:1,person:'Mãe',meds:[],doctors:[{id:'cardio',name:'Cardiologista',waitDays:null},{id:'geri',name:'Geriatra',waitDays:null},{id:'neuro',name:'Neurologista',waitDays:null}]};}
export function projection(m,date=today()){
 if(m.stock===null||!m.countDate)return null;
 const elapsed=Math.max(0,daysBetween(m.countDate,date));
 const remaining=Math.max(0,m.stock-elapsed*m.daily);
 // Data conservadora: primeiro dia sem quantidade suficiente para o consumo diário inteiro.
 const depletion=addDays(m.countDate,Math.floor(m.stock/m.daily+1e-9));
 return {remaining,depletion,buyDate:addDays(depletion,-7),days:Math.max(0,daysBetween(date,depletion))};
}
export function prescriptionStatus(m,date=today()){
 if(!m.needsRx)return 'not-required';
 if(m.rxStatus==='missing')return 'missing';
 if(m.rxUntil&&m.rxUntil<date)return 'expired';
 if(m.rxUnits===0)return 'exhausted';
 if(m.rxStatus==='available'||m.rxUntil||m.rxUnits!==null)return 'available';
 return 'unknown';
}
export function scheduledDoctor(state,m,date=today()){
 return state.doctors.filter(d=>(m.doctorIds||[m.doctorId]).includes(d.id)&&d.appointmentDate&&d.appointmentDate>=date).sort((a,b)=>a.appointmentDate.localeCompare(b.appointmentDate))[0];
}
export function reminders(state,date=today()){
 const out=[];
 for(const d of state.doctors){if(d.appointmentDate)out.push({id:d.id+'-appointment',type:'appointment',title:`Consulta com ${d.name}`,date:d.appointmentDate,detail:'Consulta marcada. Após o atendimento, confira se a receita foi obtida e atualize o controle.'});}
 for(const m of state.meds){const p=projection(m,date);if(p)out.push({id:m.id+'-buy',medId:m.id,type:'buy',title:`Comprar ${m.name}`,date:p.buyDate,detail:`Estoque estimado até ${formatDate(p.depletion)}. Confira a quantidade antes de comprar.`});
 if(!m.needsRx)continue;
 const status=prescriptionStatus(m,date);
 const appointment=scheduledDoctor(state,m,date);
 if(['missing','expired','exhausted'].includes(status)){
  out.push({id:m.id+'-rx',medId:m.id,type:'rx',title:`Obter receita de ${m.name}`,date:date,detail:appointment?`Consulta marcada com ${appointment.name} em ${formatDate(appointment.appointmentDate)}. Confirme a obtenção da receita após o atendimento.`:'Sem receita disponível para uma nova compra. Agende uma consulta ou solicite a receita ao médico.'});
  if(!appointment)out.push({id:m.id+'-visit',medId:m.id,type:'visit',title:`Providenciar consulta para ${m.name}`,date:date,detail:'Ainda não há consulta marcada com um dos médicos vinculados.'});
  continue;
 }
 const deadlines=[];
 if(m.rxUntil)deadlines.push(m.rxUntil);
 if(p&&m.buyQty!==null&&m.rxUnits!==null&&m.rxUnits<m.buyQty)deadlines.push(p.buyDate);
 if(!deadlines.length)continue;
 const deadline=deadlines.sort()[0];
 out.push({id:m.id+'-rx',medId:m.id,type:'rx',title:`Renovar receita de ${m.name}`,date:addDays(deadline,-7),detail:`Renovação necessária até ${formatDate(deadline)}. Confirme as condições com a farmácia ou o médico.`});
 const doctor=state.doctors.filter(d=>(m.doctorIds||[m.doctorId]).includes(d.id)&&d.waitDays!==null).sort((a,b)=>a.waitDays-b.waitDays)[0];
 if(doctor?.waitDays!==null&&doctor?.waitDays!==undefined&&(!appointment||appointment.appointmentDate>deadline))out.push({id:m.id+'-visit',medId:m.id,type:'visit',title:`Agendar ${doctor.name}: ${m.name}`,date:addDays(deadline,-doctor.waitDays-7),detail:`Espera informada: ${doctor.waitDays} dias, com 7 dias de margem antes de ${formatDate(deadline)}.`});
 }return out.sort((a,b)=>a.date.localeCompare(b.date));
}
export function formatDate(s){return validDate(s)?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z')):'Não informada';}
export function validateState(s){
 if(!s||s.version!==1||typeof s.person!=='string'||!s.person.trim()||s.person.length>80||!Array.isArray(s.meds)||!Array.isArray(s.doctors)||s.meds.length>500||s.doctors.length>50)throw Error('Arquivo de backup incompatível.');
 const ids=new Set();for(const d of s.doctors){if(typeof d.id!=='string'||ids.has(d.id)||typeof d.name!=='string'||!d.name.trim()||!(d.waitDays===null||(Number.isInteger(d.waitDays)&&d.waitDays>=0&&d.waitDays<=730)))throw Error('Dados de médicos inválidos.');if(d.appointmentDate&&!validDate(d.appointmentDate))throw Error('Data de consulta inválida.');ids.add(d.id);}
 const meds=new Set();for(const m of s.meds){if(typeof m.id!=='string'||meds.has(m.id)||typeof m.name!=='string'||!m.name.trim()||!(m.stock===null||(Number.isFinite(m.stock)&&m.stock>=0))||!Number.isFinite(m.daily)||m.daily<=0||!(m.buyQty===null||(Number.isFinite(m.buyQty)&&m.buyQty>0))||!(m.stock===null?(m.countDate===null||validDate(m.countDate)):validDate(m.countDate))||typeof m.needsRx!=='boolean'||typeof m.unit!=='string'||!m.unit.trim()||typeof m.strength!=='string'||!(m.rxUnits===null||(Number.isFinite(m.rxUnits)&&m.rxUnits>=0))||(m.rxUntil&&!validDate(m.rxUntil))||(m.doctorId&&!ids.has(m.doctorId))||(m.doctorIds&&(!Array.isArray(m.doctorIds)||!m.doctorIds.every(id=>ids.has(id))))||(m.panvel&&!/^https:\/\/(www\.)?panvel\.com\//i.test(m.panvel)))throw Error('Dados de medicação inválidos.');if(m.rxStatus!==undefined&&!['unknown','missing','available'].includes(m.rxStatus))throw Error('Situação de receita inválida.');meds.add(m.id);}
 return s;
}
function icsEscape(v){return String(v).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
function fold(line){let result='',part='',len=0;for(const ch of line){const bytes=new TextEncoder().encode(ch).length;if(len+bytes>74){result+=part+'\r\n';part=' ';len=1;}part+=ch;len+=bytes;}return result+part;}
export function calendar(state,date=today()){
 const events=reminders(state,date);const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Cuida//Controle familiar//PT-BR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Cuida • '+icsEscape(state.person)];
 for(const e of events){const start=e.date<date?date:e.date;lines.push('BEGIN:VEVENT',`UID:${e.id}@cuida.local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;VALUE=DATE:${start.replaceAll('-','')}`,`DTEND;VALUE=DATE:${addDays(start,1).replaceAll('-','')}`,`SUMMARY:${icsEscape(e.title+' • '+state.person)}`,`DESCRIPTION:${icsEscape(e.detail+(e.date<date?' Prazo original: '+formatDate(e.date)+'.':''))}`,'BEGIN:VALARM','TRIGGER:PT9H','ACTION:DISPLAY','DESCRIPTION:'+icsEscape(e.title),'END:VALARM','END:VEVENT');}
 lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
}
