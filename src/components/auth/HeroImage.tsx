export function HeroImage() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-r-[28px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
      {/* Subtle gradient orbs */}
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #2F8CFF 0%, transparent 70%)' }} />
      <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #2F8CFF 0%, transparent 70%)' }} />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="rounded-2xl">
          <img src="/barcode.png" alt="QR Code" className="h-64 w-64" />
        </div>

        <h3 className="mt-6 text-xl font-bold" style={{ color: '#FFFFFF' }}>
          Scan to Preview
        </h3>
        <p className="mt-2 max-w-[280px] text-center text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Scan this QR code to see the landing page on your phone
        </p>
      </div>

      {/* Bottom glass bar */}
      <div
        className="absolute bottom-0 left-0 right-0 border-t px-8 py-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Free and fast
            </span>
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            v1.0
          </span>
        </div>
      </div>
    </div>
  );
}
