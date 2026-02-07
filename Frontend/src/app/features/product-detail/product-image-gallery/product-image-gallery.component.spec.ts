import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductImageGalleryComponent } from './product-image-gallery.component';

describe('ProductImageGalleryComponent', () => {
  let component: ProductImageGalleryComponent;
  let fixture: ComponentFixture<ProductImageGalleryComponent>;

  const testImages = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductImageGalleryComponent],
    }).overrideComponent(ProductImageGalleryComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(ProductImageGalleryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('images', testImages);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with selectedIndex 0', () => {
    expect((component as any).selectedIndex()).toBe(0);
  });

  it('should select an image by index', () => {
    (component as any).selectImage(2);
    expect((component as any).selectedIndex()).toBe(2);
  });

  it('should return current image based on selectedIndex', () => {
    expect((component as any).currentImage()).toBe('img1.jpg');

    (component as any).selectImage(1);
    expect((component as any).currentImage()).toBe('img2.jpg');
  });

  it('should fall back to first image if selectedIndex is out of bounds', () => {
    (component as any).selectImage(99);
    expect((component as any).currentImage()).toBe('img1.jpg');
  });

  it('should return empty string when images array is empty', () => {
    fixture.componentRef.setInput('images', []);
    fixture.detectChanges();
    expect((component as any).currentImage()).toBe('');
  });

  it('should use default altText', () => {
    expect(component.altText()).toBe('Product image');
  });

  it('should accept custom altText', () => {
    fixture.componentRef.setInput('altText', 'Custom alt');
    fixture.detectChanges();
    expect(component.altText()).toBe('Custom alt');
  });
});
