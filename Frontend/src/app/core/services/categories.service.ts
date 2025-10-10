import { inject, Injectable, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Category } from '../models/category.model';
import { Resource } from '../../shared/utils/resource';

export interface CategoryTreeNode {
  category: Category;
  children: CategoryTreeNode[];
  level: number;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBase}/api/categories`;
  private readonly categoriesResource = new Resource<readonly Category[]>([]);

  readonly categories = this.categoriesResource.data;
  readonly loading = this.categoriesResource.loading;
  readonly error = this.categoriesResource.error;

  readonly categoryTree = computed(() => this.buildCategoryTree(this.categories() ?? []));
  readonly flattenedTree = computed(() => this.flattenTree(this.categoryTree()));

  loadCategories(): void {
    this.categoriesResource.load(this.getAllCategories());
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, category).pipe(tap(() => this.loadCategories()));
  }

  updateCategory(category: Category): Observable<Category> {
    return this.http
      .put<Category>(`${this.baseUrl}/${category.id}`, category)
      .pipe(tap(() => this.loadCategories()));
  }

  deleteCategory(categoryId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${categoryId}`)
      .pipe(tap(() => this.loadCategories()));
  }

  getAvailableParentCategories(excludeCategoryId?: string): Category[] {
    const categories = this.categories() ?? [];

    if (!excludeCategoryId) {
      return [...categories];
    }

    const descendantIds = new Set<string>();
    const findDescendants = (categoryId: string) => {
      descendantIds.add(categoryId);
      categories
        .filter((c) => c.parentCategoryId === categoryId)
        .forEach((c) => findDescendants(c.id));
    };
    findDescendants(excludeCategoryId);

    return categories.filter((c) => !descendantIds.has(c.id));
  }

  getParentCategoryName(parentId?: string): string {
    if (!parentId) return 'None';
    const parent = (this.categories() ?? []).find((c) => c.id === parentId);
    return parent?.name ?? 'Unknown';
  }

  private getAllCategories(): Observable<readonly Category[]> {
    return this.http.get<readonly Category[]>(this.baseUrl);
  }

  private buildCategoryTree(categories: readonly Category[]): CategoryTreeNode[] {
    const categoryMap = new Map<string, CategoryTreeNode>();
    const rootNodes: CategoryTreeNode[] = [];

    categories.forEach((category) => {
      categoryMap.set(category.id, {
        category,
        children: [],
        level: 0,
      });
    });

    categories.forEach((category) => {
      const node = categoryMap.get(category.id)!;

      if (category.parentCategoryId) {
        const parentNode = categoryMap.get(category.parentCategoryId);
        if (parentNode) {
          node.level = parentNode.level + 1;
          parentNode.children.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    const sortNodes = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => a.category.name.localeCompare(b.category.name));
      nodes.forEach((node) => sortNodes(node.children));
    };
    sortNodes(rootNodes);

    return rootNodes;
  }

  private flattenTree(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
    const result: CategoryTreeNode[] = [];

    const traverse = (node: CategoryTreeNode) => {
      result.push(node);
      node.children.forEach(traverse);
    };

    nodes.forEach(traverse);
    return result;
  }
}
