import { Injectable, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const BREAKPOINT = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
} as const;

@Injectable({
  providedIn: 'root',
})
export class BreakpointService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly breakpointMap = {
    xs: '(max-width: 639px)',
    sm: '(min-width: 640px) and (max-width: 767px)',
    md: '(min-width: 768px) and (max-width: 1023px)',
    lg: '(min-width: 1024px) and (max-width: 1279px)',
    xl: '(min-width: 1280px)',
  };

  readonly current = toSignal(
    this.breakpointObserver
      .observe([
        this.breakpointMap.xs,
        this.breakpointMap.sm,
        this.breakpointMap.md,
        this.breakpointMap.lg,
        this.breakpointMap.xl,
      ])
      .pipe(
        map((result) => {
          if (result.breakpoints[this.breakpointMap.xl]) return 'xl';
          if (result.breakpoints[this.breakpointMap.lg]) return 'lg';
          if (result.breakpoints[this.breakpointMap.md]) return 'md';
          if (result.breakpoints[this.breakpointMap.sm]) return 'sm';
          return 'xs';
        }),
      ),
    { initialValue: 'xs' as BreakpointSize },
  );
}
