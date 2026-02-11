import { LoadingOverlayService } from './loading-overlay.service';
import { fakeAsync, tick } from '@angular/core/testing';

describe('LoadingOverlayService', () => {
  let service: LoadingOverlayService;

  beforeEach(() => {
    service = new LoadingOverlayService();
  });

  afterEach(() => {
    service.reset();
  });

  it('should start as not visible', () => {
    expect(service.state().visible).toBe(false);
    expect(service.state().message).toBe('');
  });

  it('should become visible after show delay', fakeAsync(() => {
    service.show('Loading...');
    expect(service.state().visible).toBe(false);

    tick(300); // SHOW_DELAY_MS
    expect(service.state().visible).toBe(true);
    expect(service.state().message).toBe('Loading...');

    service.hide();
    tick(500); // MIN_DISPLAY_MS
  }));

  it('should not show if hidden before delay', fakeAsync(() => {
    service.show('Loading...');
    service.hide();
    tick(300);
    expect(service.state().visible).toBe(false);
  }));

  it('should handle ref counting for multiple shows/hides', fakeAsync(() => {
    service.show('A');
    service.show('B');
    tick(300);
    expect(service.state().visible).toBe(true);

    service.hide(); // refCount = 1
    tick(500);
    expect(service.state().visible).toBe(true);

    service.hide(); // refCount = 0
    tick(500);
    expect(service.state().visible).toBe(false);
  }));

  it('should reset to initial state', fakeAsync(() => {
    service.show('Loading...');
    tick(300);
    service.reset();
    expect(service.state().visible).toBe(false);
    expect(service.state().message).toBe('');
  }));

  it('should show extended message after 3 seconds', fakeAsync(() => {
    service.show('Loading data');
    tick(300); // SHOW_DELAY_MS
    expect(service.state().message).toBe('Loading data');

    tick(3000); // EXTENDED_MESSAGE_DELAY_MS
    expect(service.state().message).toContain('server may be waking up');

    service.hide();
    tick(500);
  }));
});
