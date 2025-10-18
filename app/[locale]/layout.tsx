// app/[locale]/layout.tsx
import type {Metadata} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {Toaster} from '@/components/ui/toaster';
import {routing} from '@/i18n/routing';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShopScribe',
  description: 'AI product content for Shopify'
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!routing.locales.includes(locale as any)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="font-sans antialiased min-h-screen bg-white text-gray-900">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
