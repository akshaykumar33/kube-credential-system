# Documentation Suite

This folder contains the complete documentation set for the Kube Credential System.

## Structure

- `api/` – Endpoint specifications, request/response schemas, and integration details.
- `project/` – Architecture, deployment, testing strategy, and operational procedures.

Use these documents together with the root `README.md` for a holistic understanding of the platform.

## API Documentation Workflow (Scalar + Swagger)

All service contracts must be described using **OpenAPI 3** specs stored under `docs/api/specs/`.

1. Author or update the YAML/JSON spec.
2. Launch the full documentation preview (Scalar + Swagger) with one command:
   ```bash
   npm run docs:preview
   ```
   - Scalar serves both issuance and verification specs on ports `4000` and `4001`.
   - Swagger UI exposes the same specs on ports `3210` and `3211`.
3. Commit both the spec (`*.openapi.yaml`) and its Markdown cheat sheet (e.g., `issuance-service.md`).

Use the subcommands `npm run docs:scalar` or `npm run docs:swagger` if you only need one renderer. This ensures every API doc has both a human-friendly Markdown overview and an interactive Scalar/Swagger experience for consumers.
