import { Injectable, signal } from '@angular/core';

interface LoadingState {
  visible: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoadingOverlayService {
  private refCount = 0;
  private showTimeoutId: number | null = null;
  private hideTimeoutId: number | null = null;
  private shownAt: number | null = null;

  private readonly SHOW_DELAY_MS = 300;
  private readonly MIN_DISPLAY_MS = 500;

  private state = signal<LoadingState>({
    visible: false,
    message: '',
  });

  readonly visible = this.state.asReadonly();

  show(message = 'Loading...'): void {
    this.refCount++;

    // Update message (last one wins)
    this.state.update((state) => ({ ...state, message }));

    // Cancel any pending hide
    if (this.hideTimeoutId !== null) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }

    // If already visible, just update message
    if (this.state().visible) {
      return;
    }

    // If no pending show, schedule one
    if (this.showTimeoutId === null) {
      this.showTimeoutId = window.setTimeout(() => {
        this.showTimeoutId = null;
        if (this.refCount > 0) {
          this.state.update((state) => ({ ...state, visible: true }));
          this.shownAt = Date.now();
        }
      }, this.SHOW_DELAY_MS);
    }
  }

  hide(): void {
    if (this.refCount > 0) {
      this.refCount--;
    }

    // Still have active requests
    if (this.refCount > 0) {
      return;
    }

    // Cancel pending show if we haven't shown yet
    if (this.showTimeoutId !== null) {
      clearTimeout(this.showTimeoutId);
      this.showTimeoutId = null;
      return;
    }

    // Not visible, nothing to hide
    if (!this.state().visible) {
      return;
    }

    // Calculate how long we've been visible
    const elapsed = this.shownAt ? Date.now() - this.shownAt : this.MIN_DISPLAY_MS;
    const remaining = Math.max(0, this.MIN_DISPLAY_MS - elapsed);

    // Hide after minimum display time
    this.hideTimeoutId = window.setTimeout(() => {
      this.hideTimeoutId = null;
      this.shownAt = null;
      this.state.update((state) => ({ ...state, visible: false }));
    }, remaining);
  }

  reset(): void {
    if (this.showTimeoutId !== null) {
      clearTimeout(this.showTimeoutId);
      this.showTimeoutId = null;
    }
    if (this.hideTimeoutId !== null) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }
    this.refCount = 0;
    this.shownAt = null;
    this.state.set({ visible: false, message: '' });
  }
}
