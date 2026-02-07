import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { QuantitySelectorComponent } from './quantity-selector.component';

@Component({
  template: `<app-quantity-selector
    [quantity]="qty()"
    [maxStock]="maxStock"
    (quantityChange)="onQtyChange($event)"
  />`,
  imports: [QuantitySelectorComponent],
})
class TestHostComponent {
  qty = signal(3);
  maxStock: number | undefined = undefined;
  lastQty = 0;
  onQtyChange(q: number): void {
    this.lastQty = q;
  }
}

describe('QuantitySelectorComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getSelector(): QuantitySelectorComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    expect(getSelector()).toBeTruthy();
  });

  it('should sync currentQuantity from input via effect', () => {
    TestBed.flushEffects();
    expect(getSelector()['currentQuantity']()).toBe(3);
  });

  it('should increase quantity', () => {
    TestBed.flushEffects();
    getSelector()['increase']();
    expect(getSelector()['currentQuantity']()).toBe(4);
    expect(host.lastQty).toBe(4);
  });

  it('should decrease quantity', () => {
    TestBed.flushEffects();
    getSelector()['decrease']();
    expect(getSelector()['currentQuantity']()).toBe(2);
    expect(host.lastQty).toBe(2);
  });

  it('should not decrease below 1', () => {
    host.qty.set(1);
    fixture.detectChanges();
    TestBed.flushEffects();

    getSelector()['decrease']();
    expect(getSelector()['currentQuantity']()).toBe(1);
  });

  it('should not increase beyond maxStock', () => {
    host.maxStock = 3;
    host.qty.set(3);
    fixture.detectChanges();
    TestBed.flushEffects();

    getSelector()['increase']();
    expect(getSelector()['currentQuantity']()).toBe(3);
  });

  it('should allow increase when maxStock is undefined', () => {
    host.qty.set(100);
    fixture.detectChanges();
    TestBed.flushEffects();

    getSelector()['increase']();
    expect(getSelector()['currentQuantity']()).toBe(101);
  });
});
