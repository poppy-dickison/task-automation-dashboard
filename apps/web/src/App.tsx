import { useEffect, useState } from 'react';
import type { TaskWithRunsDto } from '@tad/shared';

const API_BASE = 'http://localhost:3001';

function formatTime(iso: string) {
  return new Date(iso).toLocaleString();
}

type RunDetails = {
  id: string;
  taskKey: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  logs?: Array<{
    id: string;
    ts: string;
    level: string;
    message: string;
  }>;
};

export default function App() {
  const [tasks, setTasks] = useState<TaskWithRunsDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runningKey, setRunningKey] = useState<string | null>(null);

  // Selected run details are shown once (below the task list)
  const [selectedRun, setSelectedRun] = useState<RunDetails | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  async function loadTasks() {
    const res = await fetch(`${API_BASE}/tasks`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as TaskWithRunsDto[];
  }

  async function loadRun(id: string) {
    const res = await fetch(`${API_BASE}/runs/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as RunDetails;
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await loadTasks();
        if (!cancelled) setTasks(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Failed to load tasks');
      }
    })();

    // Simple polling so statuses update (queued → running → success)
    const t = setInterval(async () => {
      try {
        const data = await loadTasks();
        if (!cancelled) setTasks(data);
      } catch {
        // ignore transient errors
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  async function runTask(taskKey: string) {
    setRunningKey(taskKey);

    // Optional UX: clear selected run so you don't stare at stale details
    setSelectedRun(null);
    setSelectedRunId(null);

    try {
      const res = await fetch(`${API_BASE}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);

      // Refresh immediately so new run shows
      setTasks(await loadTasks());
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'Failed to create run');
    } finally {
      setRunningKey(null);
    }
  }

  async function selectRun(runId: string) {
    setSelectedRunId(runId);
    try {
      const data = await loadRun(runId);
      setSelectedRun(data);
    } catch (e) {
      console.error(e);
      alert('Failed to load run details');
      setSelectedRun(null);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, Arial, sans-serif' }}>
      <h1>Task Automation Dashboard</h1>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!tasks && !error && <p>Loading…</p>}

      {tasks && (
        <>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map((task) => (
              <li
                key={task.key}
                style={{
                  marginBottom: 16,
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{task.name}</div>
                    <div style={{ opacity: 0.7 }}>{task.description}</div>
                  </div>

                  <button
                    onClick={() => runTask(task.key)}
                    disabled={runningKey === task.key}
                    style={{ height: 36 }}
                  >
                    {runningKey === task.key ? 'Starting…' : 'Run'}
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Recent runs</div>

                  {task.runs.length === 0 && <div style={{ opacity: 0.7 }}>None yet</div>}

                  {task.runs.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {task.runs.map((r) => (
                        <li key={r.id} style={{ marginBottom: 6 }}>
                          <button
                            onClick={() => void selectRun(r.id)}
                            style={{
                              fontFamily: 'monospace',
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                            title="View run details"
                          >
                            {r.id.slice(0, 8)}
                          </button>
                          {' — '}
                          <strong>{r.status}</strong>
                          {' — '}
                          <span style={{ opacity: 0.75 }}>{formatTime(r.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {selectedRun && (
            <div
              style={{
                marginTop: 24,
                padding: 12,
                border: '1px solid #ddd',
                borderRadius: 6,
              }}
            >
              <div style={{ fontWeight: 600 }}>Run details</div>
              <div style={{ fontFamily: 'monospace', opacity: 0.75 }}>
                {selectedRunId}
              </div>

              <div style={{ marginTop: 6 }}>
                Status: <strong>{selectedRun.status}</strong>
              </div>

              <div style={{ marginTop: 6, opacity: 0.75 }}>
                Created: {formatTime(selectedRun.createdAt)}
                {selectedRun.startedAt ? ` • Started: ${formatTime(selectedRun.startedAt)}` : ''}
                {selectedRun.finishedAt ? ` • Finished: ${formatTime(selectedRun.finishedAt)}` : ''}
              </div>

              <div style={{ marginTop: 12, fontWeight: 600 }}>Logs</div>
              <div style={{ marginTop: 6 }}>
                {(selectedRun.logs ?? []).length === 0 && (
                  <div style={{ opacity: 0.7 }}>No logs</div>
                )}

                {(selectedRun.logs ?? []).map((l) => (
                  <div key={l.id} style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    [{new Date(l.ts).toLocaleTimeString()}] {l.level}: {l.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
