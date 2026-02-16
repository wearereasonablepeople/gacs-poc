import api from './api';

// ─── Questionnaire Cache ───────────────────────────────────

const CACHE_PREFIX = 'gacs-cache:';

/** Save full questionnaire payload to localStorage for offline use. */
export function cacheQuestionnaire(tenantSlug: string, questionnaireSlug: string, data: unknown): void {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${tenantSlug}/${questionnaireSlug}`,
      JSON.stringify({ data, cachedAt: Date.now() }),
    );
  } catch { /* storage full */ }
}

/** Load a previously cached questionnaire, or null if none. */
export function getCachedQuestionnaire<T>(tenantSlug: string, questionnaireSlug: string): { data: T; cachedAt: number } | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${tenantSlug}/${questionnaireSlug}`);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt */ }
  return null;
}

// ─── Sync Queue ────────────────────────────────────────────

export interface QueuedOperation {
  id: string;
  type: 'start_submission' | 'save_answer' | 'submit_email';
  payload: Record<string, unknown>;
  createdAt: number;
  retries: number;
}

const QUEUE_KEY = 'gacs-sync-queue';

function loadQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveQueue(queue: QueuedOperation[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* ignore */ }
}

export function enqueue(op: Omit<QueuedOperation, 'id' | 'createdAt' | 'retries'>): void {
  const queue = loadQueue();
  queue.push({
    ...op,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    retries: 0,
  });
  saveQueue(queue);
}

export function getQueueLength(): number {
  return loadQueue().length;
}

/**
 * Process all queued operations sequentially.
 * Returns the number of operations that were successfully processed.
 * Failed operations remain in the queue for the next attempt.
 */
export async function processQueue(
  onSubmissionCreated?: (tempId: string, realId: string) => void,
): Promise<number> {
  const queue = loadQueue();
  if (queue.length === 0) return 0;

  const remaining: QueuedOperation[] = [];
  let processed = 0;

  for (const op of queue) {
    try {
      switch (op.type) {
        case 'start_submission': {
          const { data } = await api.post('/submissions/start', {
            questionnaireId: op.payload.questionnaireId,
          });
          if (onSubmissionCreated && op.payload.tempId) {
            onSubmissionCreated(op.payload.tempId as string, data.id);
          }
          processed++;
          break;
        }
        case 'save_answer': {
          await api.post(`/submissions/${op.payload.submissionId}/answers`, {
            questionId: op.payload.questionId,
            selectedOptionId: op.payload.selectedOptionId,
          });
          processed++;
          break;
        }
        case 'submit_email': {
          await api.post(`/submissions/${op.payload.submissionId}/email`, {
            email: op.payload.email,
            consentGiven: op.payload.consentGiven,
          });
          processed++;
          break;
        }
        default:
          processed++; // discard unknown
      }
    } catch {
      // Keep in queue for retry, bump retry count
      remaining.push({ ...op, retries: op.retries + 1 });
    }
  }

  saveQueue(remaining);
  return processed;
}

export function clearQueue(): void {
  try { localStorage.removeItem(QUEUE_KEY); } catch { /* ignore */ }
}

// ─── Online/Offline Detection ──────────────────────────────

type StatusCallback = (online: boolean) => void;
const listeners = new Set<StatusCallback>();

export function onConnectivityChange(cb: StatusCallback): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function notifyListeners(online: boolean) {
  listeners.forEach((cb) => cb(online));
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => notifyListeners(true));
  window.addEventListener('offline', () => notifyListeners(false));
}

export function isOnline(): boolean {
  // navigator.onLine can be unreliable in some environments (e.g. embedded browsers).
  // Default to true (optimistic) – actual failures are caught by the sync queue.
  if (typeof navigator === 'undefined') return true;
  // Only trust navigator.onLine when it says offline (conservative).
  // When it says online, trust it. When undefined, assume online.
  return navigator.onLine !== false;
}
