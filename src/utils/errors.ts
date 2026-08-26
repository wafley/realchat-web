function extractResponseMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response: { data?: Record<string, unknown> } }).response?.data;
    if (data) {
      if (typeof data.message === 'string' && data.message) return data.message;
      if (typeof data.error === 'string' && data.error) return data.error;
      if (Array.isArray(data.message)) return (data.message as string[]).join(', ');
      if (data.errors && typeof data.errors === 'object') {
        const errors = data.errors as Record<string, string[]>;
        const flat = Object.values(errors).flat().filter(Boolean);
        if (flat.length > 0) return flat.join(', ');
      }
    }
  }
  return '';
}

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const fromResponse = extractResponseMessage(err);
  if (fromResponse) return fromResponse;
  if (err instanceof Error && err.message && !/status code/i.test(err.message)) return err.message;
  return fallback;
}

export function getStatusText(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const status = (err as { response: { status?: number } }).response?.status;
    switch (status) {
      case 400:
        return 'Invalid request. Check your input and try again.';
      case 404:
        return 'Resource not found. It may have been removed.';
      case 409:
        return 'This action conflicts with the current state.';
      case 413:
        return 'File is too large.';
      default:
        return '';
    }
  }
  return '';
}

export function toError(err: unknown, fallback: string): Error {
  const fromResponse = extractResponseMessage(err);
  if (fromResponse) return new Error(fromResponse);
  if (err instanceof Error && err.message && !/status code/i.test(err.message)) return err;
  return new Error(getStatusText(err) || fallback);
}