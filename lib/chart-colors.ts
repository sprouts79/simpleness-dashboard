// Chart-fargepalett — Simpleness Visual System
//
// Bevisst sparsom: ett primært element i sort, sekundære i nøytral grå,
// success/positive accent i deep grønn (#41BD0E). Brun-paletten i
// CHART_COLORS er reservert for cohort-heatmap (gradient fra lys til mørk).

// Cohort heatmap — beholdes som brun-skala (gradient leser bedre enn ensfargede skift)
export const CHART_COLORS = [
  "#f5f0e8", // lysest (eldst)
  "#e8dcc8",
  "#d4c4a8",
  "#c4a77d",
  "#b08d5a",
  "#96723d",
  "#7d5a2f",
  "#654925",
  "#4e391d",
  "#3a2a15",
  "#2a1e10",
  "#1a120a", // mørkest (nyest)
];

// Bar / line / area charts — Shopify-stil minimalisme
export const CHART_BAR_COLOR    = "#171717"; // Sort — primær bar (data-fokus)
export const CHART_BAR_STACKED  = "#dff7cc"; // Mint — stacked / sekundær
export const CHART_LINE_COLOR   = "#41bd0e"; // Deep grønn — primær linje (accent)
export const CHART_LINE_COMPARE = "#a3a3a3"; // Nøytral grå — sammenligningslinje
export const CHART_GRID_COLOR   = "#f0f0f0"; // Super lys gridline
export const CHART_AXIS_COLOR   = "#737373"; // Akse-tekst (dempet)
