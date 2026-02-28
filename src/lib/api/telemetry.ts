type RequestSizeBucket = "unknown" | "<=256kb" | "256kb-1mb" | "1mb-5mb" | ">5mb";

type ApiTelemetryEvent = {
  endpoint: string;
  status_code: number;
  latency_ms: number;
  timeout: boolean;
  fallback_used: boolean;
  parse_failed: boolean;
  request_size_bucket: RequestSizeBucket;
};

function toRequestSizeBucket(bytes: number | null): RequestSizeBucket {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0) return "unknown";
  if (bytes <= 256 * 1024) return "<=256kb";
  if (bytes <= 1024 * 1024) return "256kb-1mb";
  if (bytes <= 5 * 1024 * 1024) return "1mb-5mb";
  return ">5mb";
}

export function createApiTelemetry(endpoint: string, requestSizeBytes: number | null) {
  const startedAt = Date.now();
  const request_size_bucket = toRequestSizeBucket(requestSizeBytes);

  return (params: {
    statusCode: number;
    timeout?: boolean;
    fallbackUsed?: boolean;
    parseFailed?: boolean;
  }) => {
    const event: ApiTelemetryEvent = {
      endpoint,
      status_code: params.statusCode,
      latency_ms: Date.now() - startedAt,
      timeout: !!params.timeout,
      fallback_used: !!params.fallbackUsed,
      parse_failed: !!params.parseFailed,
      request_size_bucket,
    };

    console.info("api_telemetry", event);
  };
}
