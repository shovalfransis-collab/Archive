'use client'; // error pages must run in the browser

// The last-resort error page, used only if the root layout itself crashes
// (then app/error.js can't be shown). It replaces the whole page, so it
// brings its own <html>/<body> and simple inline styles — the app's
// stylesheet and theme toggle aren't available here. It follows the
// device's light/dark setting instead.
export default function GlobalError({ retry }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          colorScheme: 'light dark',
          textAlign: 'center',
          padding: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 40 }}>🗄️</div>
          <h1 style={{ fontSize: 18 }}>The Archive couldn&apos;t load</h1>
          <p style={{ opacity: 0.7, fontSize: 14 }}>Something went wrong. Please try again.</p>
          <button onClick={() => retry()} style={{ padding: '6px 14px', fontSize: 14, cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
