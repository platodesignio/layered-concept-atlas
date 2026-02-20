// 全角→半角変換テーブル
const FULLWIDTH_MAP: Record<string, string> = {};
for (let i = 0; i < 94; i++) {
  FULLWIDTH_MAP[String.fromCharCode(0xff01 + i)] = String.fromCharCode(
    0x21 + i
  );
}
// 全角スペース
FULLWIDTH_MAP["\u3000"] = " ";

// 否定語リスト
export const NEGATION_WORDS = [
  "ない",
  "なく",
  "なかった",
  "ではない",
  "でない",
  "しない",
  "しなかった",
  "ません",
  "ませんでした",
  "否定",
  "違う",
  "異なる",
  "反する",
  "排除",
  "除外",
  "無い",
  "不",
];

export const NEGATION_WINDOW = 5; // 否定語の影響範囲（文字数）

export function normalizeText(text: string): string {
  let result = text;

  // 全角→半角
  result = result.replace(/[\uff01-\uff5e\u3000]/g, (ch) => FULLWIDTH_MAP[ch] ?? ch);

  // 小文字化
  result = result.toLowerCase();

  // 連続スペースを1つに
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

export interface Token {
  surface: string;
  start: number;
  end: number;
}

export function tokenizeNgram(text: string, n = 2): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i <= text.length - n; i++) {
    tokens.push({
      surface: text.slice(i, i + n),
      start: i,
      end: i + n,
    });
  }
  // unigram も追加
  for (let i = 0; i < text.length; i++) {
    tokens.push({
      surface: text[i],
      start: i,
      end: i + 1,
    });
  }
  return tokens;
}

export interface NegationRange {
  start: number;
  end: number;
}

export function detectNegationRanges(text: string): NegationRange[] {
  const ranges: NegationRange[] = [];
  for (const word of NEGATION_WORDS) {
    let pos = 0;
    while (pos < text.length) {
      const idx = text.indexOf(word, pos);
      if (idx === -1) break;
      // 否定語の前 NEGATION_WINDOW 文字を否定範囲とする
      ranges.push({
        start: Math.max(0, idx - NEGATION_WINDOW),
        end: idx + word.length,
      });
      pos = idx + 1;
    }
  }
  return ranges;
}

export function isInNegationRange(
  pos: number,
  ranges: NegationRange[]
): boolean {
  return ranges.some((r) => pos >= r.start && pos < r.end);
}
