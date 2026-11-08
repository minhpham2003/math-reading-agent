export type ReadingSession = {
  id: string;
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
export function loadSessions(): ReadingSession[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is ReadingSession =>
      typeof item === 'object' && item !== null &&
      typeof item.id === 'string' && typeof item.title === 'string' &&
      typeof item.target === 'string' && Number.isInteger(item.firstPage) &&
      Number.isInteger(item.lastPage) && Number.isInteger(item.currentPrintedPage) &&
      typeof item.status === 'string'
    );
  } catch { return []; }
}
export function saveSessions(sessions: ReadingSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}
