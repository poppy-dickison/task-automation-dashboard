# Task Automation Dashboard

A small internal-style dashboard for triggering automation tasks and tracking execution history.
Built as a portfolio project to demonstrate full-stack TypeScript using a React frontend and a Node/Express API.

## Why this project exists

This project was built to demonstrate how a lightweight internal automation dashboard
can be structured using modern TypeScript across frontend and backend. It focuses on
clarity, shared types, and traceable task execution rather than production-scale concerns.

## Features

- List available task definitions
- Trigger task runs from the UI
- Track run lifecycle (queued → running → success / failed)
- View run details and execution logs in real time
- Simple polling-based updates (no websockets yet)

## Tech stack

- Web: React, Vite, TypeScript
- API: Node.js, Express, TypeScript
- Database: Prisma, SQLite

## Project structure

apps/
  api/      Express API, Prisma, SQLite
  web/      React + Vite frontend
packages/
  shared/   Shared DTOs and types

## Running locally

Prerequisites:
- Node.js
- npm

Install dependencies (from repository root):

npm install

Start development servers (from repository root):

npm run dev

This starts both services:

- Web UI: http://localhost:5173
- API: http://localhost:3001

## API endpoints (dev)

GET /health  
GET /tasks  

POST /runs  
Body:
{
  "taskKey": "health_check"
}

GET /runs/:id

## Notes / future improvements

- Replace simulated task execution with real task implementations
- Add a background worker or queue for task execution
- Add authentication and user management
- Add scheduling and notifications
- Replace polling with websockets or server-sent events

This project is intentionally scoped as an internal tool example rather than a production system.
