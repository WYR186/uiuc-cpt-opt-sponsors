import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export const metadata: Metadata = {
  title: 'Who hires international students at UIUC | CPT & OPT employer database',
  description:
    'Explore which companies have hired international students at UIUC under CPT and OPT work authorization. Filter by major, search by company, see real-world hiring data sourced from the UIUC Career Center.',
  openGraph: {
    title: 'Who hires international students at UIUC',
    description: 'CPT & OPT employer database for UIUC international students.',
  },
  twitter: { card: 'summary' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

const themeBootstrap = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (t === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = t;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        {plausibleDomain && (
          <script defer data-domain={plausibleDomain} src="https://plausible.io/js/script.js" />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
