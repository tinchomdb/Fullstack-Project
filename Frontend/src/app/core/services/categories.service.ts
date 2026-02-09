import { inject, Injectable, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Category } from '../models/category.model';
import { Resource } from '../../shared/utils/resource';
import { LoadingOverlayService } from './loading-overlay.service';

export interface CategoryTreeNode {
  category: Category;
  children: CategoryTreeNode[];
  level: number;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly loadingOverlayService = inject(LoadingOverlayService);
  private readonly baseUrl = `${environment.apiBase}/api/categories`;
  private readonly adminBaseUrl = `${environment.apiBase}/api/admin/categories`;
  private readonly categoriesResource = new Resource<readonly Category[]>(
    [],
    'Loading categories...',
    this.loadingOverlayService,
  );

  private readonly rawCategories = computed(() => this.categoriesResource.data() ?? []);
  readonly loading = this.categoriesResource.loading;
  readonly error = this.categoriesResource.error;

  private readonly rawCategoryMap = computed(() => {
    const map = new Map<string, Category>();
    this.rawCategories().forEach((category) => map.set(category.id, category));
    return map;
  });

  readonly categories = computed(() =>
    this.rawCategories().map((category) => ({
      ...category,
      url: `/category/${this.buildCategoryPath(category.id, this.rawCategoryMap())}`,
    })),
  );

  private readonly categoryMap = computed(() => {
    const map = new Map<string, Category>();
    this.categories().forEach((category) => map.set(category.id, category));
    return map;
  });

  readonly categoryTree = computed(() => this.buildCategoryTree(this.categories()));
  readonly featuredCategories = computed(() => this.categories().filter((c) => c.featured));

  constructor() {
    this.loadCategories();
  }

  loadCategories(): void {
    if (this.rawCategories().length > 0) {
      return;
    }
    this.categoriesResource.load(this.getAllCategories());
  }

  reloadCategories(): void {
    this.categoriesResource.load(this.getAllCategories());
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http
      .post<Category>(this.adminBaseUrl, category)
      .pipe(tap(() => this.reloadCategories()));
  }

  updateCategory(category: Category): Observable<Category> {
    return this.http
      .put<Category>(`${this.adminBaseUrl}/${category.id}`, category)
      .pipe(tap(() => this.reloadCategories()));
  }

  deleteCategory(categoryId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.adminBaseUrl}/${categoryId}`)
      .pipe(tap(() => this.reloadCategories()));
  }

  getAvailableParentCategories(excludeCategoryId?: string): Category[] {
    if (!excludeCategoryId) {
      return [...this.categories()];
    }

    const descendantIds = this.collectAllDescendants(excludeCategoryId);
    return this.categories().filter((c) => !descendantIds.has(c.id));
  }

  getParentCategoryName(parentId?: string): string {
    if (!parentId) return 'None';
    return this.categoryMap().get(parentId)?.name ?? 'Unknown';
  }

  getChildCategories(parentCategoryId: string): Category[] {
    return this.categories().filter((c) => c.parentCategoryId === parentCategoryId);
  }

  getCategoryPath(categoryId: string): Category[] {
    const path: Category[] = [];
    const map = this.categoryMap();
    let currentCategory = map.get(categoryId);

    while (currentCategory) {
      path.unshift(currentCategory);
      currentCategory = currentCategory.parentCategoryId
        ? map.get(currentCategory.parentCategoryId)
        : undefined;
    }

    return path;
  }

  getCategoryById(categoryId: string): Category | undefined {
    return this.categoryMap().get(categoryId);
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this.categories().find((c) => c.slug === slug);
  }

  getCategoryByPath(path: string): Category | undefined {
    if (!path) return undefined;
    const slugs = path.split('/').filter((s) => s.length > 0);
    if (slugs.length === 0) return undefined;
    const lastCategorySlug = slugs[slugs.length - 1];

    return this.categories().find((c) => c.slug === lastCategorySlug);
  }

  private buildCategoryPath(categoryId: string, map: Map<string, Category>): string {
    const path: Category[] = [];
    let current = map.get(categoryId);
    while (current) {
      path.unshift(current);
      current = current.parentCategoryId ? map.get(current.parentCategoryId) : undefined;
    }
    return path.map((c) => c.slug).join('/');
  }

  private getAllCategories(): Observable<readonly Category[]> {
    return this.http.get<readonly Category[]>(this.baseUrl);
  }

  private collectAllDescendants(categoryId: string): Set<string> {
    const descendantIds = new Set<string>([categoryId]);
    const allCategories = this.categories();

    const addDescendants = (parentId: string): void => {
      allCategories
        .filter((c) => c.parentCategoryId === parentId)
        .forEach((child) => {
          descendantIds.add(child.id);
          addDescendants(child.id);
        });
    };

    addDescendants(categoryId);
    return descendantIds;
  }

  private buildCategoryTree(categories: readonly Category[]): CategoryTreeNode[] {
    const nodeMap = new Map<string, CategoryTreeNode>();
    const rootNodes: CategoryTreeNode[] = [];

    // Create all nodes first
    categories.forEach((category) => {
      nodeMap.set(category.id, {
        category,
        children: [],
        level: 0,
      });
    });

    // Build parent-child relationships and calculate levels
    categories.forEach((category) => {
      const node = nodeMap.get(category.id)!;

      if (category.parentCategoryId) {
        const parentNode = nodeMap.get(category.parentCategoryId);
        if (parentNode) {
          node.level = parentNode.level + 1;
          parentNode.children.push(node);
          return;
        }
      }

      rootNodes.push(node);
    });

    this.sortTreeNodes(rootNodes);
    return rootNodes;
  }

  private sortTreeNodes(nodes: CategoryTreeNode[]): void {
    nodes.sort((a, b) => a.category.name.localeCompare(b.category.name));
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        this.sortTreeNodes(node.children);
      }
    });
  }
}
