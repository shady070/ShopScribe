// i18n/request.ts
import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;

  // ✅ No hasLocale: use includes on your routing config
  const locale = routing.locales.includes(requested as any)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // ⬇️ Adjust the import path if your messages live elsewhere
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
