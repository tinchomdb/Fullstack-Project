import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SortDropdownComponent } from './sort-dropdown.component';
import { FiltersService } from '../../../core/services/filters.service';
import { DEFAULT_SORT_OPTION, SORT_OPTIONS } from '../../../core/models/sort-option.model';

describe('SortDropdownComponent', () => {
  let fixture: ComponentFixture<SortDropdownComponent>;
  let component: SortDropdownComponent;
  let filtersSpy: jasmine.SpyObj<FiltersService>;

  beforeEach(async () => {
    filtersSpy = jasmine.createSpyObj('FiltersService', ['setSortOption'], {
      currentSortOption: signal(DEFAULT_SORT_OPTION),
    });

    await TestBed.configureTestingModule({
      imports: [SortDropdownComponent],
      providers: [{ provide: FiltersService, useValue: filtersSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SortDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should map sort options to dropdown options', () => {
    expect(component['sortOptions'].length).toBe(SORT_OPTIONS.length);
  });

  it('should compute currentSortValue', () => {
    expect(component['currentSortValue']()).toBe(DEFAULT_SORT_OPTION.value);
  });

  it('should call setSortOption on valid sort change', () => {
    const option = SORT_OPTIONS[1];
    component.onSortChange(option.value);
    expect(filtersSpy.setSortOption).toHaveBeenCalledWith(option);
  });

  it('should not call setSortOption for invalid value', () => {
    component.onSortChange('nonexistent');
    expect(filtersSpy.setSortOption).not.toHaveBeenCalled();
  });
});
