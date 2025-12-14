# Frontend Apps Guide

## Issuance App
- Path: `frontend/issuance-app`
- Purpose: Admin UI to create credentials.
- API Target: `VITE_API_URL` (defaults to `http://localhost:3000`).
- Commands:
  - `npm run dev`
  - `npm run build`
  - `npm run test` / `npm run test:watch` / `npm run test:coverage`
- Key Components:
  - `IssuanceForm` – handles validation + submission.
  - `App` – orchestrates loading/error/success cards.
  - `apiService` – Axios wrapper.

## Verification App
- Path: `frontend/verification-app`
- Purpose: Validate issued credentials by ID.
- API Target: `VITE_API_URL` (defaults to `http://localhost:3001`).
- Commands mirror issuance app.
- Key Components:
  - `VerificationForm` – simple ID input with inline instructions.
  - `App` – displays valid/invalid cards + metadata.
  - `apiService` – Axios wrapper with graceful error handling.

## Shared Testing Stack
- Vitest + jsdom environment.
- React Testing Library for user interactions.
- `src/test/setup.ts` registers `@testing-library/jest-dom` matchers.
- Each app keeps specs under `src/__tests__/`.
