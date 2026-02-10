import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { QuantitySelectorComponent } from './quantity-selector.component';

@Component({
  template: `<app-quantity-selector
    [quantity]="qty()"
    [maxStock]="maxStock"
    (increaseClick)="onIncrease()"
    (decreaseClick)="onDecrease()"
  />`,
  imports: [QuantitySelectorComponent],
})
class TestHostComponent {
  qty = signal(3);
  maxStock: number | undefined = undefined;
  increased = false;
  decreased = false;
  onIncrease(): void {
    this.increased = true;
  }
  onDecrease(): void {
    this.decreased = true;
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

  it('should display quantity from input', () => {
    expect(getSelector().quantity()).toBe(3);
  });

  it('should emit increaseClick when increase is called', () => {
    getSelector()['increase']();
    expect(host.increased).toBeTrue();
  });

  it('should emit decreaseClick when decrease is called', () => {
    getSelector()['decrease']();
    expect(host.decreased).toBeTrue();
  });

  it('should not emit decreaseClick when quantity is 1', () => {
    host.qty.set(1);
    fixture.detectChanges();

    getSelector()['decrease']();
    expect(host.decreased).toBeFalse();
  });

  it('should not emit increaseClick when at maxStock', () => {
    host.maxStock = 3;
    host.qty.set(3);
    fixture.detectChanges();

    getSelector()['increase']();
    expect(host.increased).toBeFalse();
  });

  it('should emit increaseClick when maxStock is undefined', () => {
    host.qty.set(100);
    fixture.detectChanges();

    getSelector()['increase']();
    expect(host.increased).toBeTrue();
  });
});
