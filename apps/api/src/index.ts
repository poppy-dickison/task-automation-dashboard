/**
 * API entry point.
 *
 * Exposes endpoints for:
 * - listing available automation tasks
 * - creating and tracking task runs
 *
 * This service is intentionally simple and synchronous for now.
 * Task execution is simulated; real implementations can be plugged in later.
 */

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import { prisma } from './lib/prisma';
import type { TaskWithRunsDto } from '@tad/shared';

const app = express();

const port = Number(process.env.PORT || 3001);
const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:5173';

app.use(pinoHttp({ logger }));

app.use(
    cors({
        origin: webOrigin,
        credentials: true
    })
);

app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'dev-only-secret',
        resave: false,
        saveUninitialized: false
    })
);

app.get('/health', (req, res) => {
    res.json({ ok: true });
});

/**
 * Returns all registered task definitions along with recent run history.
 *
 * Used by the web dashboard to display:
 * - available tasks
 * - recent executions and logs
 */
app.get('/tasks', async (req, res) => {
    const tasks = await prisma.taskDefinition.findMany({
        orderBy: { key: 'asc' },
        include: {
            runs: {
                orderBy: { createdAt: 'desc' }, take: 5,
            }
        }
    });

    const dto: TaskWithRunsDto[] = tasks.map(t => ({
        key: t.key,
        name: t.name,
        description: t.description,
        runs: t.runs.map(r => ({
            id: r.id,
            taskKey: r.taskKey,
            status: r.status as any,
            createdAt: r.createdAt.toISOString(),
            startedAt: r.startedAt ? r.startedAt.toISOString() : null,
            finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null
        }))
    }));

    res.json(dto);
})

/**
 * Creates a new run for a given task.
 *
 * For now:
 * - a default local user is used
 * - execution is simulated using timeouts
 *
 * In a real system, this would enqueue work for a background worker.
 */
app.post('/runs', async (req, res) => {
    const { taskKey } = req.body as { taskKey?: string };

    if (!taskKey) return res.status(400).json({ error: 'taskKey is required' });

    const task = await prisma.taskDefinition.findUnique({ where: { key: taskKey } });
    if (!task) return res.status(404).json({ error: 'task not found' });

    const user = await prisma.user.upsert({
        where: { email: 'dev@local' },
        update: {},
        create: { email: 'dev@local', passwordHash: 'dev' }
    });

    const run = await prisma.run.create({
        data: { taskKey, userId: user.id, status: 'queued' }
    });

    // Log: queued
    await prisma.runLog.create({
        data: { runId: run.id, level: 'info', message: 'Queued' }
    });

    // After a short delay, mark running + log
    setTimeout(async () => {
        try {
            await prisma.run.update({
                where: { id: run.id },
                data: { status: 'running', startedAt: new Date() }
            });

            await prisma.runLog.create({
                data: { runId: run.id, level: 'info', message: 'Started' }
            });

            await prisma.runLog.create({
                data: { runId: run.id, level: 'info', message: 'Performing task steps…' }
            });
        } catch (e) {
            // swallow errors (dev only)
        }
    }, 300);

    // After longer delay, mark success + log
    setTimeout(async () => {
        try {
            await prisma.run.update({
                where: { id: run.id },
                data: { status: 'success', finishedAt: new Date() }
            });

            await prisma.runLog.create({
                data: { runId: run.id, level: 'info', message: 'Finished successfully' }
            });
        } catch (e) {
            // swallow errors (dev only)
        }
    }, 1500);

    // Respond immediately (don’t wait for timeouts)
    res.status(201).json({
        id: run.id,
        taskKey: run.taskKey,
        status: run.status,
        createdAt: run.createdAt.toISOString(),
        startedAt: null,
        finishedAt: null
    });
});

app.get('/runs/:id', async (req, res) => {
    const run = await prisma.run.findUnique({
        where: { id: req.params.id },
        include: { logs: { orderBy: { ts: 'asc' } } }
    });

    if (!run) return res.status(404).json({ error: 'run not found' });

    res.json({
        id: run.id,
        taskKey: run.taskKey,
        status: run.status,
        createdAt: run.createdAt.toISOString(),
        startedAt: run.startedAt ? run.startedAt.toISOString() : null,
        finishedAt: run.finishedAt ? run.finishedAt.toISOString() : null,
        logs: run.logs.map(l => ({
            id: l.id,
            runId: l.runId,
            ts: l.ts.toISOString(),
            level: l.level,
            message: l.message
        }))
    });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(port, () => {
    logger.info({ port }, 'API listening');
});
