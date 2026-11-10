export type Project = {
  id: string;
  title: string;
  author?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
};

export type ProjectSource = {
  id: string;
  projectId: string;
  name: string;
  role: 'primary' | 'lecture-notes' | 'reference' | 'paper' | 'supplement';
  pageCount: number;
  pdfKey: string;
  createdAt: string;
};

export type ReadingSession = {
  id: string;
  projectId: string;
  title: string;
  target: string;
  firstPage: number;
  lastPage: number;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
  status: 'not-started' | 'in-progress' | 'paused' | 'complete';
  currentPrintedPage: number;
  pdfPage?: number;
};

export const STORAGE_KEY = 'math-reading-agent:app:sessions:v1';
export const PROJECTS_KEY = 'math-reading-agent:app:projects:v1';
export const SOURCES_KEY = 'math-reading-agent:app:sources:v1';
export const HATCHER_PROJECT_ID = 'hatcher';

const hatcherProject: Project = {
  id: HATCHER_PROJECT_ID,
  title: 'Algebraic Topology',
  author: 'Allen Hatcher',
  description: undefined,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  status: 'active'
};

export function loadProjects(): Project[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? '[]') as unknown;
    const stored = Array.isArray(raw) ? raw.filter((item): item is Project =>
      typeof item === 'object' && item !== null &&
      typeof item.id === 'string' && typeof item.title === 'string' &&
      typeof item.createdAt === 'string' && typeof item.updatedAt === 'string' &&
      typeof item.status === 'string'
    ) : [];
    // Seed the original Hatcher project only on first use. Do not resurrect deleted projects.
    if (localStorage.getItem(PROJECTS_KEY) === null) return [hatcherProject, ...stored];
    return stored;
  } catch { return [hatcherProject]; }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function loadSessions(): ReadingSession[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is Omit<ReadingSession,'projectId'> & {projectId?:string} =>
      typeof item === 'object' && item !== null &&
      typeof item.id === 'string' && typeof item.title === 'string' &&
      typeof item.target === 'string' && Number.isInteger(item.firstPage) &&
      Number.isInteger(item.lastPage) && Number.isInteger(item.currentPrintedPage) &&
      typeof item.status === 'string'
    ).map(item => ({...item, projectId: typeof item.projectId === 'string' ? item.projectId : HATCHER_PROJECT_ID}));
  } catch { return []; }
}

export function saveSessions(sessions: ReadingSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}


export function loadProjectSources(): ProjectSource[] {
  try {
    const raw=JSON.parse(localStorage.getItem(SOURCES_KEY)??'[]') as unknown;
    if(!Array.isArray(raw))return [];
    return raw.filter((item):item is ProjectSource =>
      typeof item==='object'&&item!==null&&
      typeof item.id==='string'&&typeof item.projectId==='string'&&
      typeof item.name==='string'&&typeof item.role==='string'&&
      Number.isInteger(item.pageCount)&&typeof item.pdfKey==='string'&&
      typeof item.createdAt==='string'
    );
  } catch { return []; }
}
export function saveProjectSources(sources:ProjectSource[]):void {
  localStorage.setItem(SOURCES_KEY,JSON.stringify(sources));
}
