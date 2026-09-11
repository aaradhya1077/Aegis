"use client";

import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export function AegisLogo({ size = 40, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield body */}
      <path
        d="M24 4L6 12V22C6 33.1 13.68 43.44 24 46C34.32 43.44 42 33.1 42 22V12L24 4Z"
        fill="url(#shield-gradient)"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Inner shield highlight */}
      <path
        d="M24 8L10 14.5V22.5C10 31.38 16.2 39.66 24 41.8C31.8 39.66 38 31.38 38 22.5V14.5L24 8Z"
        fill="url(#inner-gradient)"
        opacity="0.6"
      />
      {/* Checkmark */}
      <path
        d="M16 24L21 29L32 18"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Document lines */}
      <path
        d="M18 35H30"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M20 38H28"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      <defs>
        <linearGradient id="shield-gradient" x1="24" y1="4" x2="24" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#065F46" />
        </linearGradient>
        <linearGradient id="inner-gradient" x1="24" y1="8" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AegisLogoWithText({
  size = 36,
  className = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <AegisLogo size={size} />
      <div className="flex flex-col">
        <span className="text-base font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-300 bg-clip-text text-transparent">
          Aegis
        </span>
        <span className="text-[9px] font-bold text-emerald-400 tracking-[0.2em] uppercase leading-tight font-mono">
          Compliance
        </span>
      </div>
    </div>
  );
}

export { AegisLogoWithText as Logo };
