import {WEEKS,periodsFor,scheduledClassFor,scheduledElementaryClassFor,matchedSecondaryTeacher,ELEMENTARY_SCHEDULE_IDENTITIES} from "./config.js";
export function discoverClasses(division,entries,directory,timetables){
 const opened=entries.filter(e=>e.division===division).map(e=>({...e,source:"posted"}));
 const persons=new Map();
 function add(name,email){if(!name)return;const key=email?.toLowerCase()||"name:"+name.toLowerCase();if(!persons.has(key))persons.set(key,{name,email:email||""});}
 for(const person of directory.filter(p=>p.division===division))add(person.name,person.email);
 if(division==="Elementary")for(const p of ELEMENTARY_SCHEDULE_IDENTITIES)if(p.email&&!p.shared)add(p.name,p.email);
 else{} 
 if(division==="Secondary")for(const name of Object.keys(timetables.sec||{})){
   if(![...persons.values()].some(p=>matchedSecondaryTeacher(p.name,p.email,timetables)===name))add(name,"");
 }
 const scheduled=[];
 for(const person of persons.values())for(const week of WEEKS)for(const date of week.dates)for(const p of periodsFor(division)){
 const lesson=division==="Elementary"?scheduledElementaryClassFor(person.name,date,p.key,timetables,person.email):scheduledClassFor(person.name,date,p.key,timetables,person.email);
 if(!lesson)continue;
 if(opened.some(e=>e.date_str===date&&e.period_key===p.key&&
  ((person.email&&e.host_email?.toLowerCase()===person.email.toLowerCase())||e.host_name?.toLowerCase()===person.name.toLowerCase())))continue;
 scheduled.push({id:"schedule:"+division+":"+date+":"+p.key+":"+person.name,source:"scheduled",division,date_str:date,
 period_key:p.key,host_name:person.name,host_email:person.email,subject:lesson.subject,grade:lesson.grade,room:lesson.room,
 strategies:[],standards:[],note:null});
 }
 return [...opened,...scheduled];
}
