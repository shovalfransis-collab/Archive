import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'The Archive',
  description: 'Your personal archive of links, photos, and notes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        {/* AppShell renders the header (logo, search, quick-add) on every
            page except the login screen — see components/AppShell.js. */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
