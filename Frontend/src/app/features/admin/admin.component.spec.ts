import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComponent } from './admin.component';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminComponent],
    }).overrideComponent(AdminComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to products tab', () => {
    expect(component.activeTab()).toBe('products');
  });

  it('should switch to categories tab', () => {
    component.setActiveTab('categories');
    expect(component.activeTab()).toBe('categories');
  });

  it('should switch to carousel tab', () => {
    component.setActiveTab('carousel');
    expect(component.activeTab()).toBe('carousel');
  });

  it('should switch back to products tab', () => {
    component.setActiveTab('carousel');
    component.setActiveTab('products');
    expect(component.activeTab()).toBe('products');
  });
});
