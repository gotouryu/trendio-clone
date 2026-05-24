export const EXTERNAL_API_TIMEOUT_MS = 10000;
export const AI_API_TIMEOUT_MS = 30000;

export function timeoutSignal(ms = EXTERNAL_API_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(ms);
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
