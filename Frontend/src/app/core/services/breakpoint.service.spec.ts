import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { BreakpointService } from './breakpoint.service';
import { of } from 'rxjs';

describe('BreakpointService', () => {
  it('should default to xs', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BreakpointObserver,
          useValue: {
            observe: () =>
              of({
                matches: false,
                breakpoints: {},
              } as BreakpointState),
          },
        },
      ],
    });
    const service = TestBed.inject(BreakpointService);
    expect(service.current()).toBe('xs');
  });

  it('should detect xl breakpoint', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BreakpointObserver,
          useValue: {
            observe: () =>
              of({
                matches: true,
                breakpoints: { '(min-width: 1280px)': true },
              } as BreakpointState),
          },
        },
      ],
    });
    const service = TestBed.inject(BreakpointService);
    expect(service.current()).toBe('xl');
  });
});
