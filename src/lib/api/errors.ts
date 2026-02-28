import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "RECOGNIZE_API_KEY_MISSING"
  | "RECOGNIZE_PAYLOAD_TOO_LARGE"
  | "RECOGNIZE_INVALID_JSON"
  | "RECOGNIZE_INVALID_BODY"
  | "RECOGNIZE_IMAGE_MISSING"
  | "RECOGNIZE_IMAGE_INVALID"
  | "RECOGNIZE_TIMEOUT"
  | "RECOGNIZE_PROVIDER_FAILURE"
  | "RECOGNIZE_INTERNAL_ERROR"
  | "SAGE_INVALID_JSON"
  | "SAGE_INVALID_BODY"
  | "SAGE_QUESTION_INVALID"
  | "SAGE_CONTEXT_INVALID"
  | "SAGE_REQUEST_LIMIT"
  | "SAGE_MODEL_NOT_CONFIGURED"
  | "SAGE_TIMEOUT"
  | "SAGE_PROVIDER_FAILURE"
  | "SAGE_INTERNAL_ERROR"
  | "AUTH_UNAUTHORIZED";

export function apiError(status: number, code: ApiErrorCode, error: string) {
  return NextResponse.json({ error, code }, { status });
}
