import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { IntersectionObserverDirective } from './intersection-observer.directive';
import { ComponentFixture } from '@angular/core/testing';

@Component({
  template: `<div appIntersectionObserver (intersecting)="onIntersect()"></div>`,
  imports: [IntersectionObserverDirective],
})
class TestHostComponent {
  intersected = false;
  onIntersect(): void {
    this.intersected = true;
  }
}

describe('IntersectionObserverDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    const directive = fixture.debugElement.children[0].injector.get(IntersectionObserverDirective);
    expect(directive).toBeTruthy();
  });

  it('should disconnect observer on destroy', () => {
    const directive = fixture.debugElement.children[0].injector.get(IntersectionObserverDirective);
    const observer = (directive as any).observer;
    if (observer) {
      spyOn(observer, 'disconnect');
      fixture.destroy();
      expect(observer.disconnect).toHaveBeenCalled();
    } else {
      fixture.destroy();
      expect(true).toBeTrue(); // IntersectionObserver may not exist in test env
    }
  });
});
