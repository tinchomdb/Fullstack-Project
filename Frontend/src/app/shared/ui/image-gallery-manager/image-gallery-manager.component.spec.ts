import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ImageGalleryManagerComponent } from './image-gallery-manager.component';
import { ComponentFixture } from '@angular/core/testing';

const IMG1 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const IMG2 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
const IMG3 = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

@Component({
  template: `<app-image-gallery-manager
    [images]="images()"
    (imagesChange)="onImagesChange($event)"
  />`,
  imports: [ImageGalleryManagerComponent],
})
class TestHostComponent {
  images = signal<readonly string[]>([IMG1, IMG2, IMG3]);
  changedImages: string[] = [];
  onImagesChange(images: string[]): void {
    this.changedImages = images;
  }
}

describe('ImageGalleryManagerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.flushEffects();
  });

  function getComponent(): ImageGalleryManagerComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    expect(getComponent()).toBeTruthy();
  });

  it('should sync imageList from images input', () => {
    expect(getComponent().imageList()).toEqual([IMG1, IMG2, IMG3]);
  });

  it('should compute hasImages', () => {
    expect(getComponent().hasImages()).toBeTrue();
  });

  it('should compute canAddImage based on newImageUrl', () => {
    expect(getComponent().canAddImage()).toBeFalse();
    getComponent().newImageUrl.set('http://example.com/img.jpg');
    expect(getComponent().canAddImage()).toBeTrue();
  });

  it('should add image and clear newImageUrl', () => {
    getComponent().newImageUrl.set('  http://new.jpg  ');
    getComponent().addImage();

    expect(getComponent().imageList()).toContain('http://new.jpg');
    expect(getComponent().newImageUrl()).toBe('');
    expect(host.changedImages).toContain('http://new.jpg');
  });

  it('should not add empty image', () => {
    getComponent().newImageUrl.set('   ');
    getComponent().addImage();
    expect(getComponent().imageList().length).toBe(3);
  });

  it('should remove image by index', () => {
    getComponent().removeImage(1);
    expect(getComponent().imageList()).toEqual([IMG1, IMG3]);
    expect(host.changedImages).toEqual([IMG1, IMG3]);
  });

  it('should clear selectedImageIndex when removing selected', () => {
    getComponent().selectImage(1);
    expect(getComponent().selectedImageIndex()).toBe(1);

    getComponent().removeImage(1);
    expect(getComponent().selectedImageIndex()).toBeNull();
  });

  it('should adjust selectedImageIndex when removing before it', () => {
    getComponent().selectImage(2);
    getComponent().removeImage(0);
    expect(getComponent().selectedImageIndex()).toBe(1);
  });

  it('should toggle selection', () => {
    getComponent().selectImage(1);
    expect(getComponent().selectedImageIndex()).toBe(1);

    getComponent().selectImage(1);
    expect(getComponent().selectedImageIndex()).toBeNull();
  });

  it('should compute selectedImage', () => {
    expect(getComponent().selectedImage()).toBeNull();

    getComponent().selectImage(0);
    expect(getComponent().selectedImage()).toBe(IMG1);
  });

  it('should move image up', () => {
    getComponent().moveUp(1);
    expect(getComponent().imageList()).toEqual([IMG2, IMG1, IMG3]);
  });

  it('should not move first image up', () => {
    getComponent().moveUp(0);
    expect(getComponent().imageList()).toEqual([IMG1, IMG2, IMG3]);
  });

  it('should move image down', () => {
    getComponent().moveDown(0);
    expect(getComponent().imageList()).toEqual([IMG2, IMG1, IMG3]);
  });

  it('should not move last image down', () => {
    getComponent().moveDown(2);
    expect(getComponent().imageList()).toEqual([IMG1, IMG2, IMG3]);
  });

  it('should update selectedIndex when moving selected image up', () => {
    getComponent().selectImage(1);
    getComponent().moveUp(1);
    expect(getComponent().selectedImageIndex()).toBe(0);
  });

  it('should update selectedIndex when moving selected image down', () => {
    getComponent().selectImage(1);
    getComponent().moveDown(1);
    expect(getComponent().selectedImageIndex()).toBe(2);
  });

  it('should clear all images with confirm', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    getComponent().clearAllImages();
    expect(getComponent().imageList()).toEqual([]);
    expect(getComponent().selectedImageIndex()).toBeNull();
  });

  it('should not clear images when confirm is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    getComponent().clearAllImages();
    expect(getComponent().imageList().length).toBe(3);
  });
});
