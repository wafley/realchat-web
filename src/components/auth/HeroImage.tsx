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
      <div className="relative z-10 -mt-64 flex flex-col items-center text-center">
        <img src="/logo.png" alt="Hallo Wok" className="mb-1 h-56 w-56 rounded-3xl" />

        <p className="mb-6 max-w-[260px] text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Chat, connect, and share moments with the people who matter most.
        </p>

        {/* Signature line */}
        <div className="flex items-center gap-3">
          <div className="h-px w-8" style={{ background: 'rgba(47,140,255,0.3)' }} />
          <span className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: 'rgba(47,140,255,0.5)' }}>
            Secure Messaging
          </span>
          <div className="h-px w-8" style={{ background: 'rgba(47,140,255,0.3)' }} />
        </div>
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
