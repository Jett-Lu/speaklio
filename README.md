# Speaklio

Speaklio is a voice-first personal care dashboard for turning natural language into structured updates across modular tracking areas.

This repository is being organized as a small capstone monorepo. The current frontend is a static prototype, and the planned backend direction is Express + TypeScript with Supabase for auth and database.

## Repository Structure

- `frontend/` - current static dashboard prototype.
- `backend/` - planned Express + TypeScript API service.
- `BACKEND_BRAINSTORM.md` - temporary backend planning notes.

## Project Areas

### Frontend

The current frontend is a mobile-first static prototype using plain HTML, CSS, and JavaScript.

See `frontend/README.md` for preview instructions and feature notes.

### Backend

The backend has not been implemented yet. The current plan is to use an Express + TypeScript service for privileged workflows and Supabase for auth, Postgres, and Row Level Security.

See `backend/README.md` for the backend plan.

## Current Planning Assumptions

- Start with personal tracking.
- Use Supabase for auth and database.
- Use a small Express + TypeScript backend for secrets, AI/LLM workflows, account deletion, and other privileged operations.
- Keep raw audio transient for the initial LLM query flow.
- Keep the frontend/mobile choice flexible.
