import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DropdownComponent, DropdownOption } from './dropdown.component';
import { Component, signal } from '@angular/core';

@Component({
  template: `<app-dropdown
    [options]="options"
    [selectedValue]="selected()"
    (selectionChange)="onSelect($event)"
  />`,
  imports: [DropdownComponent],
})
class TestHostComponent {
  options: DropdownOption[] = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];
  selected = signal('a');
  lastSelected = '';
  onSelect(value: string): void {
    this.lastSelected = value;
  }
}

describe('DropdownComponent', () => {
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

  function getDropdown(): DropdownComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    expect(getDropdown()).toBeTruthy();
  });

  it('should compute displayLabel from selected value', () => {
    expect(getDropdown()['displayLabel']()).toBe('Option A');
  });

  it('should fall back to placeholder when no match', () => {
    host.selected.set('nonexistent');
    fixture.detectChanges();
    expect(getDropdown()['displayLabel']()).toBe('Select an option');
  });

  it('should toggle dropdown open/closed', () => {
    const dropdown = getDropdown();
    expect(dropdown['isOpen']()).toBeFalse();
    dropdown.toggleDropdown();
    expect(dropdown['isOpen']()).toBeTrue();
    dropdown.toggleDropdown();
    expect(dropdown['isOpen']()).toBeFalse();
  });

  it('should emit value and close on selectOption', () => {
    const dropdown = getDropdown();
    dropdown.toggleDropdown();
    dropdown.selectOption({ value: 'b', label: 'Option B' });
    expect(host.lastSelected).toBe('b');
    expect(dropdown['isOpen']()).toBeFalse();
  });

  it('should close when clicking outside', () => {
    const dropdown = getDropdown();
    dropdown.toggleDropdown();
    expect(dropdown['isOpen']()).toBeTrue();

    dropdown.onDocumentClick({ target: document.body } as unknown as Event);
    expect(dropdown['isOpen']()).toBeFalse();
  });
});
