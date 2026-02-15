/**
 * Main dashboard UI.
 *
 * Responsibilities:
 * - fetch task definitions from the API
 * - allow users to trigger task runs
 * - display recent run status and logs
 *
 * This component intentionally keeps state local and simple.
 */
import { useEffect, useState } from 'react';
import type { TaskDefinitionDto } from '@tad/shared';

function App() {
  const [tasks, setTasks] = useState<TaskDefinitionDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initial load + polling to keep run status updated in near real-time.
  // Polling is sufficient here and avoids premature websocket complexity.
  useEffect(() => {
    fetch('http://localhost:3001/tasks')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as TaskDefinitionDto[];
      })
      .then(setTasks)
      .catch((err) => {
        console.error(err);
        setError('Failed to load tasks');
      });
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, Arial, sans-serif' }}>
      <h1>Task Automation Dashboard</h1>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {!tasks && !error && <p>Loading tasks…</p>}

      {tasks && (
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
              <div style={{ fontWeight: 600 }}>{task.name}</div>
              <div style={{ opacity: 0.7 }}>{task.description}</div>

              <button
                style={{ marginTop: 8 }}
                onClick={async () => {
                  const res = await fetch('http://localhost:3001/runs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskKey: task.key }),
                  });

                  const data = await res.json();

                  if (!res.ok) {
                    alert(data?.error ?? 'Failed to create run');
                    return;
                  }

                  alert(`Run created: ${data.id}`);
                }}
              >
                Run
              </button>
            </li>



          ))}
        </ul>
      )}
    </div>
  );
}

export default App;

