import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalFormComponent } from './modal-form.component';
import { Component } from '@angular/core';

@Component({
  template: `<app-modal-form [title]="'Test Modal'" (close)="onClose()" />`,
  imports: [ModalFormComponent],
})
class TestHostComponent {
  closed = false;
  onClose(): void {
    this.closed = true;
  }
}

describe('ModalFormComponent', () => {
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

  function getComponent(): ModalFormComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    expect(getComponent()).toBeTruthy();
  });

  it('should emit close on overlay click', () => {
    getComponent().onOverlayClick();
    expect(host.closed).toBeTrue();
  });

  it('should emit close on close click', () => {
    getComponent().onCloseClick();
    expect(host.closed).toBeTrue();
  });

  it('should stop propagation', () => {
    const event = jasmine.createSpyObj('Event', ['stopPropagation']);
    getComponent().stopPropagation(event);
    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
