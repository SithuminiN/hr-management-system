import {useState} from 'react';
import {Shell,Head,Badge,Stat,Note,Empty,Back,Modal,Confirm,Field,useTabs,useForm,useToast} from './common/ui.jsx';
import {today,addDays,fmtD,initials} from './common/utils.js';
import {META} from './meta.js';

const ME='EMP-0003';
const DEPTS=['Human Resources','Finance','Engineering','Sales & Marketing','Operations'];
const DESIGS=['HR Executive','Accountant','Software Engineer','Senior Software Engineer','Team Lead','Sales Executive','Operations Manager','Intern'];
const TYPES=['Full-time','Part-time','Contract','Intern'];
const STATUSES=['Active','On probation','On leave','Inactive'];
const DOCTYPES=['National ID copy','Employment contract','Qualification certificate','Resume / CV','Other'];
const SK={Active:'ok','On probation':'info','On leave':'warn',Inactive:'mut'};
const E=(id,fn,ln,dept,des,type,status,join,phone,nid,dob)=>({id,fn,ln,dept,des,type,status,join,email:(fn+'.'+ln).toLowerCase()+'@example.com',phone,nid,dob,addr:'',ecName:'',ecPhone:'',docs:[],hist:[{d:join,t:'Joined as '+des}]});
const SEED=[
 E('EMP-0001','Nadeesha','Perera','Human Resources','HR Executive','Full-time','Active','2022-03-14','0771234501','199001234567','1990-05-12'),
 E('EMP-0002','Kasun','Silva','Finance','Accountant','Full-time','Active','2021-08-02','0771234502','198809876543','1988-11-03'),
 {...E('EMP-0003','Ishara','Fernando','Engineering','Software Engineer','Full-time','Active','2023-01-09','0771234503','199211223344','1992-02-27'),docs:[{n:'Employment contract.pdf',type:'Employment contract',d:'2023-01-09',size:'212 KB'}]},
 E('EMP-0004','Tharindu','Jayasinghe','Engineering','Team Lead','Full-time','Active','2020-06-22','0771234504','198555667788','1985-09-18'),
 E('EMP-0005','Sanduni','Wickramasinghe','Sales & Marketing','Sales Executive','Contract','On probation',addDays(today(),-60),'0771234505','199677889900','1996-07-30'),
 E('EMP-0006','Ruwan','Gunasekara','Operations','Operations Manager','Full-time','On leave','2019-11-04','0771234506','198233445566','1982-12-01'),
 E('EMP-0007','Dilini','Rajapaksha','Engineering','Intern','Intern','Active',addDays(today(),-40),'0771234507','200012345678','2000-04-15'),
 {...E('EMP-0008','Chamara','Bandara','Finance','Accountant','Part-time','Inactive','2021-02-15','0771234508','199099887766','1990-08-09'),hist:[{d:'2021-02-15',t:'Joined as Accountant'},{d:'2026-06-30',t:'Deactivated — Resigned'}]}];
const TABS=[{id:'list',label:'Employees'},{id:'profile',label:'Profile',hidden:true,parent:'list'},{id:'form',label:'Form',hidden:true,parent:'list',roles:['hr','emp']}];
const full=e=>e.fn+' '+e.ln;
const mask=s=>s?s.slice(0,3)+'•'.repeat(Math.max(0,s.length-3)):'–';
const PHONE=/^[0-9+\s-]{9,15}$/;

export default function App(){
  const[role,setRole]=useState('hr');
  const[emp,setEmp]=useState(SEED);
  const[next,setNext]=useState(9);
  const{cur,arg,vis,go}=useTabs(TABS,role);
  const upd=(id,fn)=>setEmp(l=>l.map(e=>e.id===id?fn({...e,hist:[...e.hist],docs:[...e.docs]}):e));
  const p={role,emp,upd,go,arg,next,setNext,setEmp};
  const View={list:List,profile:Profile,form:EmpForm}[cur.id];
  return <Shell {...META} vis={vis} cur={cur} role={role} setRole={setRole} roles={[['hr','HR admin'],['mgr','Manager'],['emp','Employee']]}><View {...p}/></Shell>;
}

function List({role,emp,go}){
  const[q,setQ]=useState('');const[fd,setFd]=useState('');const[fs,setFs]=useState('');
  const scope=role==='hr'?emp:role==='mgr'?emp.filter(e=>e.dept==='Engineering'):emp.filter(e=>e.id===ME);
  const t=q.toLowerCase();
  const l=scope.filter(e=>(!fd||e.dept===fd)&&(!fs||e.status===fs)&&(!t||(full(e)+e.id+e.email).toLowerCase().includes(t)));
  return(<>
    <Head title={role==='emp'?'My record':role==='mgr'?'My team':'Employees'} sub={role==='hr'?'Create and maintain employee records.':role==='mgr'?'Employees in Engineering. Personal identifiers are hidden for managers.':'You can view your record and update your contact details.'}>
      {role==='hr'&&<button className="btn" onClick={()=>go('form')}>Add employee</button>}
    </Head>
    <Note><b>Needs stakeholder confirmation:</b> mandatory fields, employee ID format and required documents. Sample data shown for demonstration.</Note>
    <div className="grid"><Stat label="Total" value={scope.length}/><Stat label="Active" value={scope.filter(e=>e.status==='Active').length}/><Stat label="On probation" value={scope.filter(e=>e.status==='On probation').length}/><Stat label="Inactive" value={scope.filter(e=>e.status==='Inactive').length}/></div>
    {role!=='emp'&&<div className="bar">
      <input type="search" placeholder="Search name, ID or email" value={q} onChange={e=>setQ(e.target.value)} aria-label="Search employees"/>
      <select value={fd} onChange={e=>setFd(e.target.value)} aria-label="Department"><option value="">All departments</option>{DEPTS.map(d=><option key={d}>{d}</option>)}</select>
      <select value={fs} onChange={e=>setFs(e.target.value)} aria-label="Status"><option value="">All statuses</option>{STATUSES.map(d=><option key={d}>{d}</option>)}</select></div>}
    {l.length?<div className="tw"><table><thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Designation</th><th>Status</th><th></th></tr></thead><tbody>
      {l.map(e=><tr key={e.id} className="clickable" onClick={()=>go('profile:'+e.id)}><td className="nowrap">{e.id}</td><td><div className="row"><span className="avatar">{initials(full(e))}</span>{full(e)}</div></td><td>{e.dept}</td><td>{e.des}</td><td><Badge k={SK[e.status]}>{e.status}</Badge></td><td><button className="btn ghost s" onClick={ev=>{ev.stopPropagation();go('profile:'+e.id)}}>View</button></td></tr>)}
    </tbody></table></div>:<Empty title="No employees match" sub="Clear the search or change the filters."/>}
  </>);
}

function Profile({role,emp,arg,go,upd}){
  const toast=useToast();const[m,setM]=useState(null);
  const e=emp.find(x=>x.id===arg);
  if(!e||(role==='emp'&&e.id!==ME))return <Empty title="Employee not found" sub="Go back to the list and choose a record."/>;
  const hr=role==='hr',own=e.id===ME,seeAll=hr||own;
  const log=t=>({d:today(),t});
  return(<>
    <Head title={full(e)} sub={`${e.id} · ${e.des} · ${e.dept}`}>
      <div className="row"><Badge k={SK[e.status]}>{e.status}</Badge>
        {(hr||own)&&<button className="btn ghost" onClick={()=>go('form:'+e.id)}>{hr?'Edit':'Update contact details'}</button>}
        {hr&&(e.status==='Inactive'?<button className="btn" onClick={()=>setM({t:'react'})}>Reactivate</button>:<button className="btn danger" onClick={()=>setM({t:'deact'})}>Deactivate</button>)}</div>
    </Head>
    <Back onClick={()=>go('list')}>Back to list</Back>
    <div className="cols" style={{marginTop:10}}>
      <div className="card"><h3>Personal details</h3><dl className="kv"><dt>Email</dt><dd>{e.email}</dd><dt>Phone</dt><dd>{seeAll?e.phone||'–':mask(e.phone)}</dd><dt>National ID</dt><dd>{seeAll?e.nid||'–':mask(e.nid)}</dd><dt>Date of birth</dt><dd>{seeAll?fmtD(e.dob):'Hidden'}</dd><dt>Address</dt><dd>{seeAll?e.addr||'–':'Hidden'}</dd><dt>Emergency contact</dt><dd>{seeAll?(e.ecName?`${e.ecName} · ${e.ecPhone}`:'–'):'Hidden'}</dd></dl></div>
      <div className="card"><h3>Employment</h3><dl className="kv"><dt>Employee ID</dt><dd>{e.id}</dd><dt>Department</dt><dd>{e.dept}</dd><dt>Designation</dt><dd>{e.des}</dd><dt>Type</dt><dd>{e.type}</dd><dt>Joined</dt><dd>{fmtD(e.join)}</dd><dt>Status</dt><dd><Badge k={SK[e.status]}>{e.status}</Badge></dd></dl></div>
    </div>
    {seeAll&&<div className="card"><div className="row sp"><h3>Documents</h3>{(hr||own)&&<button className="btn ghost s" onClick={()=>setM({t:'doc'})}>Add document</button>}</div>
      {e.docs.length?<div className="tw"><table><thead><tr><th>File</th><th>Type</th><th>Added</th><th>Size</th><th></th></tr></thead><tbody>{e.docs.map((d,i)=><tr key={i}><td>{d.n}</td><td>{d.type}</td><td>{fmtD(d.d)}</td><td>{d.size}</td><td>{hr&&<button className="btn ghost s" onClick={()=>setM({t:'deldoc',i})}>Remove</button>}</td></tr>)}</tbody></table></div>:<Empty title="No documents yet" sub="Add contracts, ID copies and certificates."/>}</div>}
    <div className="card"><h3>Status and change history</h3>{[...e.hist].reverse().map((h,i)=><div key={i} className="row" style={{padding:'6px 0',borderBottom:'1px solid var(--line)'}}><span className="muted sm nowrap" style={{minWidth:90}}>{fmtD(h.d)}</span><span>{h.t}</span></div>)}</div>
    {m?.t==='deact'&&<DeactModal onClose={()=>setM(null)} onDone={why=>{upd(e.id,x=>{x.status='Inactive';x.hist.push(log('Deactivated — '+why));return x});setM(null);toast(full(e)+' deactivated')}}/>}
    {m?.t==='react'&&<Confirm title="Reactivate employee" message={`Set ${full(e)} back to Active?`} label="Reactivate" onClose={()=>setM(null)} onYes={()=>{upd(e.id,x=>{x.status='Active';x.hist.push(log('Reactivated'));return x});toast('Employee reactivated')}}/>}
    {m?.t==='deldoc'&&<Confirm title="Remove document" danger label="Remove" message={`Remove “${e.docs[m.i].n}” from this record?`} onClose={()=>setM(null)} onYes={()=>{upd(e.id,x=>{x.hist.push(log('Document removed: '+x.docs[m.i].n));x.docs.splice(m.i,1);return x});toast('Document removed')}}/>}
    {m?.t==='doc'&&<DocModal onClose={()=>setM(null)} onAdd={(f,type)=>{upd(e.id,x=>{x.docs.push({n:f.name,type,d:today(),size:f.size>1048576?(f.size/1048576).toFixed(1)+' MB':Math.max(1,Math.round(f.size/1024))+' KB'});x.hist.push(log('Document added: '+f.name));return x});setM(null);toast('Document added')}}/>}
  </>);
}
function DeactModal({onClose,onDone}){
  const[why,setWhy]=useState('Resigned');const[n,setN]=useState('');
  return <Modal title="Deactivate employee" onClose={onClose} footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn danger" onClick={()=>onDone(why+(n?': '+n:''))}>Deactivate</button></>}>
    <p>The record is kept for history but the employee is marked inactive.</p>
    <Field label="Reason" req options={['Resigned','Terminated','Contract ended','Retired','Other']} value={why} onChange={setWhy}/>
    <Field label="Details (optional)" type="textarea" rows={2} value={n} onChange={setN}/></Modal>;
}
function DocModal({onClose,onAdd}){
  const[type,setType]=useState(DOCTYPES[0]);const[file,setFile]=useState(null);const[err,setErr]=useState('');
  return <Modal title="Add document" onClose={onClose} footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" onClick={()=>file?onAdd(file,type):setErr('Choose a file to attach.')}>Add document</button></>}>
    <Field label="Document type" req options={DOCTYPES} value={type} onChange={setType}/>
    <Field label="File" req type="file" hint="This prototype stores the file name and size only." onChange={f=>{setFile(f);setErr('')}} error={err}/></Modal>;
}

function EmpForm({role,emp,arg,go,upd,next,setNext,setEmp}){
  const toast=useToast();const e=arg?emp.find(x=>x.id===arg):null;const lim=role==='emp';
  const f=useForm({fn:e?.fn||'',ln:e?.ln||'',nid:e?.nid||'',dob:e?.dob||'',email:e?.email||'',phone:e?.phone||'',addr:e?.addr||'',ecName:e?.ecName||'',ecPhone:e?.ecPhone||'',dept:e?.dept||'',des:e?.des||'',type:e?.type||'Full-time',join:e?.join||'',status:e?.status||'Active'});
  if(role==='mgr'||(arg&&!e))return <Empty title="Not available" sub="You do not have permission to edit employee records."/>;
  if(lim&&(!e||e.id!==ME))return <Empty title="Not available" sub="You can only update your own contact details."/>;
  const v=f.v,d=lim;const back=()=>go(e?'profile:'+e.id:'list');
  const save=()=>{const er={};
    if(!lim){if(!v.fn.trim())er.fn='Enter the first name.';if(!v.ln.trim())er.ln='Enter the last name.';
      if(!v.email.trim())er.email='Enter the work email.';else if(!/^\S+@\S+\.\S+$/.test(v.email))er.email='Enter a valid email, like name@company.com.';else if(emp.some(x=>x.id!==e?.id&&x.email.toLowerCase()===v.email.toLowerCase()))er.email='Another employee already uses this email.';
      if(v.nid&&emp.some(x=>x.id!==e?.id&&x.nid===v.nid))er.nid='Another employee already has this National ID.';
      if(v.dob&&v.dob>today())er.dob='Date of birth cannot be in the future.';
      if(!v.dept)er.dept='Choose a department.';if(!v.des)er.des='Choose a designation.';if(!v.join)er.join='Enter the join date.'}
    if(v.phone&&!PHONE.test(v.phone))er.phone='Enter a valid phone number, like 0771234567.';
    if(v.ecPhone&&!PHONE.test(v.ecPhone))er.ecPhone='Enter a valid phone number.';
    if(f.invalid(er))return;
    const log=t=>({d:today(),t});
    if(e){upd(e.id,x=>{if(!lim){if(x.dept!==v.dept)x.hist.push(log(`Department changed: ${x.dept} → ${v.dept}`));if(x.des!==v.des)x.hist.push(log(`Designation changed: ${x.des} → ${v.des}`));if(x.status!==v.status){x.hist.push(log(`Status changed: ${x.status} → ${v.status}`));x.status=v.status}}
        ['phone','addr','ecName','ecPhone',...(lim?[]:['fn','ln','nid','dob','email','dept','des','type','join'])].forEach(k=>x[k]=v[k]);return x});
      toast('Changes saved');go('profile:'+e.id)}
    else{const id='EMP-'+String(next).padStart(4,'0');setNext(next+1);const{status,...rest}=v;setEmp(l=>[...l,{id,...rest,status:'Active',docs:[],hist:[{d:today(),t:'Record created · joined as '+v.des}]}]);toast('Employee added with ID '+id);go('profile:'+id)}};
  return(<>
    <Back onClick={back}>Cancel</Back>
    <Head title={e?(lim?'Update contact details':'Edit '+full(e)):'Add employee'} sub={e?e.id:`Employee ID will be assigned on save (next: EMP-${String(next).padStart(4,'0')}).`}/>
    <div className="card"><div className="fg">
      <Field label="First name" req disabled={d} {...f.f('fn')}/><Field label="Last name" req disabled={d} {...f.f('ln')}/>
      <Field label="National ID" disabled={d} {...f.f('nid')}/><Field label="Date of birth" type="date" disabled={d} {...f.f('dob')}/>
      <Field label="Work email" type="email" req disabled={d} {...f.f('email')}/><Field label="Phone" placeholder="0771234567" {...f.f('phone')}/>
      <Field label="Address" type="textarea" rows={2} cls="full" {...f.f('addr')}/>
      <Field label="Emergency contact name" {...f.f('ecName')}/><Field label="Emergency contact phone" {...f.f('ecPhone')}/></div></div>
    <div className="card"><div className="fg">
      <Field label="Department" req disabled={d} options={[['','Select…'],...DEPTS]} {...f.f('dept')}/><Field label="Designation" req disabled={d} options={[['','Select…'],...DESIGS]} {...f.f('des')}/>
      <Field label="Employment type" disabled={d} options={TYPES} {...f.f('type')}/><Field label="Join date" type="date" req disabled={d} {...f.f('join')}/>
      {e&&<Field label="Status" disabled={d||e.status==='Inactive'} options={STATUSES} {...f.f('status')}/>}</div></div>
    <div className="row"><button className="btn" onClick={save}>{e?'Save changes':'Add employee'}</button><button className="btn ghost" onClick={back}>Cancel</button></div>
  </>);
}
