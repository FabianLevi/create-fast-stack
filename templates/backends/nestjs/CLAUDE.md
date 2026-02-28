# {{projectName}}

## Stack
- NestJS 10, TypeScript, Express
- Pino (structured logging + request tracing)
- @nestjs/config + Joi (env validation)

## Commands
- Install: `npm install`
- Dev: `npm run start:dev` (auto-reload)
- Build: `npm run build`
- Start (prod): `npm run start:prod`
- Test: `npm test`
- Lint: `npm run lint`

## Project Structure

```
src/
├── main.ts                              # Bootstrap, global filters, logger
├── app.module.ts                        # Root module (imports all feature modules)
├── config/
│   ├── app.config.ts                    # Joi env validation schema
│   └── env.enum.ts                      # Environment enum (develop/staging/production)
├── common/
│   ├── exceptions/
│   │   └── app.exception.ts             # AppException, NotFoundException, PermissionException
│   ├── filters/
│   │   └── all-exceptions.filter.ts     # Global error handler (uniform JSON responses)
│   └── logger/
│       └── logger.module.ts             # Pino logger setup with request ID tracing
└── modules/
    └── health/
        ├── health.module.ts
        ├── health.controller.ts         # GET /health
        ├── health.controller.spec.ts    # Controller tests
        ├── health.service.ts
        ├── health.service.spec.ts       # Service tests
        └── dto/
            └── health-response.dto.ts   # Response DTO with class-validator
```

## Environment

Copy `.env.example` to `.env`:
```
APP_ENV=develop
APP_HOST=127.0.0.1
APP_PORT=8000
APP_WORKERS=1
```

## Conventions
- PascalCase for classes, decorators, modules
- camelCase for methods, variables
- One module per feature directory under `src/modules/`
- Shared infra in `src/common/` (filters, exceptions, middleware)
- Config in `src/config/`
- Use `@Injectable()` for services, `@Controller()` for controllers
- CORS enabled for localhost:5173 (Vite) and localhost:3000 (Next.js)

## Adding a New Feature

1. Create module in `src/modules/my-feature/`:
   - `my-feature.module.ts`
   - `my-feature.controller.ts`
   - `my-feature.service.ts`
2. Import module in `app.module.ts`

## Error Handling

Global exception filter returns uniform JSON:
```json
{ "statusCode": 500, "message": "...", "requestId": "uuid", "timestamp": "..." }
```

Custom exceptions available: `AppException`, `NotFoundException`, `PermissionException`.

## Validation

Global `ValidationPipe` enabled in `main.ts`:
- `whitelist` — strips unknown properties
- `forbidNonWhitelisted` — rejects unknown properties with 400
- `transform` — auto-converts to DTO types

Define DTOs with `class-validator` decorators:
```typescript
import { IsString, IsInt, Min } from 'class-validator';

export class CreateItemDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  price: number;
}
```

## Testing

Tests colocated with source files (`*.spec.ts`). Uses `@nestjs/testing` TestingModule:
```typescript
const module = await Test.createTestingModule({
  providers: [MyService],
}).compile();
const service = module.get(MyService);
```

Run: `npm test` | `npm run test:watch` | `npm run test:cov`

## Logging

Pino auto-logs all HTTP requests with request ID. In develop mode, logs are pretty-printed. In production, structured JSON.

## Graceful Shutdown

`enableShutdownHooks()` handles SIGTERM/SIGINT for clean container/k8s deploys. Health check at `GET /health` for readiness probes.
