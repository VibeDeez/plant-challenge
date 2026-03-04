"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { WebHaptics } from "web-haptics";
import {
  HAPTICS_DEFAULT_ENABLED,
  HAPTICS_ENABLED_STORAGE_KEY,
  parseStoredHapticsEnabled,
  serializeHapticsEnabled,
} from "@/lib/haptics/preferences";
import {
  findHapticTarget,
  isSubmitControl,
  resolveHapticInputForElement,
} from "@/lib/haptics/resolveInteraction";
import {
  AppHapticsContext,
  type AppHapticsTriggerInput,
} from "@/lib/haptics/useAppHaptics";
import { normalizeHapticInput } from "@/lib/haptics/types";

const SUBMIT_CLICK_DEDUPE_MS = 400;

type SubmitClickRef = {
  form: HTMLFormElement;
  timestamp: number;
};

type HapticsProviderProps = {
  children: ReactNode;
};

export default function HapticsProvider({ children }: HapticsProviderProps) {
  const [enabled, setEnabledState] = useState(() => {
    if (typeof window === "undefined") return HAPTICS_DEFAULT_ENABLED;
    const stored = window.localStorage.getItem(HAPTICS_ENABLED_STORAGE_KEY);
    return parseStoredHapticsEnabled(stored);
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const hapticsRef = useRef<WebHaptics | null>(null);
  const lastSubmitClickRef = useRef<SubmitClickRef | null>(null);

  const isSupported = WebHaptics.isSupported;
  // Do not gate by WebHaptics.isSupported: the library provides an iOS fallback path.
  const canTrigger = enabled && !prefersReducedMotion;

  useEffect(() => {
    hapticsRef.current = new WebHaptics();
    return () => {
      hapticsRef.current?.destroy();
      hapticsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function onStorage(event: StorageEvent) {
      if (event.key !== HAPTICS_ENABLED_STORAGE_KEY) return;
      setEnabledState(parseStoredHapticsEnabled(event.newValue));
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(media.matches);
    handleChange();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      HAPTICS_ENABLED_STORAGE_KEY,
      serializeHapticsEnabled(next)
    );
  }, []);

  const trigger = useCallback(
    (input?: AppHapticsTriggerInput) => {
      if (!canTrigger || !hapticsRef.current) return;
      const normalized = normalizeHapticInput(input);
      if (!normalized) return;
      void hapticsRef.current.trigger(normalized);
    },
    [canTrigger]
  );

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!canTrigger || !event.isTrusted || event.button !== 0) return;

      const target = findHapticTarget(event.target);
      if (!target) return;

      const resolved = resolveHapticInputForElement(target);
      if (!resolved) return;

      if (isSubmitControl(target) && target.form) {
        lastSubmitClickRef.current = {
          form: target.form,
          timestamp: performance.now(),
        };
      }

      trigger(resolved);
    }

    function onDocumentSubmit(event: Event) {
      if (!canTrigger || !event.isTrusted) return;
      if (!(event.target instanceof HTMLFormElement)) return;

      const dedupe = lastSubmitClickRef.current;
      if (
        dedupe &&
        dedupe.form === event.target &&
        performance.now() - dedupe.timestamp < SUBMIT_CLICK_DEDUPE_MS
      ) {
        return;
      }

      const submitEvent = event as SubmitEvent;
      const submitter =
        submitEvent.submitter instanceof HTMLElement
          ? submitEvent.submitter
          : null;

      const source = submitter ?? event.target;
      const resolved = resolveHapticInputForElement(source);
      if (!resolved) return;

      trigger(resolved);
    }

    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("submit", onDocumentSubmit, true);

    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("submit", onDocumentSubmit, true);
    };
  }, [canTrigger, trigger]);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      isSupported,
      trigger,
    }),
    [enabled, setEnabled, isSupported, trigger]
  );

  return (
    <AppHapticsContext.Provider value={value}>
      {children}
    </AppHapticsContext.Provider>
  );
}
