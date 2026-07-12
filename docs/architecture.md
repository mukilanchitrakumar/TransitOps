# TransitOps Architecture Documentation

TransitOps uses a modern decoupled architecture:
1. **Frontend**: React + Vite SPA utilizing Tailwind CSS v4 and TanStack components.
2. **Backend**: Node.js + Express service.
3. **Database**: PostgreSQL database schemas mapped using Prisma ORM.

## Directory Layout
- `/backend`: Node Express server source
- `/frontend`: React application client source
- `/shared`: Common Zod schemas & TypeScript models
- `/docs`: Visual specifications and diagrams
- `/scripts`: Automation scripting hooks
