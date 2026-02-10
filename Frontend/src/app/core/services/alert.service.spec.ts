import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlertService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call window.alert with the provided message', () => {
    spyOn(window, 'alert');

    service.show('Test message');

    expect(window.alert).toHaveBeenCalledWith('Test message');
  });
});
