import { motion, useReducedMotion } from 'framer-motion';
import { useThemeStore } from '@/store/themeStore';
import { HalloWokLogo } from './AuthBrand';

interface AuthHeroProps {
  tagline?: string;
  compactMobile?: boolean;
}

const HERO_IMAGE_MASK = {
  maskImage: 'linear-gradient(to bottom, transparent 0%, black 28%)',
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 28%)',
} as const;

/** Responsive editorial hero panel adapting between Sky-Blue (light) and Midnight-Blue (dark). */
export function AuthHero({
  tagline = 'Chat effortlessly, anywhere, with anyone.',
  compactMobile = false,
}: AuthHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const isDark = useThemeStore((s) => s.theme === 'dark');

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden px-6 pt-[max(calc(env(safe-area-inset-top,0px)+1rem),3rem)] transition-colors duration-200 md:min-h-[520px] md:p-9 md:pb-12 lg:p-11 ${
        compactMobile ? 'pb-[max(130px,34vw)]' : 'pb-[max(138px,36vw)]'
      }`}
      style={{
        background: isDark
          ? 'linear-gradient(120deg, #0B1220 0%, #0C101C 52%, #132033 100%)'
          : 'linear-gradient(112deg, #FAFBFF 0%, #E7EFFD 55%, #CDDEFC 100%)',
      }}
    >
      {/* Mobile-only bottom hill extension so the overlapping form sheet leaves the cat's paws clear */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-8 md:hidden ${
          isDark ? 'bg-[#212844]' : 'bg-[#26335D]'
        }`}
      />

      {/* Bottom-anchored cat illustrations; wrapper peeks once on mount, theme toggle only crossfades */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0.92, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-x-0 bottom-4 select-none md:bottom-0"
      >
        <img
          src="/auth-cat-blue.jpg"
          alt=""
          aria-hidden="true"
          className={`block h-auto w-full origin-bottom scale-[1.015] object-cover object-bottom transition-opacity duration-200 ${
            isDark ? 'opacity-0' : 'opacity-100'
          }`}
          style={HERO_IMAGE_MASK}
        />
        <img
          src="/auth-cat-blue-dark.jpg"
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 block h-full w-full origin-bottom scale-[1.015] object-cover object-bottom transition-opacity duration-200 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
          style={HERO_IMAGE_MASK}
        />
      </motion.div>

      {/* Top brand mark & headline */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 max-w-[330px]"
      >
        <div className="flex items-center gap-2.5">
          <HalloWokLogo className="h-8 w-8" />
          <span
            className={`text-lg font-bold tracking-tight ${
              isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'
            }`}
          >
            HalloWok
          </span>
        </div>

        <h2
          className={`mt-3 text-[26px] font-bold leading-[1.14] tracking-tight sm:text-[31px] md:mt-8 lg:text-[34px] ${
            isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'
          }`}
        >
          Your conversations,
          <span
            className={`relative mt-0.5 block w-fit font-bold italic ${
              isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]'
            }`}
          >
            connected.
            <svg
              viewBox="0 0 180 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mt-1 h-2.5 w-[108%]"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M2 8.5C44 3.2 118 2.2 178 6.5"
                stroke={isDark ? '#3B82F6' : '#2563EB'}
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h2>

        <p
          className={`mt-2 max-w-[250px] text-[13px] leading-relaxed sm:text-sm md:mt-3 ${
            compactMobile ? 'hidden md:block ' : ''
          }${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}
        >
          {tagline}
        </p>
      </motion.div>
    </div>
  );
}
