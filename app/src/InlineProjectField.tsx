import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

type Props = {
  value: string;
  placeholder: string;
  label: string;
  className?: string;
  required?: boolean;
  maxLength?: number;
  onSave: (value: string) => boolean;
};

export function InlineProjectField({value,placeholder,label,className='',required=false,maxLength=300,onSave}:Props){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(value);
  const inputRef=useRef<HTMLInputElement>(null);
  const cancelled=useRef(false);
  useEffect(()=>{if(!editing)setDraft(value);},[value,editing]);
  useEffect(()=>{if(editing)inputRef.current?.focus();},[editing]);
  function begin(){cancelled.current=false;setDraft(value);setEditing(true);}
  function save(){
    if(cancelled.current)return;
    const next=draft.trim();
    if(required&&!next){inputRef.current?.focus();return;}
    if(onSave(next))setEditing(false);
  }
  function keyDown(event:KeyboardEvent<HTMLInputElement>){
    if(event.key==='Enter'){event.preventDefault();save();}
    if(event.key==='Escape'){cancelled.current=true;setDraft(value);setEditing(false);}
  }
  return editing
    ? <input ref={inputRef} className={'project-inline-input '+className} aria-label={'Edit '+label}
        maxLength={maxLength} value={draft} onChange={e=>setDraft(e.target.value)}
        onKeyDown={keyDown} onBlur={save}/>
    : <button type="button" className={'project-inline-field '+className} aria-label={'Edit '+label}
        title={'Click to edit '+label.toLowerCase()} onClick={begin}>{value||placeholder}</button>;
}
