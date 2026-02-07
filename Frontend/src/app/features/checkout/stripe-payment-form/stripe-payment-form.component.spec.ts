import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { StripePaymentFormComponent } from './stripe-payment-form.component';
import { StripeService } from '../../../core/services/stripe.service';

describe('StripePaymentFormComponent', () => {
  let component: StripePaymentFormComponent;
  let fixture: ComponentFixture<StripePaymentFormComponent>;
  let stripeService: jasmine.SpyObj<StripeService>;

  beforeEach(() => {
    stripeService = jasmine.createSpyObj(
      'StripeService',
      ['mountPaymentElement', 'unmountPaymentElement'],
      {
        clientSecret: signal<string | null>(null),
        isMounted: signal(false),
        isReady: signal(false),
        isFormComplete: signal(false),
        isInitializing: signal(false),
      },
    );

    TestBed.configureTestingModule({
      imports: [StripePaymentFormComponent],
      providers: [{ provide: StripeService, useValue: stripeService }],
    }).overrideComponent(StripePaymentFormComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(StripePaymentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should unmount payment element on destroy', () => {
    component.ngOnDestroy();
    expect(stripeService.unmountPaymentElement).toHaveBeenCalled();
  });

  it('should expose stripe service', () => {
    expect((component as any).stripe).toBe(stripeService);
  });
});
