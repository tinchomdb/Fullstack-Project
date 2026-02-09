import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { SortDropdownComponent } from './sort-dropdown.component';
import { DropdownOption } from '../dropdown/dropdown.component';

const mockOptions: DropdownOption[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

@Component({
  template: `<app-sort-dropdown
    [currentValue]="currentValue"
    [options]="options"
    (sortChange)="lastEmitted = $event"
  />`,
  imports: [SortDropdownComponent],
})
class TestHostComponent {
  currentValue = 'newest';
  options = mockOptions;
  lastEmitted: string | null = null;
}

describe('SortDropdownComponent', () => {
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

  function getComponent(): SortDropdownComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    expect(getComponent()).toBeTruthy();
  });

  it('should receive options via input', () => {
    expect(getComponent().options()).toEqual(mockOptions);
  });

  it('should receive currentValue via input', () => {
    expect(getComponent().currentValue()).toBe('newest');
  });

  it('should emit sortChange on sort change', () => {
    getComponent().onSortChange('price-asc');
    expect(host.lastEmitted).toBe('price-asc');
  });

  it('should reflect updated currentValue', () => {
    host.currentValue = 'price-desc';
    fixture.detectChanges();
    expect(getComponent().currentValue()).toBe('price-desc');
  });
});
