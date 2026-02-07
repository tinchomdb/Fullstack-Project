import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field.component';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Component, signal } from '@angular/core';

@Component({
  template: `<app-form-field [control]="ctrl" [label]="'Name'" [id]="'name'" />`,
  imports: [FormFieldComponent],
})
class TestHostComponent {
  ctrl = new FormControl('', Validators.required);
}

describe('FormFieldComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getComponent(): FormFieldComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    expect(getComponent()).toBeTruthy();
  });

  it('should not show error when untouched', () => {
    expect(getComponent().showError).toBeFalse();
  });

  it('should show error when invalid and touched', () => {
    host.ctrl.markAsTouched();
    expect(getComponent().showError).toBeTrue();
    expect(getComponent().hasError).toBeTrue();
  });

  it('should not show error when valid and touched', () => {
    host.ctrl.setValue('John');
    host.ctrl.markAsTouched();
    expect(getComponent().showError).toBeFalse();
  });
});
