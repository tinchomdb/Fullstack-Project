import { HttpParams } from '@angular/common/http';

/**
 * Builds an HttpParams instance from a record, filtering out null and undefined values.
 * Non-string values are converted to strings automatically.
 */
export function buildHttpParams(
  params: Record<string, string | number | boolean | undefined | null>,
): HttpParams {
  let httpParams = new HttpParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      httpParams = httpParams.set(key, String(value));
    }
  }

  return httpParams;
}
