import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'The Archive',
  description: 'Your personal archive of links, photos, and notes.',
};

// Runs before React hydrates so the `.dark` class is already correct on
// first paint — otherwise the page would flash light-then-dark (or vice
// versa) every load. Kept as a plain string injected via
// dangerouslySetInnerHTML (not a module import) because it has to execute
// synchronously, before anything else renders.
const themeInitScript = `
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
        {/* AppShell renders the header (logo, search, quick-add) on every
            page except the login screen — see components/AppShell.js. */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
