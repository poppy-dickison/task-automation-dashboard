import express from 'express';
import cors from 'cors';
import session from 'express-session';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';

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

app.listen(port, () => {
    logger.info({ port }, 'API listening');
});
