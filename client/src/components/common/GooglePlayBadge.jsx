import React from 'react'

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.urxpenz.app'

export const isNativeCapacitorApp = () => {
  if (typeof window === 'undefined') return false
  return Boolean(
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' || 
    window.location.protocol === 'file:' ||
    (window.location.hostname === 'localhost' && window.location.port !== '5173' && window.location.port !== '4173')
  )
}

export function GooglePlayIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.5 25.5C43.2 30 40.6 36.5 40.6 45v422c0 8.5 2.6 15 6.9 19.5l1.1 1.1 236.4-236.6v-5.7L48.6 24.4l-1.1 1.1z" fill="#00C1FF"/>
      <path d="M363.3 322.8l-78.2-78.2v-5.7l78.2-78.2 1.9 1.1 92.4 52.3c26.4 15 26.4 39.5 0 54.5l-92.4 52.1-1.9 1.1z" fill="#FFCF00"/>
      <path d="M365.2 321.7L285.1 241.6 47.5 487.2c8.7 9.2 23.1 10.3 39.2 1.2l278.5-166.7" fill="#FF3A44"/>
      <path d="M365.2 153.5L86.7 27.5c-16.1-9.1-30.5-8-39.2 1.2l237.6 237.6 80.1-77.9z" fill="#00E676"/>
    </svg>
  )
}

export default function GooglePlayBadge({ variant = 'button', className = '' }) {
  // If already running inside the native Android APK, do not display the download badge
  if (isNativeCapacitorApp()) {
    return null
  }

  if (variant === 'banner') {
    return (
      <div className={`w-full p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-[#161928] to-slate-900 text-white shadow-md flex items-center justify-between gap-3 border border-slate-700/60 ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <GooglePlayIcon className="w-6 h-6 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Official Android App</p>
            <p className="text-xs font-bold text-white truncate mt-0.5">Install on Google Play</p>
          </div>
        </div>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1"
        >
          <span>Get App</span>
          <span className="text-[10px]">→</span>
        </a>
      </div>
    )
  }

  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white border border-slate-700/70 shadow-lg hover:shadow-purple-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      <GooglePlayIcon className="w-6 h-6 shrink-0" />
      <div className="text-left leading-none">
        <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1">
          GET IT ON
        </span>
        <span className="block text-sm font-bold text-white tracking-wide">
          Google Play
        </span>
      </div>
    </a>
  )
}

