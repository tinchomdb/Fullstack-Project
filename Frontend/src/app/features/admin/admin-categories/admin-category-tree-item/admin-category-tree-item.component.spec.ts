import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminCategoryTreeItemComponent } from './admin-category-tree-item.component';
import { CategoryTreeNode } from '../../../../core/services/categories.service';

describe('AdminCategoryTreeItemComponent', () => {
  let component: AdminCategoryTreeItemComponent;
  let fixture: ComponentFixture<AdminCategoryTreeItemComponent>;

  const rootNode: CategoryTreeNode = {
    category: {
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
      featured: true,
      subcategoryIds: ['cat-2'],
      type: 'Category',
    },
    children: [
      {
        category: {
          id: 'cat-2',
          name: 'Phones',
          slug: 'phones',
          parentCategoryId: 'cat-1',
          subcategoryIds: [],
          type: 'Category',
        },
        children: [],
        level: 1,
      },
    ],
    level: 0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminCategoryTreeItemComponent],
    }).overrideComponent(AdminCategoryTreeItemComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(AdminCategoryTreeItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('node', rootNode);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('badges computed', () => {
    it('should include Featured badge when category is featured', () => {
      const badges = component.badges();
      expect(badges.some((b) => b.label === '⭐ Featured')).toBeTrue();
    });

    it('should include Root badge at level 0', () => {
      const badges = component.badges();
      expect(badges.some((b) => b.label === 'Root' && b.variant === 'info')).toBeTrue();
    });

    it('should include Level badge at level > 0', () => {
      const childNode: CategoryTreeNode = {
        ...rootNode,
        category: { ...rootNode.category, featured: false },
        level: 2,
      };
      fixture.componentRef.setInput('node', childNode);
      fixture.detectChanges();
      const badges = component.badges();
      expect(badges.some((b) => b.label === 'Level 2' && b.variant === 'warning')).toBeTrue();
      expect(badges.some((b) => b.label === 'Root')).toBeFalse();
    });
  });

  describe('metadata computed', () => {
    it('should include Subcategories count when children exist', () => {
      const meta = component.metadata();
      expect(meta.some((m) => m.label === 'Subcategories' && m.value === '1')).toBeTrue();
    });

    it('should not include Subcategories when no children', () => {
      const leafNode: CategoryTreeNode = { ...rootNode, children: [], level: 0 };
      fixture.componentRef.setInput('node', leafNode);
      fixture.detectChanges();
      const meta = component.metadata();
      expect(meta.some((m) => m.label === 'Subcategories')).toBeFalse();
    });

    it('should include Parent when parentName is set', () => {
      fixture.componentRef.setInput('parentName', 'All');
      fixture.detectChanges();
      const meta = component.metadata();
      expect(meta.some((m) => m.label === 'Parent' && m.value === 'All')).toBeTrue();
    });

    it('should not include Parent when parentName is not set', () => {
      const meta = component.metadata();
      expect(meta.some((m) => m.label === 'Parent')).toBeFalse();
    });
  });

  describe('outputs', () => {
    it('should have edit output', () => {
      expect(component.edit).toBeDefined();
    });

    it('should have delete output', () => {
      expect(component.delete).toBeDefined();
    });
  });
});
