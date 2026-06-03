import type { HierarchyNode } from './chart-spec.types';

/** Value for d3-hierarchy .sum() — only leaves contribute; avoids double-counting parents. */
export function hierarchyLeafValue(node: HierarchyNode): number {
  return node.children?.length ? 0 : (node.value ?? 0);
}
