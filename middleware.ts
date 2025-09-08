// middleware.ts
import createMiddleware from 'next-intl/middleware';
import {routing} from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Update to your app’s public paths
  matcher: ['/((?!_next|.*\\..*).*)']
};
