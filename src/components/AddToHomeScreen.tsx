"use client";

import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";

/**
 * Detects iOS Safari and shows an "Add to Home Screen" prompt
 * if the app is not already running in standalone/PWA mode.
 * Dismissal is remembered in localStorage.
 */
export default function AddToHomeScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already dismissed
    if (localStorage.getItem("dismissed_a2hs")) return;

    // Already running as installed PWA
    const isStandalone =
      ("standalone" in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean }).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // Detect iOS (iPhone, iPad, iPod)
    const ua = window.navigator.userAgent;
    const isIOS = /iP(hone|ad|od)/.test(ua);
    if (!isIOS) return;

    // Detect Safari (iOS Safari doesn't include "CriOS", "FxiOS", "EdgiOS" etc.)
    const isSafari =
      /Safari/.test(ua) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    if (!isSafari) return;

    // Show after a short delay so it doesn't flash immediately
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem("dismissed_a2hs", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slideUp">
      <div className="max-w-lg mx-auto rounded-2xl bg-brand-dark border border-brand-cream/15 shadow-2xl shadow-black/30 p-4 grain">
        <div className="relative flex gap-3.5">
          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="absolute -top-1 -right-1 p-1 rounded-full text-brand-cream/30 hover:text-brand-cream/60 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>

          {/* App icon preview */}
          <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-brand-green/15 border border-brand-green/20">
            <span className="text-xl font-black text-brand-green leading-none">30</span>
            <span className="text-[7px] font-bold text-brand-cream/70 tracking-wider uppercase leading-none mt-0.5">Plants</span>
          </div>

          {/* Instructions */}
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-sm font-semibold text-brand-cream mb-1">
              Add to Home Screen
            </p>
            <p className="text-xs text-brand-cream/50 leading-relaxed">
              Install this app on your iPhone: tap{" "}
              <Share
                size={13}
                className="inline-block text-brand-green -mt-0.5"
                strokeWidth={2}
              />{" "}
              in Safari, then <span className="font-medium text-brand-cream/70">&quot;Add to Home Screen&quot;</span>
            </p>
          </div>
        </div>

        {/* Safari-only note */}
        <p className="text-[10px] text-brand-cream/30 mt-2.5 text-center">
          Must be opened in Safari to install
        </p>

        {/* Arrow pointing down toward Safari toolbar */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-brand-dark rotate-45 border-r border-b border-brand-cream/15" />
      </div>
    </div>
  );
}
