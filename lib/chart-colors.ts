// Chart-fargepalett — Simpleness Visual System
//
// Bevisst sparsom: ett primært element i sort, sekundære i nøytral grå,
// success/positive accent i deep grønn (#41BD0E). Brun-paletten i
// CHART_COLORS er reservert for cohort-heatmap (gradient fra lys til mørk).

// Cohort heatmap — grønn gradient (mint → moss). Ingen svart eller brun.
// 12 stops fra lyseste mint (eldste cohort) til mørkeste moss (nyeste).
export const CHART_COLORS = [
  "#f6ffee", // pale (eldst)
  "#dff7cc", // mint
  "#c5eea5",
  "#a8e07d",
  "#8ad057",
  "#6cbf32",
  "#54a91f",
  "#41bd0e", // deep
  "#368a0c",
  "#2a6e09",
  "#205607",
  "#515b12", // moss (nyest)
];

// Bar / line / area charts — Simpleness grønn-skala (ingen svart i grafer)
//
// Hierarki:
//   - Primær bar / fokus: deep grønn (#41BD0E) — leser tydelig mot hvit
//   - Sekundær (stacked top): mint (#DFF7CC) — lett aksent
//   - Linje over bars: moss (#515B12) — mørk kontrast for trend-overlay
//   - Sammenligningslinje: nøytral grå (#A3A3A3)
export const CHART_BAR_COLOR    = "#41bd0e"; // Deep grønn — primær bar
export const CHART_BAR_STACKED  = "#dff7cc"; // Mint — stacked / sekundær topp
export const CHART_LINE_COLOR   = "#515b12"; // Moss — primær linje
export const CHART_LINE_COMPARE = "#a3a3a3"; // Nøytral grå — sammenligning
export const CHART_GRID_COLOR   = "#f0f0f0"; // Super lys gridline
export const CHART_AXIS_COLOR   = "#737373"; // Akse-tekst (dempet)
