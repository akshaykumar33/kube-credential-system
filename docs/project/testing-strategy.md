# Testing Strategy

This document outlines the testing approach for the Kube Credential System, ensuring comprehensive test coverage across all components.

## Testing Pyramid

```
          /\\
         / E2E \\
        /________\\
       /          \\
      / Integration \\
     /______________\\
    /                \\
   /     Unit         \\
  /____________________\\
```

## 1. Unit Testing

### Scope
- Individual functions and methods
- Service layer logic
- Utility functions
- Component rendering (frontend)

### Tools
- **Jest**: Test runner and assertion library
- **React Testing Library**: For React component testing
- **ts-jest**: For TypeScript support
- **@testing-library/user-event**: For simulating user interactions

### Best Practices
- Test one thing per test case
- Use descriptive test names
- Mock external dependencies
- Follow AAA pattern (Arrange, Act, Assert)
- Aim for >80% code coverage

## 2. Integration Testing

### Scope
- API endpoints
- Service interactions
- Database operations
- Redis pub/sub
- Component interactions

### Tools
- **Jest**: Test runner
- **Supertest**: For API endpoint testing
- **Redis mock**: For Redis interactions
- **Testing Library**: For component integration tests

### Best Practices
- Test happy paths and error cases
- Verify database state changes
- Test service boundaries
- Use test containers for database/Redis

## 3. End-to-End (E2E) Testing

### Scope
- User flows across multiple services
- Frontend to backend integration
- Complete credential issuance and verification flow

### Tools
- **Cypress**: For E2E testing
- **Docker Compose**: For local environment setup
- **Test Containers**: For isolated testing environments

### Best Practices
- Test critical user journeys
- Use data-testid attributes for reliable element selection
- Clean up test data after tests
- Run in headless mode in CI

## 4. API Testing

### Scope
- Request/response validation
- Authentication/authorization
- Error handling
- Rate limiting

### Tools
- **Postman/Newman**: For API testing
- **Dredd**: For API blueprint testing
- **OpenAPI Validator**: For schema validation

## 5. Performance Testing

### Scope
- API response times
- Concurrent user handling
- Resource usage

### Tools
- **k6**: For load testing
- **Artillery**: For performance testing

## 6. Security Testing

### Scope
- Authentication/authorization
- Input validation
- SQL injection
- XSS protection

### Tools
- **OWASP ZAP**: For security scanning
- **npm audit**: For dependency checks

## Test Environment

### Local Development
- Each service runs in its own container
- Test databases and Redis instances
- Mock external services

### CI/CD Pipeline
- Automated test execution on each PR
- Coverage reporting
- Test result reporting
- Security scanning

## Code Coverage Goals

| Component          | Target Coverage |
|--------------------|-----------------|
| Backend Services  | 90%             |
| Frontend          | 85%             |
| API Endpoints     | 100%            |
| Critical Paths    | 100%            |

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage
```

### Integration Tests
```bash
# Start test containers
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration
```

### E2E Tests
```bash
# Start the full stack
npm run test:e2e:setup

# Run E2E tests
npm run test:e2e
```

## Test Data Management

- Use factories to generate test data
- Reset database state between tests
- Use snapshots for UI components
- Mock external API calls

## Continuous Integration

Tests are automatically run on:
- Push to main branch
- Pull requests
- Scheduled nightly builds

## Monitoring and Reporting

- Test results are published to the CI dashboard
- Code coverage reports are generated and tracked
- Performance metrics are monitored over time

## Backend (Issuance + Verification Services)

- **Test Runner**: Jest with `ts-jest` preset.
- **Location**: `services/<service>/src/__tests__`.
- **Coverage**:
  - Business logic (`issuanceService`, `verificationService`).
  - Controllers (input validation, response codes).
  - Infrastructure adaptors (event service, database wrapper) using mocked dependencies.
- **Commands**:
  - `npm run test` – Executes all Jest specs once.
  - `npm run test:watch` – Re-runs specs on file change (dev).
  - `npm run test:coverage` – Generates coverage report in `coverage/`.
- **Mocking Guidelines**:
  - Use `jest.mock` to isolate Redis, SQLite, and Express Request/Response objects.
  - Prefer dependency injection where possible; otherwise patch prototypes.
- **Future Enhancements**:
  - Add integration tests using `supertest` against the Express app.
  - Use `testcontainers` for ephemeral Redis to validate retry/queue flows end-to-end.

## Frontend (Issuance App)

- **Test Runner**: Vitest (Vite-native) with jsdom environment.
- **Libraries**: @testing-library/react, jest-dom, user-event.
- **Scope**:
  - Component behavior (form validation, success/error UI states).
  - API hooks/service module (axios integration, error handling).
  - Top-level App rendering and conditional sections.
- **Commands**:
  - `npm run test` – Executes vitest specs once.
  - `npm run test:watch` – Live reload mode.
  - `npm run test:coverage` – HTML/text coverage outputs under `coverage/`.
- **Setup**: `src/test/setup.ts` registers jest-dom matchers globally.
- **Recommended Additions**:
  - Snapshot tests for consistent UI states.
  - Cypress component/e2e tests hitting the real backend (optional).

## CI Integration

- Add GitHub Actions workflow (e.g., `.github/workflows/test.yml`) to run:
  1. `npm ci`
  2. `npm run build:all`
  3. `npm run test --workspaces` (or per service using matrix jobs)

## Developer Workflow

1. Make changes in service/frontend folder.
2. Run local unit tests for the touched area.
3. Before opening PR, run full suite:
   ```bash
   npm run test:issuance        # alias to cd services/issuance-service && npm test (to be added)
   npm run test:verification
   npm run test:issuance-app
   ```
4. Inspect coverage reports for regressions (<80% statements threshold to be enforced later).
