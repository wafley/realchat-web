import { Link } from 'react-router-dom';

import type { CSSProperties } from 'react';

const memeOutline: CSSProperties = {
  textShadow:
    '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000, 0 2px 16px rgba(0,0,0,0.9)',
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-black px-6 py-10 text-center text-white">
      <span className="pointer-events-none absolute left-5 top-10 rotate-12 select-none text-xs font-black text-white/10">
        404
      </span>

      <span className="pointer-events-none absolute right-8 top-1/4 -rotate-12 select-none text-sm font-black text-white/10">
        WHY
      </span>

      <span className="pointer-events-none absolute bottom-20 left-10 rotate-[-8deg] select-none text-xs font-black text-white/10">
        ????
      </span>

      <span className="pointer-events-none absolute bottom-32 right-5 rotate-6 select-none text-xs font-black text-white/10">
        ERROR
      </span>

      <p
        style={memeOutline}
        className="rotate-[-3deg] text-4xl font-black tracking-widest uppercase drop-shadow-2xl sm:text-5xl lg:text-6xl"
      >
        404/NOT FOUND!
      </p>

      <div className="relative my-6 rotate-[1deg]">
        <div className="absolute -inset-2 rotate-[-3deg] border-2 border-dashed border-white/20" />

        <img
          src="/404.gif"
          alt=""
          className="pointer-events-none h-56 w-56 select-none object-cover shadow-2xl transition-transform duration-300 hover:rotate-3 hover:scale-105 sm:h-64 sm:w-64 lg:h-72 lg:w-72"
        />
      </div>

      <p
        style={memeOutline}
        className="rotate-[2deg] text-4xl font-black tracking-widest uppercase sm:text-5xl lg:text-6xl"
      >
        LU NGAPAIN DI SINI JIR 😭
      </p>

      <p className="mt-4 max-w-md rotate-[-1deg] text-sm font-bold text-white/60 sm:text-base">
        halaman yang lu cari udah minggat
        <br />
        server juga ikut bingung.
      </p>

      <Link
        to="/"
        className="mt-10 inline-flex rotate-[-1deg] items-center justify-center border-4 border-white bg-white px-8 py-3 text-sm font-black tracking-widest text-black uppercase shadow-[6px_6px_0_#555] transition-all hover:rotate-2 hover:scale-105 hover:shadow-[3px_3px_0_#555] active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        Back to home
      </Link>

      <div className="mt-10 rotate-[3deg]">
        <p className="text-xs font-medium text-gray-500">
          salam dari fe dev yang ganteng
          <br />
          ea
        </p>
      </div>
    </div>
  );
}