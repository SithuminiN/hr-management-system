import {createContext,useContext,useState,useCallback,useEffect,useId} from 'react';

/* ---------- toast ---------- */
const ToastCtx=createContext(()=>{});
export function ToastProvider({children}){
  const[list,setList]=useState([]);
  const push=useCallback((m,k='')=>{const id=Math.random();setList(l=>[...l,{id,m,k}]);setTimeout(()=>setList(l=>l.filter(x=>x.id!==id)),3400)},[]);
  return <ToastCtx.Provider value={push}>{children}<div id="toasts" aria-live="polite">{list.map(t=><div key={t.id} className={'toast '+t.k}>{t.m}</div>)}</div></ToastCtx.Provider>;
}
export const useToast=()=>useContext(ToastCtx);

/* ---------- hash routing + role-aware tabs ---------- */
export function useRoute(){
  const read=()=>{const[id,...a]=location.hash.slice(1).split(':');return{id:id||'',arg:a.join(':')}};
  const[r,setR]=useState(read);
  useEffect(()=>{const f=()=>{setR(read());window.scrollTo(0,0)};addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);
  return[r,h=>{location.hash=h}];
}
export function useTabs(tabs,role){
  const[r,go]=useRoute();
  const ok=t=>!t.roles||t.roles.includes(role);
  const vis=tabs.filter(t=>!t.hidden&&ok(t));
  const cur=tabs.find(t=>t.id===r.id&&ok(t))||vis[0];
  return{cur,arg:r.arg,vis,go};
}

/* ---------- layout ---------- */
export function Shell({name,tag,glyph,vis,cur,roles,role,setRole,who,children}){
  return(<>
    <header className="top">
      <div className="brand"><span className="logo" aria-hidden="true">{glyph}</span><div><b>{name}</b><small>{tag}</small></div></div>
      <div className="who">{who||(roles&&<><label htmlFor="roleSel">View as</label>
        <select id="roleSel" value={role} onChange={e=>setRole(e.target.value)}>{roles.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></>)}</div>
    </header>
    <nav className="tabs" aria-label="Sections">{vis.map(t=>{const on=(cur.parent||cur.id)===t.id;return <a key={t.id} href={'#'+t.id} className={on?'on':''} aria-current={on?'page':undefined}>{t.label}</a>})}</nav>
    <main>{children}</main>
  </>);
}
export const Head=({title,sub,children})=><div className="head"><div><h1>{title}</h1>{sub&&<p>{sub}</p>}</div>{children}</div>;
export const Badge=({k='mut',children})=><span className={'badge '+k}>{children}</span>;
export const Stat=({label,value,sub})=><div className="stat"><span>{label}</span><b>{value}</b>{sub&&<small>{sub}</small>}</div>;
export const Note=({k='',children})=><div className={'note '+k}>{children}</div>;
export const Empty=({title,sub})=><div className="empty"><b>{title}</b>{sub}</div>;
export const Back=({onClick,children})=><button className="linkbtn sm" onClick={onClick}>‹ {children}</button>;

/* ---------- modal + confirm ---------- */
export function Modal({title,onClose,wide,footer,children}){
  useEffect(()=>{const f=e=>e.key==='Escape'&&onClose();addEventListener('keydown',f);return()=>removeEventListener('keydown',f)},[onClose]);
  return(<div className="ov" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className={'modal '+(wide?'wide':'')} role="dialog" aria-modal="true" aria-label={title}>
      <div className="mh"><h2>{title}</h2><button className="x" onClick={onClose} aria-label="Close">×</button></div>
      <div className="mb">{children}</div>{footer&&<div className="mf">{footer}</div>}
    </div></div>);
}
export function Confirm({title,message,label='Confirm',danger,onYes,onClose}){
  return <Modal title={title} onClose={onClose} footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className={'btn '+(danger?'danger':'')} onClick={()=>{onClose();onYes()}}>{label}</button></>}><p>{message}</p></Modal>;
}

/* ---------- form field ---------- */
export function Field({label,req,hint,error,type='text',value,onChange,options,rows=3,cls='',...rest}){
  const id=useId();let c;
  const common={id,className:error?'bad':'','aria-invalid':!!error,...rest};
  if(options)c=<select {...common} value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=>{const[v,l]=Array.isArray(o)?o:[o,o];return <option key={v} value={v}>{l}</option>})}</select>;
  else if(type==='textarea')c=<textarea {...common} rows={rows} value={value} onChange={e=>onChange(e.target.value)}/>;
  else if(type==='file')c=<input {...common} type="file" onChange={e=>onChange(e.target.files[0]||null)}/>;
  else c=<input {...common} type={type} value={value} onChange={e=>onChange(e.target.value)}/>;
  return <div className={'field '+cls}><label htmlFor={id}>{label}{req&&<span className="req" aria-hidden="true"> *</span>}</label>{c}{hint&&<div className="hint">{hint}</div>}{error&&<div className="err" role="alert">{error}</div>}</div>;
}
export const Check=({checked,onChange,children,...r})=><label style={{display:'flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} {...r}/>{children}</label>;

/* useForm: const f=useForm({a:''}); <Field {...f.f('a')}/>; if(f.invalid(errors)) return; */
export function useForm(init){
  const toast=useToast();
  const[v,setV]=useState(init);const[e,setE]=useState({});
  const set=k=>x=>setV(p=>({...p,[k]:x}));
  const f=k=>({value:v[k]??'',onChange:set(k),error:e[k]});
  const invalid=er=>{setE(er);if(Object.keys(er).length){toast('Fix the highlighted fields.','bad');return true}return false};
  return{v,setV,e,set,f,invalid};
}
