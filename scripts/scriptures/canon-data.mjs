// Canon metadata: book names, ID normalization, canonical orders, traditions, TSK maps.
// All book IDs are USFM 3-letter codes (normalized from eBible.org's legacy codes).

// eBible.org legacy book codes -> standard USFM IDs
export const EBIBLE_TO_USFM = {
  SOL: 'SNG', JOE: 'JOL', NAH: 'NAM', EZE: 'EZK',
  MAR: 'MRK', JOH: 'JHN', PHI: 'PHP', JAM: 'JAS',
  '1JO': '1JN', '2JO': '2JN', '3JO': '3JN',
  EPJ: 'LJE',   // Letter of Jeremiah
  PRM: 'MAN',   // Prayer of Manasseh
  PSX: 'PS2',   // Psalm 151
  '4ES': '2ES', // 4 Esdras (Vulgate) = USFM 2ES (2 Esdras)
  DNG: 'DAG',   // Greek Daniel
};

export const BOOK_NAMES = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy',
  JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles',
  EZR: 'Ezra', NEH: 'Nehemiah', EST: 'Esther', JOB: 'Job', PSA: 'Psalms',
  PRO: 'Proverbs', ECC: 'Ecclesiastes', SNG: 'Song of Songs', ISA: 'Isaiah',
  JER: 'Jeremiah', LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea',
  JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah', NAM: 'Nahum',
  HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi',
  MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts', ROM: 'Romans',
  '1CO': '1 Corinthians', '2CO': '2 Corinthians', GAL: 'Galatians', EPH: 'Ephesians',
  PHP: 'Philippians', COL: 'Colossians', '1TH': '1 Thessalonians', '2TH': '2 Thessalonians',
  '1TI': '1 Timothy', '2TI': '2 Timothy', TIT: 'Titus', PHM: 'Philemon', HEB: 'Hebrews',
  JAS: 'James', '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John',
  '3JN': '3 John', JUD: 'Jude', REV: 'Revelation',
  TOB: 'Tobit', JDT: 'Judith', ESG: 'Esther (Greek)', WIS: 'Wisdom', SIR: 'Sirach',
  BAR: 'Baruch', LJE: 'Letter of Jeremiah', SUS: 'Susanna', BEL: 'Bel and the Dragon',
  '1MA': '1 Maccabees', '2MA': '2 Maccabees', '3MA': '3 Maccabees', '4MA': '4 Maccabees',
  '1ES': '1 Esdras', '2ES': '2 Esdras', MAN: 'Prayer of Manasseh', PS2: 'Psalm 151',
  DAG: 'Daniel (Greek)', ENO: '1 Enoch', JUB: 'Jubilees',
};

// Protestant 66 in canonical order — also the TSK book-number order (1..66).
export const PROTESTANT_66 = [
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH',
  'EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS',
  'JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL',
  'MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH',
  '1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV',
];

export const OT_39 = PROTESTANT_66.slice(0, 39);
export const NT_27 = PROTESTANT_66.slice(39);

// Wider-canon books, in the global bookOrder position (after the 66).
export const DEUTERO_ORDER = [
  'TOB','JDT','ESG','WIS','SIR','BAR','LJE','SUS','BEL',
  '1MA','2MA','1ES','MAN','PS2','3MA','2ES','4MA','DAG','ENO','JUB',
];

// Audited supplemental texts are versioned in text/charles, not supplied by
// the eBible archives. Full and targeted builds share this required inventory.
export const CHARLES_BOOKS = { ENO: 108, JUB: 50 };

export const TRANSLATIONS = {
  web:     { name: 'World English Bible',      year: '2020', license: 'Public domain' },
  kjv:     { name: 'King James Version',       year: '1769', license: 'Public domain' },
  drb:     { name: 'Douay-Rheims (Challoner)', year: '1899', license: 'Public domain' },
  brenton: { name: 'Brenton Septuagint',       year: '1851', license: 'Public domain' },
  charles: { name: 'R. H. Charles translations', year: '1913', license: 'Public domain' },
};

// Tradition canon orders (books listed even if unavailable get filtered at build time).
const CATHOLIC_OT = [
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH',
  'EZR','NEH','TOB','JDT','EST','JOB','PSA','PRO','ECC','SNG','WIS','SIR',
  'ISA','JER','LAM','BAR','EZK','DAN',
  'HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL','1MA','2MA',
];

const ORTHODOX_OT = [
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH',
  '1ES','EZR','NEH','ESG','JDT','TOB','1MA','2MA','3MA',
  'PSA','PS2','MAN','JOB','PRO','ECC','SNG','WIS','SIR',
  'HOS','AMO','MIC','JOL','OBA','JON','NAM','HAB','ZEP','HAG','ZEC','MAL',
  'ISA','JER','BAR','LAM','LJE','EZK','SUS','DAG','BEL','4MA',
];

const ETHIOPIAN_AVAILABLE_OT = [
  ...OT_39,
  'TOB','JDT','ESG','WIS','SIR','BAR','LJE','SUS','BEL','DAG','1ES','2ES','MAN','PS2','ENO','JUB',
];

const ARMENIAN_AVAILABLE_OT = [
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH',
  '1ES','EZR','NEH','EST','JDT','TOB','1MA','2MA','3MA','PSA','PRO','ECC','SNG','WIS','SIR',
  'JOB','ISA','JER','BAR','LAM','EZK','DAN','HOS','AMO','MIC','JOL','OBA','JON','NAM','HAB',
  'ZEP','HAG','ZEC','MAL',
];

export const TRADITIONS = [
  {
    id: 'protestant', name: 'Protestant',
    blurb: 'The 66-book Old and New Testaments familiar from most modern Protestant Bibles.',
    books: PROTESTANT_66,
    transPreference: ['web', 'kjv'],
  },
  {
    id: 'catholic', name: 'Catholic',
    blurb: 'The 73-book canon, including the deuterocanonical books and additions.',
    books: [...CATHOLIC_OT, ...NT_27],
    transPreference: ['drb', 'web', 'kjv'],
  },
  {
    id: 'orthodox', name: 'Eastern Orthodox',
    blurb: 'A Septuagint-shaped Old Testament and the shared New Testament, with local variation.',
    books: [...ORTHODOX_OT, ...NT_27],
    transPreference: ['brenton', 'web', 'kjv'],
  },
  {
    id: 'ethiopian', name: 'Ethiopian Tewahedo',
    blurb: 'The traditional 81-book Tewahedo corpus; this shelf hosts its public-domain English overlap.',
    editorial: 'This shelf hosts the shared books, 1 Enoch and Jubilees in R. H. Charles’s 1913 translations. Meqabyan, Sinodos, the Book of the Covenant, and other parts of the Tewahedo corpus are not hosted here. These English editions do not reproduce a complete Ethiopian Bible or its traditional book count.',
    books: [...ETHIOPIAN_AVAILABLE_OT, ...NT_27],
    transPreference: ['web', 'kjv'],
  },
  {
    id: 'armenian', name: 'Armenian Apostolic',
    blurb: 'The Armenian Church’s Septuagint-shaped Old Testament and the shared New Testament.',
    editorial: 'This shelf follows the 48-book Old Testament represented by Armenian Church and Bible Society editions. The classical Armenian Zohrab Bible (1805) is digitized but not yet licensed for rehosting.',
    linkOut: { label: 'Read the Zohrab Bible at arak29.org', url: 'https://www.arak29.org/' },
    books: [...ARMENIAN_AVAILABLE_OT, ...NT_27],
    transPreference: ['web', 'kjv'],
  },
];

// TSK reference abbreviations -> USFM IDs (as observed in tskxref.txt).
export const TSK_ABBR = {
  ge: 'GEN', ex: 'EXO', le: 'LEV', nu: 'NUM', de: 'DEU', jos: 'JOS', jud: 'JDG',
  ru: 'RUT', '1sa': '1SA', '2sa': '2SA', '1ki': '1KI', '2ki': '2KI', '1ch': '1CH',
  '2ch': '2CH', ezr: 'EZR', ne: 'NEH', es: 'EST', job: 'JOB', ps: 'PSA', pr: 'PRO',
  ec: 'ECC', so: 'SNG', isa: 'ISA', jer: 'JER', la: 'LAM', eze: 'EZK', exe: 'EZK',
  da: 'DAN', ho: 'HOS', joe: 'JOL', am: 'AMO', ob: 'OBA', jon: 'JON', mic: 'MIC',
  na: 'NAM', hab: 'HAB', zep: 'ZEP', hag: 'HAG', zec: 'ZEC', mal: 'MAL',
  mt: 'MAT', mr: 'MRK', lu: 'LUK', joh: 'JHN', ac: 'ACT', ro: 'ROM', '1co': '1CO',
  '2co': '2CO', ga: 'GAL', eph: 'EPH', php: 'PHP', col: 'COL', '1th': '1TH',
  '2th': '2TH', '1ti': '1TI', '2ti': '2TI', tit: 'TIT', phm: 'PHM', heb: 'HEB',
  jas: 'JAS', '1pe': '1PE', '2pe': '2PE', '1jo': '1JN', '2jo': '2JN', '3jo': '3JN',
  jude: 'JUD', re: 'REV',
};

export const STOPWORDS = [
  'the','and','of','to','that','in','he','shall','unto','for','i','his','a','they',
  'be','is','him','not','them','it','with','all','thou','which','was','my','me',
  'you','your','yours','we','us','who','whom','this','these','those','but','as',
  'at','by','on','or','so','no','do','did','done','are','were','am','has','have',
  'had','will','would','there','their','then','out','up','upon','also','an','if','from',
];
