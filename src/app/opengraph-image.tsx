import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const alt = 'CUSTECH Marketplace - Official Campus Commerce';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#022c22',
          backgroundImage: 'radial-gradient(circle at 50% 0%, #065f46 0%, #022c22 80%)',
          color: 'white',
          padding: '40px 60px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 110,
            height: 110,
            borderRadius: 30,
            backgroundColor: '#ffffff',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: '#047857',
              letterSpacing: -2,
            }}
          >
            CM
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            marginBottom: 10,
            color: '#ffffff',
          }}
        >
          CUSTECH MARKETPLACE
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 22,
            fontWeight: 500,
            color: '#a7f3d0',
            marginBottom: 36,
            textAlign: 'center',
          }}
        >
          Buy. Sell. Connect. Safely. - Confluence University of Science & Technology
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              padding: '12px 24px',
              borderRadius: 999,
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(110, 231, 183, 0.3)',
              fontSize: 18,
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            Verified Campus IDs
          </div>
          <div
            style={{
              display: 'flex',
              padding: '12px 24px',
              borderRadius: 999,
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(110, 231, 183, 0.3)',
              fontSize: 18,
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            Escrow Buyer Protection
          </div>
          <div
            style={{
              display: 'flex',
              padding: '12px 24px',
              borderRadius: 999,
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(110, 231, 183, 0.3)',
              fontSize: 18,
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            Osara Campus & Lodges
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
