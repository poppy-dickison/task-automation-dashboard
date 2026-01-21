export type RunStatus = 'queued' | 'running' | 'success' | 'failed';

export interface TaskDefinitionDto {
    key: string;
    name: string;
    description: string;
}

export interface RunDto {
    id: string;
    taskKey: string;
    status: RunStatus;
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
}

export interface RunLogDto {
    id: string;
    runId: string;
    ts: string;
    level: 'info' | 'warn' | 'error';
    message: string;
}
