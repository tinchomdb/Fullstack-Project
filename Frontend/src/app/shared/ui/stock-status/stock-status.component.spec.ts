import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockStatusComponent } from './stock-status.component';
import { Component, signal } from '@angular/core';

@Component({
  template: `<app-stock-status [stock]="stock()" />`,
  imports: [StockStatusComponent],
})
class TestHostComponent {
  stock = signal<number | undefined>(undefined);
}

describe('StockStatusComponent', () => {
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

  function getComponent(): StockStatusComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    expect(getComponent()).toBeTruthy();
  });

  it('should return inStock=true when stock is undefined', () => {
    expect(getComponent()['inStock']()).toBeTrue();
  });

  it('should return statusType=in-stock when stock is undefined', () => {
    expect(getComponent()['statusType']()).toBe('in-stock');
  });

  it('should return statusText=In Stock when stock is undefined', () => {
    expect(getComponent()['statusText']()).toBe('In Stock');
  });

  it('should return out-of-stock when stock is 0', () => {
    host.stock.set(0);
    fixture.detectChanges();
    expect(getComponent()['inStock']()).toBeFalse();
    expect(getComponent()['statusType']()).toBe('out-of-stock');
    expect(getComponent()['statusText']()).toBe('Out of Stock');
  });

  it('should return low-stock when stock is between 1 and 9', () => {
    host.stock.set(5);
    fixture.detectChanges();
    expect(getComponent()['inStock']()).toBeTrue();
    expect(getComponent()['statusType']()).toBe('low-stock');
    expect(getComponent()['statusText']()).toBe('Only 5 left in stock');
  });

  it('should return in-stock when stock is > 10', () => {
    host.stock.set(50);
    fixture.detectChanges();
    expect(getComponent()['statusType']()).toBe('in-stock');
    expect(getComponent()['statusText']()).toBe('In Stock');
  });

  it('should return low-stock when stock is exactly 1', () => {
    host.stock.set(1);
    fixture.detectChanges();
    expect(getComponent()['statusType']()).toBe('low-stock');
    expect(getComponent()['statusText']()).toBe('Only 1 left in stock');
  });
});
