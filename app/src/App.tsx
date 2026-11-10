import { useEffect, useState, useRef, type PointerEvent as ReactPointerEvent, type FormEvent } from 'react';
import { HATCHER_PROJECT_ID, loadCheckpoints, loadProjectSources, loadProjects, loadSessions, saveCheckpoints, saveProjectSources, saveProjects, saveSessions, type Project, type ProjectSource, type ReadingCheckpoint, type ReadingSession } from './storage';
import { PdfReader, copySavedPdf, deleteSavedPdf, importSessionPdf } from './PdfReader';
import { ReadingFlow } from './ReadingFlow';
import { ReadingCheckpoints } from './ReadingCheckpoints';
import {deletePdfIndex} from './pdfIndex';
import {buildCommit} from './tangentStore';
import {getDocument,GlobalWorkerOptions,type PDFDocumentProxy} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc=workerUrl;

type SessionFormState = {
  title: string; target: string; firstPage: string; lastPage: string; durationMinutes: string;
};
const initialForm: SessionFormState = { title: '', target: '', firstPage: '', lastPage: '', durationMinutes: '60' };
type ProjectFormState = { title:string; author:string; description:string };
const initialProjectForm:ProjectFormState={title:'',author:'',description:''};
const shortSourceName = (name:string) => name.length > 34 ? name.slice(0,31).trimEnd() + '…' : name;
const sourceRoleLabels: Record<ProjectSource['role'],string> = {
  primary:'Primary text',
  'lecture-notes':'Lecture notes',
  reference:'Reference',
  paper:'Paper',
  supplement:'Supplement',
};

export function App() {
  const [projects,setProjects]=useState<Project[]>(loadProjects);
  const [sources,setSources]=useState<ProjectSource[]>(loadProjectSources);
  const [checkpoints,setCheckpoints]=useState<ReadingCheckpoint[]>(loadCheckpoints);
  const [sessions, setSessions] = useState<ReadingSession[]>(loadSessions);
  const [activeId, setActiveId] = useState<string | null>(() => {
    const value = window.location.hash;
    return value.startsWith('#session-') ? decodeURIComponent(value.slice(9)) : null;
  });
  const [surface,setSurface]=useState<'library'|'project'|'source'>(()=>{
    const hash=window.location.hash;
    if(hash.startsWith('#source-'))return 'source';
    return hash.startsWith('#project-')?'project':'library';
  });
  const [activeSourceId,setActiveSourceId]=useState<string|null>(()=>{
    const hash=window.location.hash;
    return hash.startsWith('#source-')?decodeURIComponent(hash.slice(8)):null;
  });
  const [activeProjectId,setActiveProjectId]=useState(()=>{
    const hash=window.location.hash;
    if(hash.startsWith('#project-'))return decodeURIComponent(hash.slice(9));
    if(hash.startsWith('#source-'))return loadProjectSources().find(source=>source.id===decodeURIComponent(hash.slice(8)))?.projectId??HATCHER_PROJECT_ID;
    if(hash.startsWith('#session-')){
      const sessionId=decodeURIComponent(hash.slice(9));
      return loadSessions().find(s=>s.id===sessionId)?.projectId??HATCHER_PROJECT_ID;
    }
    return HATCHER_PROJECT_ID;
  });
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [newProjectOpen,setNewProjectOpen]=useState(false);
  const [editProjectOpen,setEditProjectOpen]=useState(false);
  const [editProjectForm,setEditProjectForm]=useState<ProjectFormState>(initialProjectForm);
  const [editProjectError,setEditProjectError]=useState('');
  const [addSourceOpen,setAddSourceOpen]=useState(false);
  const [sourceRole,setSourceRole]=useState<ProjectSource['role']>('primary');
  const [sourceFile,setSourceFile]=useState<File|null>(null);
  const [sourceError,setSourceError]=useState('');
  const [addingSource,setAddingSource]=useState(false);
  const [selectedSourceId,setSelectedSourceId]=useState('');
  const [projectForm,setProjectForm]=useState<ProjectFormState>(initialProjectForm);
  const [projectFormError,setProjectFormError]=useState('');
  const [form, setForm] = useState<SessionFormState>(initialForm);
  const [newPdf, setNewPdf] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [pdfPageCount,setPdfPageCount]=useState<number|null>(null);
  const [checkingPdf,setCheckingPdf]=useState(false);
  const [formError, setFormError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteProjectId,setDeleteProjectId] = useState<string|null>(null);
  const [pageJump, setPageJump] = useState<{page:number;seq:number;quote?:string}|null>(null);
  const [agentOpen, setAgentOpen] = useState(true);
  const [theme,setTheme]=useState<'dark'|'light'>(()=>localStorage.getItem('higher-math:theme')==='light'?'light':'dark');
  useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;localStorage.setItem('higher-math:theme',theme);},[theme]);
  const [agentFraction,setAgentFraction]=useState(()=>{const n=Number(localStorage.getItem('higher-math:agent-pane-fraction'));return n>=.25&&n<=.75?n:.46;});
  const gridRef=useRef<HTMLDivElement>(null);
  const dragFractionRef=useRef(agentFraction);
  const dragFrameRef=useRef<number|null>(null);
  useEffect(()=>()=>{if(dragFrameRef.current!==null)cancelAnimationFrame(dragFrameRef.current);},[]);
  function resizeStart(e:ReactPointerEvent<HTMLDivElement>){if(e.button!==0||!gridRef.current)return;e.preventDefault();dragFractionRef.current=agentFraction;e.currentTarget.setPointerCapture(e.pointerId);gridRef.current.classList.add('is-resizing');}
  function resizeMove(e:ReactPointerEvent<HTMLDivElement>){
    if(!e.currentTarget.hasPointerCapture(e.pointerId)||!gridRef.current)return;
    const box=gridRef.current.getBoundingClientRect();
    const frac=Math.min(.75,Math.max(.25,1-(e.clientX-box.left)/box.width));
    dragFractionRef.current=frac;
    if(dragFrameRef.current!==null)return;
    dragFrameRef.current=requestAnimationFrame(()=>{
      dragFrameRef.current=null;
      if(gridRef.current)gridRef.current.style.gridTemplateColumns=`minmax(0, ${1-dragFractionRef.current}fr) 8px minmax(0, ${dragFractionRef.current}fr)`;
    });
  }
  function resizeEnd(e:ReactPointerEvent<HTMLDivElement>){
    if(!e.currentTarget.hasPointerCapture(e.pointerId))return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if(dragFrameRef.current!==null){cancelAnimationFrame(dragFrameRef.current);dragFrameRef.current=null;}
    gridRef.current?.classList.remove('is-resizing');
    setAgentFraction(dragFractionRef.current);
    localStorage.setItem('higher-math:agent-pane-fraction',String(dragFractionRef.current));
  }

  const active = sessions.find(s => s.id === activeId) ?? null;
  const pendingDelete = sessions.find(s => s.id === deleteId);
  const pendingProjectDelete = projects.find(p=>p.id===deleteProjectId);
  const activeProject=projects.find(project=>project.id===activeProjectId)??projects[0];
  const activeSource=sources.find(source=>source.id===activeSourceId)??null;
  const projectSources=sources.filter(source=>source.projectId===activeProject?.id);
  const projectSessions=sessions.filter(session=>session.projectId===activeProject?.id);
  const projectCheckpoints=checkpoints.filter(checkpoint=>checkpoint.projectId===activeProject?.id);
  const formatActivity=(value:string)=>new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:new Date(value).getFullYear()===new Date().getFullYear()?undefined:'numeric'});

  function persist(next: ReadingSession[]): boolean {
    try { saveSessions(next); setSessions(next); setStorageError(''); return true; }
    catch { setStorageError('Could not save changes to this browser. Check storage permissions.'); return false; }
  }
  function persistProjects(next:Project[]):boolean{
    try{saveProjects(next);setProjects(next);setStorageError('');return true;}
    catch{setStorageError('Could not save project changes to this browser. Check storage permissions.');return false;}
  }
  function persistCheckpoints(next:ReadingCheckpoint[]):boolean{
    try{saveCheckpoints(next);setCheckpoints(next);setStorageError('');return true;}
    catch{setStorageError('Could not save reading checkpoints to this browser.');return false;}
  }
  function persistSources(next:ProjectSource[]):boolean{
    try{saveProjectSources(next);setSources(next);setStorageError('');return true;}
    catch{setStorageError('Could not save project sources to this browser. Check storage permissions.');return false;}
  }
  function navigate(id: string | null) {
    const session=id?sessions.find(s=>s.id===id):null;
    if(session)setActiveProjectId(session.projectId);
    setActiveId(id);
    setSurface('project');
    window.history.replaceState(null, '', id ? '#session-' + encodeURIComponent(id) : '#project-' + encodeURIComponent(activeProjectId));
  }
  function openLibrary(){
    setActiveId(null);setActiveSourceId(null);setSurface('library');
    window.history.replaceState(null,'',window.location.pathname+window.location.search);
  }
  function openProject(projectId=activeProjectId){
    setActiveId(null);setActiveSourceId(null);setActiveProjectId(projectId);setSurface('project');
    window.history.replaceState(null,'','#project-'+encodeURIComponent(projectId));
  }
  function openSource(source:ProjectSource){
    setActiveId(null);setActiveProjectId(source.projectId);setActiveSourceId(source.id);setSurface('source');
    window.history.replaceState(null,'','#source-'+encodeURIComponent(source.id));
  }
  async function addProjectSource(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!sourceFile||!activeProject){setSourceError('Choose a PDF file.');return;}
    setAddingSource(true);setSourceError('');
    let doc:PDFDocumentProxy|undefined;
    const sourceId=crypto.randomUUID(),pdfKey='source:'+sourceId;
    try{
      const task=getDocument({data:new Uint8Array(await sourceFile.arrayBuffer())});doc=await task.promise;
      const pageCount=doc.numPages;
      await importSessionPdf(pdfKey,sourceFile);
      const source:ProjectSource={id:sourceId,projectId:activeProject.id,name:sourceFile.name.replace(/\.pdf$/i,''),role:sourceRole,pageCount,pdfKey,createdAt:new Date().toISOString()};
      if(!persistSources([...sources,source])){await deleteSavedPdf(pdfKey).catch(()=>undefined);return;}
      setSourceFile(null);setSourceRole('primary');setAddSourceOpen(false);openSource(source);
    }catch(error){setSourceError(error instanceof Error?error.message:'Could not add this PDF source.');}
    finally{if(doc)await doc.destroy();setAddingSource(false);}
  }
  function startEditingProject(){
    if(!activeProject)return;
    setEditProjectForm({title:activeProject.title,author:activeProject.author??'',description:activeProject.description==='Your reading workspace'?'':activeProject.description??''});
    setEditProjectError('');
    setEditProjectOpen(true);
  }
  function updateProject(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!activeProject)return;
    const title=editProjectForm.title.trim();
    if(!title){setEditProjectError('Enter a project title.');return;}
    if(persistProjects(projects.map(p=>p.id===activeProject.id?{...p,title,author:editProjectForm.author.trim()||undefined,description:editProjectForm.description.trim()||undefined,updatedAt:new Date().toISOString()}:p))){
      setEditProjectOpen(false);
      setEditProjectError('');
    }
  }
  function createProject(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const title=projectForm.title.trim();
    if(!title){setProjectFormError('Enter a project title.');return;}
    const now=new Date().toISOString();
    const project:Project={id:crypto.randomUUID(),title,author:projectForm.author.trim()||undefined,description:projectForm.description.trim()||undefined,createdAt:now,updatedAt:now,status:'active'};
    if(!persistProjects([...projects,project]))return;
    setProjectForm(initialProjectForm);setProjectFormError('');setNewProjectOpen(false);openProject(project.id);
  }
  async function choosePdf(file:File|null){
    setSelectedSourceId('');setNewPdf(file);setPdfPageCount(null);setFormError('');
    if(!file)return;
    setCheckingPdf(true);
    let doc:PDFDocumentProxy|undefined;
    try{
      const task=getDocument({data:new Uint8Array(await file.arrayBuffer())});
      doc=await task.promise;
      setPdfPageCount(doc.numPages);
      setForm(prev=>({...prev,firstPage:prev.firstPage&&Number(prev.firstPage)<=doc!.numPages?prev.firstPage:'1',lastPage:prev.lastPage&&Number(prev.lastPage)<=doc!.numPages?prev.lastPage:String(doc!.numPages)}));
    }catch{setFormError('Could not read the PDF page count. Please choose a valid PDF.');}
    finally{if(doc)await doc.destroy();setCheckingPdf(false);}
  }
  function chooseProjectSource(sourceId:string){
    setSelectedSourceId(sourceId);setNewPdf(null);setFormError('');
    const source=sources.find(item=>item.id===sourceId);
    setPdfPageCount(source?.pageCount??null);
    if(source)setForm(prev=>({...prev,firstPage:'1',lastPage:String(source.pageCount)}));
  }
  async function createSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = Number(form.firstPage), last = Number(form.lastPage);
    if (!form.title.trim() || !form.target.trim() || !Number.isInteger(first) || first < 1 || !Number.isInteger(last) || last < first) {
      setFormError('Enter a title, reading target, and a valid printed-page range.'); return;
    }
    if (!newPdf && !selectedSourceId) { setFormError('Choose a project source or upload a PDF.'); return; }
    if(checkingPdf||!pdfPageCount){setFormError('The PDF page count must be verified before creating the session.');return;}
    if(first>pdfPageCount||last>pdfPageCount){setFormError('Select a page range between 1 and '+pdfPageCount+'.');return;}
    setCreating(true);
    setFormError('');
    const now = new Date().toISOString();
    const session: ReadingSession = {
      id: crypto.randomUUID(), projectId: activeProject?.id??HATCHER_PROJECT_ID, title: form.title.trim(), target: form.target.trim(),
      firstPage: first, lastPage: last, durationMinutes: Number(form.durationMinutes),
      createdAt: now, updatedAt: now, status: 'not-started', currentPrintedPage: first
    };
    try {
      if(selectedSourceId){
        const source=sources.find(item=>item.id===selectedSourceId);
        if(!source)throw new Error('The selected project source is unavailable.');
        await copySavedPdf(source.pdfKey,session.id);
      }else if(newPdf){
        await importSessionPdf(session.id,newPdf);
        const sourceId=crypto.randomUUID(),pdfKey='source:'+sourceId;
        await importSessionPdf(pdfKey,newPdf);
        const source:ProjectSource={id:sourceId,projectId:session.projectId,name:newPdf.name.replace(/\.pdf$/i,''),role:'primary',pageCount:pdfPageCount!,pdfKey,createdAt:now};
        if(!persistSources([...sources,source]))await deleteSavedPdf(pdfKey).catch(()=>undefined);
      }
      if (!persist([...sessions, session])) {
        await deleteSavedPdf(session.id).catch(() => undefined);
        return;
      }
      setNewSessionOpen(false); setForm(initialForm); setNewPdf(null); setSelectedSourceId(''); setPdfPageCount(null); setFormError(''); navigate(session.id);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not import this PDF. Try another file.');
    } finally {
      setCreating(false);
    }
  }
  function deleteProject() {
    if (!deleteProjectId) return;
    const removedSessions=sessions.filter(s=>s.projectId===deleteProjectId);
    const removedSources=sources.filter(s=>s.projectId===deleteProjectId);
    const remainingProjects=projects.filter(p=>p.id!==deleteProjectId);
    const remainingSessions=sessions.filter(s=>s.projectId!==deleteProjectId);
    const remainingSources=sources.filter(s=>s.projectId!==deleteProjectId);
    try {
      // Persist all three collections before updating the UI.
      saveProjects(remainingProjects);
      saveSessions(remainingSessions);
      saveProjectSources(remainingSources);
      saveCheckpoints(checkpoints.filter(c=>c.projectId!==deleteProjectId));
      setCheckpoints(checkpoints.filter(c=>c.projectId!==deleteProjectId));
      setProjects(remainingProjects);
      setSessions(remainingSessions);
      setSources(remainingSources);
      setDeleteProjectId(null);
      setStorageError('');
      if (activeProjectId===deleteProjectId) setActiveProjectId(remainingProjects[0]?.id??'');
      openLibrary();
      for (const session of removedSessions) {
        localStorage.removeItem('higher-math:citations:'+session.id);
        localStorage.removeItem('higher-math:reading-flow:v1:'+session.id);
        localStorage.removeItem('higher-math:reading-notes:v1:'+session.id);
        localStorage.removeItem('higher-math:tangents:v2:'+session.id);
        void deleteSavedPdf(session.id).catch(()=>undefined);
        void deletePdfIndex(session.id).catch(()=>undefined);
      }
      for (const source of removedSources) void deleteSavedPdf(source.pdfKey).catch(()=>undefined);
    } catch {
      setStorageError('Could not fully delete the project. Please refresh to check saved data.');
    }
  }
  function deleteSession() {
    if (!deleteId) return;
    if (persist(sessions.filter(s => s.id !== deleteId))) {
      if (activeId === deleteId) navigate(null);
      setDeleteId(null);
      localStorage.removeItem('higher-math:citations:' + deleteId);
      localStorage.removeItem('higher-math:reading-flow:v1:' + deleteId);
      localStorage.removeItem('higher-math:reading-notes:v1:' + deleteId);
      localStorage.removeItem('higher-math:tangents:v2:' + deleteId);
      void deleteSavedPdf(deleteId).catch(() => setStorageError('Session deleted, but its cached PDF could not be cleared.'));
      void deletePdfIndex(deleteId).catch(()=>undefined);
      persistCheckpoints(checkpoints.map(c=>c.sessionId===deleteId?{...c,sessionId:undefined}:c));
    }
  }
  function updatePage(page: number) {
    if (!active || page < 1) return;
    const now = new Date().toISOString();
    persist(sessions.map(s => s.id === active.id ? {
      ...s, pdfPage: page, updatedAt: now, status: 'in-progress'
    } : s));
  }
  useEffect(() => {
    function handleKeys(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (deleteProjectId) setDeleteProjectId(null);
      else if (deleteId) setDeleteId(null);
      else if (newSessionOpen && !creating) { setNewSessionOpen(false); setFormError(''); }
    }
    document.addEventListener('keydown', handleKeys);
    return () => document.removeEventListener('keydown', handleKeys);
  }, [deleteId, deleteProjectId, newSessionOpen, creating]);

  return <div className="app-shell">
    {!active && surface!=='source' && <header className="topbar"><span className="brand">∑ &nbsp; Mathematical Reading Agent</span><button className="reader-theme-toggle" type="button" onClick={()=>setTheme(v=>v==='dark'?'light':'dark')} aria-label={theme==='dark'?'Switch to light mode':'Switch to dark mode'} title={theme==='dark'?'Light mode':'Dark mode'}>{theme==='dark'?'☀':'☾'}</button></header>}
    {storageError && <div role="alert" className="alert">{storageError}</div>}
    {!active ? (surface==='library' ? <main className="library-page">
      <div className="library-heading-row">
        <div><div className="eyebrow">Your workspace</div><h1>Library</h1></div>
        <button className="primary" onClick={()=>setNewProjectOpen(true)}>+ New Project</button>
      </div>
      <section className="library-projects">
        {projects.map(project=>{
          const related=sessions.filter(session=>session.projectId===project.id);
          const recent=[...related].sort((a,b)=>new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime())[0];
          const activeCount=related.filter(s=>s.status==='in-progress'||s.status==='paused').length;
          const completedCount=related.filter(s=>s.status==='complete').length;
          return <article className="library-project-card" key={project.id} role="button" tabIndex={0} aria-label={"Open project "+project.title} onClick={()=>openProject(project.id)} onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openProject(project.id);}}}>
            <div className="library-project-top">
              <div><div className="eyebrow">Book project</div><h2>{project.title}</h2>{project.author&&<p>{project.author}</p>}</div>
              <div className="library-project-controls"><span className={"library-status "+(project.status==='active'?'is-active':'')}>{project.status}</span><button type="button" className="library-project-delete" title={"Delete "+project.title} aria-label={"Delete project "+project.title} onClick={e=>{e.stopPropagation();setDeleteProjectId(project.id);}}>Delete</button></div>
            </div>
            <button type="button" className="library-current library-current-link" onClick={e=>{e.stopPropagation();if(recent)navigate(recent.id);}} disabled={!recent}>
              <div className="library-current-copy">
                <span className="library-current-label">Current reading</span>
                {recent ? <>
                  <strong>{recent.title}</strong>
                  <span>{recent.target}</span>
                  <small>Last activity {formatActivity(recent.updatedAt)}</small>
                </> : <>
                  <strong>No reading session yet</strong>
                  <span>Create a reading session to begin this project.</span>
                </>}
              </div>
            </button>
            <div className="library-project-footer">
              <div className="library-project-meta">
                <span><strong>{related.length}</strong> sessions</span>
                <span><strong>{activeCount}</strong> active</span>
                <span><strong>{completedCount}</strong> completed</span>
              </div>
            </div>
          </article>;
        })}
      </section>
    </main> : surface==='source'&&activeSource ? <section className="workspace source-workspace">
      <div className="reader-header">
        <div className="reader-header-identity">
          <button className="reader-back" onClick={()=>openProject(activeSource.projectId)} aria-label="Back to project" title="Back to project">←</button>
          <span className="reader-session-name" title={activeSource.name}>{activeSource.name}</span>
        </div>
        <div id="source-reader-toolbar-slot" className="reader-toolbar-slot" aria-label="PDF controls"></div>
        <div className="reader-header-right"><button className="reader-theme-toggle" type="button" onClick={()=>setTheme(v=>v==='dark'?'light':'dark')} aria-label={theme==='dark'?'Switch to light mode':'Switch to dark mode'} title={theme==='dark'?'Light mode':'Dark mode'}>{theme==='dark'?'☀':'☾'}</button></div>
      </div>
      <div className="work-grid agent-collapsed source-reader-grid">
        <article className="work-panel pdf-panel">
          <PdfReader key={activeSource.pdfKey} sessionId={activeSource.pdfKey} initialPage={1} onPageChange={()=>undefined} toolbarHostId="source-reader-toolbar-slot" readOnly />
        </article>
      </div>
    </section> : <main className="dashboard">
      <button className="breadcrumb breadcrumb-button" onClick={openLibrary}>← Library</button>
      <div className="hero"><div><div className="eyebrow">Book project</div><h1>{activeProject?.title??'Untitled project'} <a className="project-build-id" href={'https://github.com/minhpham2003/math-reading-agent/commit/'+buildCommit} target="_blank" rel="noreferrer" title={'Open GitHub commit '+buildCommit}>GitHub {buildCommit}</a></h1>{(activeProject?.author || (activeProject?.description && activeProject.description!=='Your reading workspace'))&&<p>{[activeProject?.author,activeProject?.description==='Your reading workspace'?'':activeProject?.description].filter(Boolean).join(' · ')}</p>}<button type="button" className="project-edit-button" onClick={startEditingProject}>Edit project</button></div>
        <div className="project-hero-actions"><button className="primary" onClick={() => setNewSessionOpen(true)}>+ New Session</button></div>
      </div>
      <div className="dashboard-grid">
        <section className="card"><h2>Reading sessions</h2>
          {!projectSessions.length ? <p className="muted">No reading sessions yet. Create your first one to get started.</p> :
            [...projectSessions].reverse().map(s => <div className="session-row session-row-link" key={s.id} role="button" tabIndex={0} aria-label={'Open reading session ' + s.title} onClick={()=>navigate(s.id)} onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();navigate(s.id);}}}>
              <div><strong>{s.title}</strong><div className="muted">{s.target} · pp. {s.firstPage}–{s.lastPage} · {s.durationMinutes} min</div></div>
              <div className="session-actions"><span className="badge">{s.status.replace('-', ' ')}</span><button className="menu-button" aria-label={'Delete ' + s.title} title="Delete session" onClick={e=>{e.stopPropagation();setDeleteId(s.id);}}>⋯</button></div>
            </div>)}
        </section>
        <div className="side-stack"><ReadingCheckpoints key={activeProject?.id} projectId={activeProject?.id??''} checkpoints={projectCheckpoints} sessions={projectSessions} onChange={next=>persistCheckpoints([...checkpoints.filter(c=>c.projectId!==activeProject?.id),...next])} onOpenSession={navigate} />
          <section className="card project-sources-card">
            <div className="project-sources-heading"><h2>Project sources</h2><button className="secondary" onClick={()=>setAddSourceOpen(true)}>+ Add source</button></div>
            {!projectSources.length?<p className="muted">Upload the main PDFs for this project. They can be reused across reading sessions.</p>:
              projectSources.map(source=><div className="project-source-row" key={source.id}>
                <button className="project-source-open" onClick={()=>openSource(source)} title={source.name}><strong title={source.name}>{shortSourceName(source.name)}</strong><span className="muted">{sourceRoleLabels[source.role]} · {source.pageCount} pages</span></button>
                <button className="secondary" onClick={()=>openSource(source)}>Open PDF →</button>
              </div>)}
          </section></div>
      </div>
      <p className="notice">Project data, PDFs, reading plans, branches, and conversations are currently stored in this browser. Cloud sync is not yet connected.</p>
    </main>) : <section className="workspace">
      <div className="reader-header">
        <div className="reader-header-identity">
          <button className="reader-back" onClick={()=>openProject(active?.projectId??activeProjectId)} aria-label="Back to project dashboard" title="Back to dashboard">←</button>
          <span className="reader-session-name" title={active.title}>{active.title}</span><span className="reader-session-dot" aria-hidden="true">·</span><span className="reader-session-section" title={active.target}>{active.target}</span>

        </div>
        <div id="reader-toolbar-slot" className="reader-toolbar-slot" aria-label="PDF controls"></div>
        <div className="reader-header-right"><div id="reading-plan-toolbar-slot" className="reading-plan-toolbar-slot"/><div id="reader-actions-slot" className="reader-actions-slot" aria-label="Document actions"></div><button className="reader-agent-toggle" type="button" onClick={() => setAgentOpen(v => !v)} aria-pressed={agentOpen}>{agentOpen ? 'Hide agent' : 'Show agent'}</button><button className="reader-theme-toggle" type="button" onClick={()=>setTheme(v=>v==='dark'?'light':'dark')} aria-label={theme==='dark'?'Switch to light mode':'Switch to dark mode'} title={theme==='dark'?'Light mode':'Dark mode'}>{theme==='dark'?'☀':'☾'}</button></div>
      </div>
      <div ref={gridRef} className={agentOpen ? "work-grid split-enabled" : "work-grid split-enabled agent-collapsed"} style={{gridTemplateColumns:agentOpen?`minmax(0, ${1-agentFraction}fr) 8px minmax(0, ${agentFraction}fr)`:'minmax(0, 1fr) 0px minmax(0, 0fr)'}}> 
        <article className="work-panel pdf-panel">
          <PdfReader key={active.id} sessionId={active.id} initialPage={active.pdfPage ?? 1} onPageChange={updatePage} toolbarHostId="reader-toolbar-slot" actionsHostId="reader-actions-slot" pageJump={pageJump} />
        </article>
        <div className="pane-resizer" role="separator" aria-label="Resize PDF and agent panels" aria-orientation="vertical" aria-valuenow={Math.round((1-agentFraction)*100)} tabIndex={0} onPointerDown={resizeStart} onPointerMove={resizeMove} onPointerUp={resizeEnd} onPointerCancel={resizeEnd} onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();const next=Math.min(.75,Math.max(.25,agentFraction+(e.key==="ArrowRight"?-.03:.03)));setAgentFraction(next);localStorage.setItem("higher-math:agent-pane-fraction",String(next));}}}/>        <article className="work-panel agent-panel" aria-hidden={!agentOpen} inert={!agentOpen}>
          <ReadingFlow key={active.id} sessionId={active.id} title={active.target}
            firstPage={active.firstPage} lastPage={active.lastPage} duration={active.durationMinutes} currentPdfPage={active.pdfPage}
            onNavigate={(page,quote) => setPageJump(old=>({page,quote,seq:(old?.seq??0)+1}))}/>
        </article>
      </div>
    </section>}
    {editProjectOpen && <div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setEditProjectOpen(false);}}>
      <form className="dialog new-project-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-project-title" onSubmit={updateProject}>
        <h2 id="edit-project-title">Edit project</h2>
        <label>Project title<input autoFocus required maxLength={140} value={editProjectForm.title} onChange={e=>setEditProjectForm({...editProjectForm,title:e.target.value})}/></label>
        <label>Author or course <span className="muted">(optional)</span><input maxLength={140} value={editProjectForm.author} onChange={e=>setEditProjectForm({...editProjectForm,author:e.target.value})}/></label>
        <label>Description <span className="muted">(optional)</span><textarea rows={3} maxLength={300} value={editProjectForm.description} onChange={e=>setEditProjectForm({...editProjectForm,description:e.target.value})}/></label>
        {editProjectError&&<p role="alert" className="form-error">{editProjectError}</p>}
        <div className="dialog-actions"><button type="button" className="secondary" onClick={()=>setEditProjectOpen(false)}>Cancel</button><button type="submit" className="primary">Save changes</button></div>
      </form>
    </div>}
    {newProjectOpen && <div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget){setNewProjectOpen(false);setProjectFormError('');}}}>
      <form className="dialog new-project-dialog" onSubmit={createProject} role="dialog" aria-modal="true" aria-labelledby="new-project-title">
        <h2 id="new-project-title">New project</h2>
        <p className="muted">Create a workspace for a book, course, paper, or mathematical topic.</p>
        <label>Project title<input autoFocus required maxLength={140} placeholder="e.g. Representation Theory" value={projectForm.title} onChange={e=>setProjectForm({...projectForm,title:e.target.value})}/></label>
        <label>Author or course <span className="muted">(optional)</span><input maxLength={140} placeholder="e.g. Fulton & Harris" value={projectForm.author} onChange={e=>setProjectForm({...projectForm,author:e.target.value})}/></label>
        <label>Description <span className="muted">(optional)</span><textarea rows={3} maxLength={300} placeholder="What are you studying in this project?" value={projectForm.description} onChange={e=>setProjectForm({...projectForm,description:e.target.value})}/></label>
        {projectFormError&&<p role="alert" className="form-error">{projectFormError}</p>}
        <div className="dialog-actions"><button className="secondary" type="button" onClick={()=>{setNewProjectOpen(false);setProjectFormError('');}}>Cancel</button><button className="primary" type="submit">Create project</button></div>
      </form>
    </div>}
    {addSourceOpen && <div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!addingSource){setAddSourceOpen(false);setSourceError('');}}}>
      <form className="dialog add-source-dialog" onSubmit={addProjectSource} role="dialog" aria-modal="true" aria-labelledby="add-source-title">
        <h2 id="add-source-title">Add project source</h2>
        <p className="muted">Add a PDF that can be opened directly and reused in future reading sessions.</p>
        <label>PDF document<input type="file" accept=".pdf,application/pdf" required disabled={addingSource} onChange={e=>setSourceFile(e.target.files?.[0]??null)}/></label>
        <label>Source role<select value={sourceRole} onChange={e=>setSourceRole(e.target.value as ProjectSource['role'])}><option value="primary">Primary text</option><option value="lecture-notes">Lecture notes</option><option value="reference">Reference</option><option value="paper">Paper</option><option value="supplement">Supplement</option></select></label>
        {sourceError&&<p role="alert" className="form-error">{sourceError}</p>}
        <div className="dialog-actions"><button type="button" className="secondary" disabled={addingSource} onClick={()=>{setAddSourceOpen(false);setSourceError('');setSourceFile(null);}}>Cancel</button><button type="submit" className="primary" disabled={addingSource||!sourceFile}>{addingSource?'Adding PDF…':'Add source'}</button></div>
      </form>
    </div>}
    {newSessionOpen && <div className="overlay" role="presentation" onMouseDown={e => {if (e.target === e.currentTarget && !creating) setNewSessionOpen(false);}}>
      <form className="dialog new-session-dialog" onSubmit={createSession} role="dialog" aria-modal="true" aria-labelledby="new-session-title"><h2 id="new-session-title">New reading session</h2>
        <div className="new-session-pdf-field">
          <div className="session-source-choice-title">PDF source <span className="required-marker">Required</span></div>
          {projectSources.length>0&&<label>Choose from Project Sources<select value={selectedSourceId} disabled={creating} onChange={e=>chooseProjectSource(e.target.value)}><option value="">Select a project source…</option>{projectSources.map(source=><option key={source.id} value={source.id}>{source.name} · {source.pageCount} pages</option>)}</select></label>}
          <div className="session-source-divider"><span>or upload a new PDF</span></div>
          <input type="file" accept=".pdf,application/pdf" disabled={creating} onChange={e => void choosePdf(e.target.files?.[0] ?? null)}/>
          <small>{newPdf ? newPdf.name+(pdfPageCount?' · '+pdfPageCount+' PDF pages':checkingPdf?' · Checking pages…':'') : selectedSourceId ? 'Using the selected Project Source.' : 'Uploaded PDFs are automatically added to Project Sources.'}</small>
        </div>
        <label>Session title<input autoFocus required maxLength={120} placeholder="e.g. Homotopy equivalence" value={form.title} onChange={e => setForm({...form,title:e.target.value})}/></label>
        <label>Section or reading target<input required placeholder="e.g. Chapter 3, §3.1" value={form.target} onChange={e => setForm({...form,target:e.target.value})}/></label>
        <div className="form-row"><label>First PDF page<input type="number" min="1" max={pdfPageCount??undefined} required value={form.firstPage} onChange={e => setForm({...form,firstPage:e.target.value})}/></label><label>Last PDF page<input type="number" min={form.firstPage||"1"} max={pdfPageCount??undefined} required value={form.lastPage} onChange={e => setForm({...form,lastPage:e.target.value})}/></label></div>
        <label>Session duration<select value={form.durationMinutes} onChange={e => setForm({...form,durationMinutes:e.target.value})}><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select></label>
        {formError && <p role="alert" className="form-error">{formError}</p>}
        <div className="dialog-actions"><button className="secondary" type="button" disabled={creating} onClick={() => {setNewSessionOpen(false);setFormError('');setNewPdf(null);setSelectedSourceId('');setPdfPageCount(null);}}>Cancel</button><button className="primary" type="submit" disabled={creating||checkingPdf||!pdfPageCount}>{creating ? 'Importing PDF…' : 'Create session'}</button></div>
      </form></div>}
    {pendingProjectDelete && <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setDeleteProjectId(null);}}><div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-project-title"><h2 id="delete-project-title">Delete project?</h2><p>Delete “{pendingProjectDelete.title}” and its {sessions.filter(s=>s.projectId===pendingProjectDelete.id).length} reading sessions and {sources.filter(s=>s.projectId===pendingProjectDelete.id).length} sources from this browser? This cannot be undone.</p><div className="dialog-actions"><button className="secondary" onClick={()=>setDeleteProjectId(null)}>Cancel</button><button className="danger" onClick={deleteProject}>Delete project</button></div></div></div>}
    {pendingDelete && <div className="overlay" onMouseDown={e => {if (e.target === e.currentTarget) setDeleteId(null);}}><div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Delete session?</h2><p>Delete “{pendingDelete.title}” from this browser? This cannot be undone.</p><div className="dialog-actions"><button className="secondary" onClick={() => setDeleteId(null)}>Cancel</button><button className="danger" onClick={deleteSession}>Delete session</button></div></div></div>}
  </div>;
}
