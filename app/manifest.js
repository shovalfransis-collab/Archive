// The web app manifest (served at /manifest.webmanifest). It's what lets
// you install The Archive to your phone's home screen like an app, and —
// through `share_target` — makes "The Archive" show up in Android's share
// menu once installed. Sharing sends you to /share?title=…&text=…&url=…
// (app/share/page.js). iPhones don't support share_target; see
// /save-anywhere for the iPhone Shortcut instead.
export default function manifest() {
  return {
    name: 'The Archive',
    short_name: 'Archive',
    description: 'Your personal archive of links, photos, and notes.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#171717',
    theme_color: '#171717',
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png' },
      // The icon keeps its drawing inside the middle ~60%, so Android can
      // crop it to a circle/squircle ("maskable") without cutting anything.
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    share_target: {
      action: '/share',
      method: 'GET',
      params: { title: 'title', text: 'text', url: 'url' },
    },
  };
}
