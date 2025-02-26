# BlockAnalytica Project Guidelines

## Build & Development Commands
- `pnpm dev` - Run Next.js application in development mode
- `pnpm build` - Build Next.js application for production
- `pnpm start` - Run production Next.js application
- `pnpm dev:api` - Run only the API server in development mode
- `pnpm build:api` - Build only the API server
- `pnpm start:api` - Run compiled API server
- No tests implemented yet (add `vitest` or `jest` recommended)

## Code Style Guidelines
- **Imports**: External dependencies use absolute imports, internal modules use relative imports with file extensions
- **Naming**: Classes/files use PascalCase, functions/variables use camelCase, constants use UPPER_SNAKE_CASE
- **Types**: Use interfaces for object structures, enums for fixed values, and Zod schemas for validation
- **Error Handling**: Use try/catch blocks with specific error messages, return structured JSON responses
- **File Organization**: 
  - Backend: agents in `src/agents/`, tools in `src/tools/`, types in `src/types/`
  - Frontend: pages in `app/`, API routes in `app/api/`
- **React Components**: Use functional components with hooks
- **Documentation**: Use JSDoc style comments for functions, document parameters in Zod schemas
- **TypeScript**: Maintain strict type checking (as configured in tsconfig.json)
- **Module System**: Uses ES Modules (type: "module" in package.json)
- **Environment Variables**: Load from .env file, check existence at initialization
- **Styling**: Uses CSS modules and global styles

## Project Architecture
- Frontend: Next.js React application with app router
- Backend: LangChain Supervisor pattern with specialized agents and tools
- API Integration: Next.js API routes connect frontend to backend services
- Follows factory pattern for agent creation
- Tools use LangChain tool pattern with schema validation