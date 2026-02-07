export interface BreadcrumbItem {
  readonly label: string;
  readonly route?: string;
  readonly queryParams?: Record<string, string>;
}
