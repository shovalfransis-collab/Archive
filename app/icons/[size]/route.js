import { ImageResponse } from 'next/og';

// The app icon as a PNG at /icons/180, /icons/192 and /icons/512 — drawn
// in code (a simple archive box) instead of keeping image files around.
// Used by the manifest (home-screen icon) and as the Apple touch icon.
// Generated once at build time; any other size is a 404.
const SIZES = ['180', '192', '512'];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}
export const dynamicParams = false;

export async function GET(request, { params }) {
  const { size } = await params;
  const px = Number(size);
  const u = px / 100; // 1% of the icon, so the drawing scales with any size

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#171717',
        }}
      >
        {/* Box drawn inside the central 60% (the "maskable" safe area). */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 56 * u }}>
          {/* lid */}
          <div style={{ width: 56 * u, height: 12 * u, background: '#fafafa', borderRadius: 3 * u }} />
          {/* body with a handle slot */}
          <div
            style={{
              marginTop: 3 * u,
              width: 50 * u,
              height: 33 * u,
              background: '#fafafa',
              borderRadius: 3 * u,
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 8 * u,
            }}
          >
            <div style={{ width: 18 * u, height: 5 * u, background: '#171717', borderRadius: 3 * u }} />
          </div>
        </div>
      </div>
    ),
    { width: px, height: px }
  );
}
