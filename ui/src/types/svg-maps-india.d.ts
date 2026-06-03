declare module '@svg-maps/india' {
  interface SvgMapLocation {
    name: string;
    id: string;
    path: string;
  }

  interface SvgMapData {
    label: string;
    viewBox: string;
    locations: SvgMapLocation[];
  }

  const indiaMap: SvgMapData;
  export default indiaMap;
}
