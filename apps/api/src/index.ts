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
import type { TaskDefinitionDto } from '@tad/shared';

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
        orderBy: { key: 'asc' }
    });

    const dto: TaskDefinitionDto[] = tasks.map(t => ({
        key: t.key,
        name: t.name,
        description: t.description
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

    if (!taskKey) {
        return res.status(400).json({ error: 'taskKey is required' });
    }

    // validate task exists
    const task = await prisma.taskDefinition.findUnique({ where: { key: taskKey } });
    if (!task) {
        return res.status(404).json({ error: 'task not found' });
    }

    // for now, hardcode a user
    const user = await prisma.user.upsert({
        where: { email: 'dev@local' },
        update: {},
        create: { email: 'dev@local', passwordHash: 'dev' }
    });

    const run = await prisma.run.create({
        data: {
            taskKey,
            userId: user.id,
            status: 'queued'
        }
    });

    res.status(201).json(run);
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(port, () => {
    logger.info({ port }, 'API listening');
});
