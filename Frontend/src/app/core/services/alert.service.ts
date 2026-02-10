import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AlertService {
  show(message: string): void {
    window.alert(message);
  }
}
