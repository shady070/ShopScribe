// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Exclude API routes, Next assets, and static files from i18n handling
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
