/**
 * HTML entity decoding for scraped text.
 *
 * Text pulled from a page is chunked, embedded and shown to visitors as source
 * excerpts. Left encoded, an ampersand is stored and embedded as the literal
 * five characters "&amp;", which corrupts both the vector and what the visitor
 * reads. Decode after tags are stripped: the result is plain text used for
 * retrieval and escaped again before display, never rendered as HTML.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  shy: '',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  bull: '•',
  middot: '·',
  copy: '©',
  reg: '®',
  trade: '™',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  laquo: '«',
  raquo: '»',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
  ccedil: 'ç',
  uuml: 'ü',
  ouml: 'ö',
  auml: 'ä',
  szlig: 'ß',
  ntilde: 'ñ',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
};

const ENTITY_PATTERN = /&(#[Xx][0-9A-Fa-f]+|#[0-9]+|[A-Za-z][A-Za-z0-9]{1,31});/g;

/** Decode named and numeric HTML entities. Unknown entities are left as-is. */
export function decodeHtmlEntities(text: string): string {
  if (!text || text.indexOf('&') === -1) return text;

  return text.replace(ENTITY_PATTERN, (match, entity: string) => {
    if (entity.charCodeAt(0) === 35 /* # */) {
      const isHex = entity[1] === 'x' || entity[1] === 'X';
      const codePoint = parseInt(isHex ? entity.slice(2) : entity.slice(1), isHex ? 16 : 10);

      if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) {
        return match;
      }

      // Surrogate halves are not valid on their own.
      if (codePoint >= 0xd800 && codePoint <= 0xdfff) return match;

      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return match;
      }
    }

    const named = NAMED_ENTITIES[entity] ?? NAMED_ENTITIES[entity.toLowerCase()];
    return named ?? match;
  });
}
