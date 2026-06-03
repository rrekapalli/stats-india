declare module 'd3-sankey' {
  export function sankey(): {
    nodeWidth(width: number): ReturnType<typeof sankey>;
    nodePadding(padding: number): ReturnType<typeof sankey>;
    extent(extent: [[number, number], [number, number]]): ReturnType<typeof sankey>;
    (graph: {
      nodes: Array<Record<string, unknown>>;
      links: Array<Record<string, unknown>>;
    }): {
      nodes: Array<Record<string, unknown> & { x0?: number; x1?: number; y0?: number; y1?: number }>;
      links: Array<Record<string, unknown> & { width?: number }>;
    };
  };

  export function sankeyLinkHorizontal(): (
    link: Record<string, unknown>
  ) => string | null;
}
