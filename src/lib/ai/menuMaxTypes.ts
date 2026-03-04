export type MenuMaxInputMode = "url" | "image" | "discover";

export type MenuMaxContext = {
  alreadyLoggedThisWeek?: string[];
  weekProgress?: { points?: number; uniquePlants?: number; target?: number };
};

export type MenuMaxRequest = {
  mode: MenuMaxInputMode;
  url?: string;
  imageDataUrl?: string;
  query?: string;
  context?: MenuMaxContext;
};

export type MenuMaxPlant = {
  name: string;
  category: string;
  points: number;
  matched: boolean;
  duplicateThisWeek: boolean;
};

export type MenuMaxRecommendation = {
  rank: 1 | 2 | 3;
  dishName: string;
  estimatedPoints: number;
  estimatedUniquePlants: number;
  why: string;
  plants: MenuMaxPlant[];
  sourceUrl?: string;
  sourceTitle?: string;
};

export type MenuMaxLogCandidate = MenuMaxPlant & {
  sourceDishes: string[];
};

export type MenuMaxResponse = {
  recommendations: MenuMaxRecommendation[];
  logCandidates: MenuMaxLogCandidate[];
  sourceNotes: string[];
  confidence: number;
};
