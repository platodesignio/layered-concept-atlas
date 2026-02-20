export interface HighlightSpan {
  text: string;
  layerSlug: string | null;
  start: number;
  end: number;
}

export interface MatchedTerm {
  term: string;
  layerSlug: string;
  layerId: string;
}

export function generateHighlightSpans(
  text: string,
  matchedTermsByLayer: MatchedTerm[]
): HighlightSpan[] {
  // Build interval list: [start, end, layerSlug]
  type Interval = { start: number; end: number; layerSlug: string };
  const intervals: Interval[] = [];

  for (const { term, layerSlug } of matchedTermsByLayer) {
    let pos = 0;
    while (pos < text.length) {
      const idx = text.indexOf(term, pos);
      if (idx === -1) break;
      intervals.push({ start: idx, end: idx + term.length, layerSlug });
      pos = idx + 1;
    }
  }

  // Sort by start, then by length descending (longer match wins)
  intervals.sort((a, b) => a.start - b.start || b.end - a.end - (b.start - a.start));

  // Greedy non-overlapping selection
  const selected: Interval[] = [];
  let covered = 0;
  for (const interval of intervals) {
    if (interval.start >= covered) {
      selected.push(interval);
      covered = interval.end;
    }
  }

  // Build spans
  const spans: HighlightSpan[] = [];
  let pos = 0;
  for (const { start, end, layerSlug } of selected) {
    if (pos < start) {
      spans.push({ text: text.slice(pos, start), layerSlug: null, start: pos, end: start });
    }
    spans.push({ text: text.slice(start, end), layerSlug, start, end });
    pos = end;
  }
  if (pos < text.length) {
    spans.push({ text: text.slice(pos), layerSlug: null, start: pos, end: text.length });
  }

  return spans;
}
