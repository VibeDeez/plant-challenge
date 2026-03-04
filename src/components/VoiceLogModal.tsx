"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, Loader2, Mic, MicOff, Plus, Trash2, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CATEGORY_ORDER } from "@/lib/constants";
import { buildAnalyticsEvent, trackAnalyticsEvent } from "@/lib/analytics/events";

type Plant = {
  id: number;
  name: string;
  category: string;
  points: number;
};

type VoiceCandidate = {
  name: string;
  confidence: number;
};

type VoiceWarning = { name?: string; reason: string };

type VoiceLogResponse = {
  transcript: string;
  candidates: VoiceCandidate[];
  warnings?: VoiceWarning[];
};

type VoiceLogErrorResponse = {
  error?: string;
};

type VoicePlantToLog = {
  name: string;
  category: string;
  points: number;
  confidence?: number;
};

type VoiceResultItem = VoicePlantToLog & {
  selected: boolean;
  duplicate: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  plants: Plant[];
  loggedNames: Set<string>;
  onLogPlants: (plants: VoicePlantToLog[]) => Promise<void>;
};

const VOICE_LOG_DRAFT_KEY = "voice-log-draft-v1";

function normalizePlantName(name: string): string {
  return name
    .trim()
    .replace(/^[\s.,;:!?'"`-]+|[\s.,;:!?'"`-]+$/g, "")
    .replace(/\s+/g, " ");
}

function singularizeWord(word: string): string[] {
  const variants: string[] = [];
  if (word.endsWith("ies") && word.length > 3) {
    variants.push(`${word.slice(0, -3)}y`);
  }
  if (word.endsWith("oes") && word.length > 3) {
    variants.push(word.slice(0, -2));
  }
  if (word.endsWith("es") && word.length > 2) {
    variants.push(word.slice(0, -2));
  }
  if (word.endsWith("s") && word.length > 1) {
    variants.push(word.slice(0, -1));
  }
  return variants.filter((variant) => variant.length > 0 && variant !== word);
}

function getNameMatchKeys(name: string): string[] {
  const normalized = normalizePlantName(name).toLowerCase();
  const keys = new Set<string>([normalized]);

  for (const variant of singularizeWord(normalized)) {
    keys.add(variant);
  }

  const parts = normalized.split(" ");
  if (parts.length > 1) {
    const lastWord = parts[parts.length - 1];
    for (const singularLastWord of singularizeWord(lastWord)) {
      keys.add([...parts.slice(0, -1), singularLastWord].join(" "));
    }
  }

  return Array.from(keys);
}

function resolvePlantMatch(name: string, plantsByLowerName: Map<string, Plant>): Plant | null {
  for (const key of getNameMatchKeys(name)) {
    const matched = plantsByLowerName.get(key);
    if (matched) return matched;
  }
  return null;
}

function isLoggedPlantName(name: string, loggedNameKeys: Set<string>): boolean {
  return getNameMatchKeys(name).some((key) => loggedNameKeys.has(key));
}

function formatVoiceWarning(warning: VoiceWarning): string {
  if (warning.reason === "parse_failed") {
    return "Some audio could not be parsed into plants. Please review the list.";
  }
  if (warning.reason === "low_confidence") {
    return warning.name
      ? `Low confidence match for “${warning.name}”. Please confirm before logging.`
      : "Some matches are low confidence. Please review before logging.";
  }
  return warning.name ? `${warning.reason}: ${warning.name}` : warning.reason;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read audio"));
        return;
      }
      const idx = result.indexOf(",");
      if (idx < 0) {
        reject(new Error("Invalid audio encoding"));
        return;
      }
      resolve(result.slice(idx + 1));
    };
    reader.onerror = () => reject(new Error("Failed to read audio"));
    reader.readAsDataURL(blob);
  });
}

function mimeToFormat(mimeType: string): string {
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
  return "webm";
}

function isProviderCompatibleFormat(format: string): boolean {
  return format === "wav" || format === "mp3";
}

function clampToInt16(sample: number): number {
  if (sample > 1) return 32767;
  if (sample < -1) return -32768;
  return sample < 0 ? Math.round(sample * 32768) : Math.round(sample * 32767);
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const frames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = frames * blockAlign;
  const wav = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wav);

  let offset = 0;

  const writeString = (value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset++, value.charCodeAt(i));
    }
  };

  writeString("RIFF");
  view.setUint32(offset, 36 + dataSize, true);
  offset += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, channels, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, sampleRate * blockAlign, true);
  offset += 4;
  view.setUint16(offset, blockAlign, true);
  offset += 2;
  view.setUint16(offset, 16, true);
  offset += 2;
  writeString("data");
  view.setUint32(offset, dataSize, true);
  offset += 4;

  const channelData = Array.from({ length: channels }, (_, ch) => buffer.getChannelData(ch));

  for (let frame = 0; frame < frames; frame++) {
    for (let ch = 0; ch < channels; ch++) {
      view.setInt16(offset, clampToInt16(channelData[ch][frame]), true);
      offset += 2;
    }
  }

  return new Blob([wav], { type: "audio/wav" });
}

async function convertBlobToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  try {
    const decoded = await audioContext.decodeAudioData(arrayBuffer);
    return audioBufferToWavBlob(decoded);
  } finally {
    await audioContext.close();
  }
}

function getPreferredRecorderMimeType(): string | null {
  const candidates = [
    // Provider-compatible formats first
    "audio/wav",
    "audio/mpeg",
    // Safari/iOS commonly supports mp4 containers for MediaRecorder
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    // Fallbacks
    "audio/ogg;codecs=opus",
    "audio/webm;codecs=opus",
    "audio/webm",
  ];

  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return null;
}

function getRecordingButtonClassName(isRecording: boolean, isUploading: boolean): string {
  let className =
    "w-full min-h-11 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors";

  if (isRecording) {
    className += " bg-red-500 hover:bg-red-600";
  } else {
    className += " bg-brand-green hover:bg-brand-green-hover";
  }

  if (isUploading) {
    className += " opacity-50 cursor-not-allowed";
  }

  return className;
}

function getResultRowClassName(item: VoiceResultItem): string {
  let className = "w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all";

  if (item.duplicate) {
    className += " bg-brand-dark/5 opacity-50";
    return className;
  }

  if (item.selected) {
    className += " bg-white shadow-sm ring-1 ring-brand-green/30";
    return className;
  }

  className += " bg-white/50";
  return className;
}

function getResultCheckClassName(item: VoiceResultItem): string {
  let className = "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border";

  if (item.selected || item.duplicate) {
    className += " bg-brand-green border-brand-green";
    return className;
  }

  className += " border-brand-dark/20";
  return className;
}

export default function VoiceLogModal({
  open,
  onClose,
  plants,
  loggedNames,
  onLogPlants,
}: Props) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const didConfirmRef = useRef(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<VoiceResultItem[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState("Fruits");
  const [error, setError] = useState<string | null>(null);
  const [apiWarnings, setApiWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plantsByLowerName = useMemo(() => {
    const map = new Map<string, Plant>();
    plants.forEach((plant) => map.set(normalizePlantName(plant.name).toLowerCase(), plant));
    return map;
  }, [plants]);

  const loggedNameKeys = useMemo(() => {
    const keys = new Set<string>();
    loggedNames.forEach((name) => {
      getNameMatchKeys(name).forEach((key) => keys.add(key));
    });
    return keys;
  }, [loggedNames]);

  const selectedCount = results.filter((result) => result.selected && !result.duplicate).length;
  const hasDraft =
    transcript.length > 0 || results.length > 0 || apiWarnings.length > 0 || !!error;

  function getConfirmButtonClassName(selectedItemsCount: number, submitting: boolean): string {
    if (selectedItemsCount > 0 && !submitting) {
      return "w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors bg-brand-green hover:bg-brand-green-hover";
    }
    return "w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors bg-brand-green/30 cursor-not-allowed";
  }

  function getConfirmButtonLabel(selectedItemsCount: number, submitting: boolean): string {
    if (submitting) return "Saving...";
    if (selectedItemsCount > 0) {
      return `Log ${selectedItemsCount} Plant${selectedItemsCount !== 1 ? "s" : ""}`;
    }
    return "Select plants to log";
  }

  useEffect(() => {
    if (!open) return;
    didConfirmRef.current = false;
    trackAnalyticsEvent(buildAnalyticsEvent("voice_log_opened", "client", {}));

    try {
      const rawDraft = window.localStorage.getItem(VOICE_LOG_DRAFT_KEY);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft) as {
        transcript?: string;
        results?: VoiceResultItem[];
      };
      if (typeof draft.transcript === "string") setTranscript(draft.transcript);
      if (Array.isArray(draft.results)) setResults(draft.results);
      trackAnalyticsEvent(buildAnalyticsEvent("voice_log_draft_resumed", "client", {}));
    } catch {
      // no-op on corrupt draft
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    try {
      if (!transcript && results.length === 0) {
        if (didConfirmRef.current) {
          window.localStorage.removeItem(VOICE_LOG_DRAFT_KEY);
        }
        return;
      }
      window.localStorage.setItem(
        VOICE_LOG_DRAFT_KEY,
        JSON.stringify({ transcript, results })
      );
    } catch {
      // ignore storage failures
    }
  }, [open, transcript, results]);

  function resetState() {
    setIsRecording(false);
    setIsUploading(false);
    setTranscript("");
    setResults([]);
    setManualName("");
    setManualCategory("Fruits");
    setError(null);
    setApiWarnings([]);
    chunksRef.current = [];

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function handleClose() {
    if (!didConfirmRef.current && (isRecording || transcript.length > 0 || results.length > 0)) {
      trackAnalyticsEvent(
        buildAnalyticsEvent("voice_log_abandoned", "client", {
          had_transcript: transcript.length > 0,
          candidate_count: results.length,
        })
      );
    }
    resetState();
    onClose();
  }

  function handleDiscardDraft() {
    if (isUploading || isSubmitting) return;
    if (isRecording) {
      stopRecording();
    }

    trackAnalyticsEvent(
      buildAnalyticsEvent("voice_log_abandoned", "client", {
        had_transcript: transcript.length > 0,
        candidate_count: results.length,
        trigger: "discard_button",
      })
    );

    try {
      window.localStorage.removeItem(VOICE_LOG_DRAFT_KEY);
    } catch {
      // ignore storage failures
    }

    resetState();
  }

  async function submitAudio(blob: Blob) {
    setIsUploading(true);
    setError(null);
    setApiWarnings([]);

    try {
      let uploadBlob = blob;
      let format = mimeToFormat(blob.type || "");

      if (!isProviderCompatibleFormat(format)) {
        uploadBlob = await convertBlobToWav(blob);
        format = "wav";
      }

      const audioBase64 = await blobToBase64(uploadBlob);

      const res = await fetch("/api/voice-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          format,
          locale: typeof navigator !== "undefined" ? navigator.language : "en-US",
        }),
      });

      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as VoiceLogErrorResponse | null;
        throw new Error(errorBody?.error || "Voice transcription failed. Please try again.");
      }

      const data = (await res.json()) as VoiceLogResponse;
      const normalizedTranscript = typeof data.transcript === "string" ? data.transcript : "";
      const candidates = Array.isArray(data.candidates) ? data.candidates : [];
      const warnings = Array.isArray(data.warnings) ? data.warnings : [];

      const next = candidates.map((candidate) => {
        const normalizedName = normalizePlantName(candidate.name);
        const matched = resolvePlantMatch(normalizedName, plantsByLowerName);
        const category = matched?.category ?? "Vegetables";
        const points = matched?.points ?? (category === "Herbs" || category === "Spices" ? 0.25 : 1);
        const duplicate = isLoggedPlantName(matched?.name ?? normalizedName, loggedNameKeys);

        return {
          name: matched?.name ?? normalizedName,
          category,
          points,
          confidence: candidate.confidence,
          selected: !duplicate,
          duplicate,
        };
      });

      setTranscript(normalizedTranscript);
      setResults(next);
      setApiWarnings(warnings.map(formatVoiceWarning));
      trackAnalyticsEvent(
        buildAnalyticsEvent("voice_log_transcription_succeeded", "client", {
          transcript_length: normalizedTranscript.length,
        })
      );
      trackAnalyticsEvent(
        buildAnalyticsEvent(
          next.length > 0 ? "voice_log_parse_succeeded" : "voice_log_parse_failed",
          "client",
          { candidate_count: next.length }
        )
      );
      trackAnalyticsEvent(
        buildAnalyticsEvent("voice_log_review_shown", "client", { candidate_count: next.length })
      );
    } catch (e) {
      trackAnalyticsEvent(buildAnalyticsEvent("voice_log_transcription_failed", "client", {}));
      setError(e instanceof Error ? e.message : "Voice transcription failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const options: MediaRecorderOptions = {};
      const preferredMime = getPreferredRecorderMimeType();
      if (preferredMime) {
        options.mimeType = preferredMime;
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (blob.size === 0) {
          setError("No audio captured. Try again.");
          return;
        }
        await submitAudio(blob);
      };

      recorder.start();
      setIsRecording(true);
      trackAnalyticsEvent(buildAnalyticsEvent("voice_log_recording_started", "client", {}));
    } catch {
      setError("Microphone access is required for Voice Log.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    setIsRecording(false);
    trackAnalyticsEvent(buildAnalyticsEvent("voice_log_recording_stopped", "client", {}));
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
      return;
    }
    startRecording();
  }

  function toggleResult(index: number) {
    setResults((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const nextSelected = !item.selected;
        trackAnalyticsEvent(
          buildAnalyticsEvent(
            nextSelected ? "voice_log_item_checked" : "voice_log_item_unchecked",
            "client",
            { name: item.name }
          )
        );
        return { ...item, selected: nextSelected };
      })
    );
  }

  function addManualPlant() {
    const name = normalizePlantName(manualName);
    if (!name) return;

    const incomingKeys = new Set(getNameMatchKeys(name));
    const existingInResults = results.some((item) =>
      getNameMatchKeys(item.name).some((key) => incomingKeys.has(key))
    );
    if (existingInResults) {
      setError("That plant is already in the review list.");
      return;
    }

    const matched = resolvePlantMatch(name, plantsByLowerName);
    const resolvedName = matched?.name ?? name;
    const duplicate = isLoggedPlantName(matched?.name ?? resolvedName, loggedNameKeys);
    const category = matched?.category ?? manualCategory;
    const points = matched?.points ?? (category === "Herbs" || category === "Spices" ? 0.25 : 1);

    setResults((prev) => [
      ...prev,
      {
        name: resolvedName,
        category,
        points,
        selected: !duplicate,
        duplicate,
      },
    ]);
    setManualName("");
    setError(null);
    trackAnalyticsEvent(
      buildAnalyticsEvent("voice_log_item_added_manual", "client", { category })
    );
  }

  async function handleConfirm() {
    const selected = results.filter((r) => r.selected && !r.duplicate);
    if (selected.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onLogPlants(
        selected.map((r) => ({
          name: r.name,
          category: r.category,
          points: r.points,
          confidence: r.confidence,
        }))
      );
      didConfirmRef.current = true;
      trackAnalyticsEvent(
        buildAnalyticsEvent("voice_log_confirmed", "client", { selected_count: selected.length })
      );
      handleClose();
    } catch {
      setError("Could not save your voice log. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <SheetContent className="max-h-[85vh]">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="flex justify-center pt-2 pb-0">
            <div className="h-1 w-10 rounded-full bg-brand-dark/15" />
          </div>

          <div className="sticky top-safe z-10 flex items-center justify-between border-b border-brand-dark/10 bg-brand-cream p-5 pb-3">
            <SheetTitle className="text-lg font-bold text-brand-dark font-display">Voice Log</SheetTitle>
            <SheetClose asChild>
              <button
                type="button"
                data-haptic="selection"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-dark/40 hover:text-brand-dark hover:bg-brand-dark/5 transition-colors"
                aria-label="Close voice log sheet"
              >
                <X size={20} />
              </button>
            </SheetClose>
          </div>

          <div className="space-y-4 p-5">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isUploading}
              data-haptic="selection"
              className={getRecordingButtonClassName(isRecording, isUploading)}
            >
              <span className="inline-flex items-center gap-2">
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                {isRecording ? "Stop Recording" : "Start Recording"}
              </span>
            </button>

            {hasDraft && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                disabled={isUploading || isSubmitting}
                data-haptic="warning"
                className="w-full min-h-11 rounded-xl border border-brand-dark/15 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 size={16} />
                  Discard Draft
                </span>
              </button>
            )}

            {isUploading && (
              <div className="rounded-xl border border-brand-dark/10 bg-white/80 p-3 text-sm text-brand-muted flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-brand-green" />
                Transcribing and extracting plants...
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {transcript && (
              <div className="rounded-xl border border-brand-dark/10 bg-white p-3">
                <p className="text-[11px] uppercase tracking-wide text-brand-muted mb-1">Transcript</p>
                <p className="text-sm text-brand-dark whitespace-pre-wrap">{transcript}</p>
              </div>
            )}

            {apiWarnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-amber-800 mb-1">Warnings</p>
                <ul className="space-y-1 text-sm text-amber-900">
                  {apiWarnings.map((warning, idx) => (
                    <li key={`${warning}-${idx}`}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.length > 0 && (
              <>
                <p className="text-sm font-semibold text-brand-dark">Review & select plants</p>
                <div className="space-y-2">
                  {results.map((item, idx) => {
                    const lowConfidence = typeof item.confidence === "number" && item.confidence < 0.9;
                    return (
                      <button
                        key={`${item.name}-${idx}`}
                        onClick={() => !item.duplicate && toggleResult(idx)}
                        disabled={item.duplicate}
                        data-haptic="selection"
                        className={getResultRowClassName(item)}
                      >
                        <div className={getResultCheckClassName(item)}>

                          {(item.selected || item.duplicate) && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-brand-dark">{item.name}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-brand-muted">
                            <span>{item.category}</span>
                            <span>·</span>
                            <span>{item.points === 0.25 ? "¼pt" : `${item.points}pt`}</span>
                            {lowConfidence && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 border border-amber-200">
                                Low confidence
                              </span>
                            )}
                            {item.duplicate && (
                              <span className="rounded-full bg-brand-dark/5 px-2 py-0.5 border border-brand-dark/10">
                                Already logged
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="rounded-xl border border-brand-dark/10 bg-white p-3">
              <p className="text-sm font-semibold text-brand-dark mb-2">Add missing plant</p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Plant name"
                  className="w-full rounded-xl bg-brand-cream px-3 py-2 text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full rounded-xl bg-brand-cream px-3 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  {CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addManualPlant}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-dark/5 px-3 py-2 text-sm font-medium text-brand-dark hover:bg-brand-dark/10"
                >
                  <Plus size={14} /> Add plant
                </button>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0 || isSubmitting}
              className={getConfirmButtonClassName(selectedCount, isSubmitting)}
            >
              {getConfirmButtonLabel(selectedCount, isSubmitting)}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
