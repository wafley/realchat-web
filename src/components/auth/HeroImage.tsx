export function HeroImage() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-r-[28px]">
      <img
        src="/auth-hero.jpg"
        alt="Hallo Wok"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
      <div className="absolute inset-0 bg-black/45" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute bottom-6 right-6 flex items-center gap-2">
        <img src="/logo.png" alt="Hallo Wok" className="h-14 w-14 rounded-xl opacity-80" />
        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Hallo Wok
        </span>
      </div>
    </div>
  );
}
