import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  let fixture: ComponentFixture<SearchComponent>;
  let component: SearchComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty search term initially', () => {
    expect(component.searchTerm()).toBe('');
  });

  it('should update searchTerm on onInput', () => {
    const event = { target: { value: 'test query' } } as unknown as Event;
    component.onInput(event);
    expect(component.searchTerm()).toBe('test query');
  });

  it('should emit trimmed search term on onSearch', () => {
    let emitted = '';
    component.searchSubmitted.subscribe((term: string) => (emitted = term));

    component.searchTerm.set('  hello world  ');
    component.onSearch();
    expect(emitted).toBe('hello world');
  });

  it('should not emit when search term is empty', () => {
    let emitted = false;
    component.searchSubmitted.subscribe(() => (emitted = true));

    component.searchTerm.set('   ');
    component.onSearch();
    expect(emitted).toBeFalse();
  });
});
