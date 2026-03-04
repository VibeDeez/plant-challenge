"use client";

import { createContext, useContext } from "react";
import type { HapticInput } from "web-haptics";
import type { HapticIntent } from "./types";

export type AppHapticsTriggerInput = HapticIntent | HapticInput;

export type AppHapticsContextValue = {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
  isSupported: boolean;
  trigger: (input?: AppHapticsTriggerInput) => void;
};

const NOOP = () => undefined;

export const AppHapticsContext = createContext<AppHapticsContextValue>({
  enabled: true,
  setEnabled: NOOP,
  isSupported: false,
  trigger: NOOP,
});

export function useAppHaptics(): AppHapticsContextValue {
  return useContext(AppHapticsContext);
}
