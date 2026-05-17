import type { ElementId, StatAbbr } from './types';

export interface CategoryDef {
  id: ElementId;
  name: string;
  element: string;
  elementEn: string;
  rune: string;
  color: string;
  stat: StatAbbr;
  desc: string;
  skills: string[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'health',
    name: 'Zdrowie i Siłownia',
    rune: '火',
    element: 'Ogień',
    elementEn: 'Fire',
    color: 'var(--c-health)',
    stat: 'STR',
    desc: 'Ogień to energia, pasja i wewnętrzny żar. Trenuj, oddychaj głęboko, jedz świadomie — niech twój wewnętrzny płomień nigdy nie zgaśnie.',
    skills: ['Siła', 'Wytrzymałość', 'Oddech', 'Sen', 'Mobilność'],
  },
  {
    id: 'finance',
    name: 'Finanse',
    rune: '土',
    element: 'Ziemia',
    elementEn: 'Earth',
    color: 'var(--c-finance)',
    stat: 'WIS',
    desc: 'Ziemia jest stabilna i cierpliwa. Buduj swoje fundamenty: oszczędzaj, inwestuj, planuj jak architekt swojego ogrodu.',
    skills: ['Budżet', 'Oszczędności', 'Inwestycje', 'Pasywny dochód'],
  },
  {
    id: 'habit',
    name: 'Nawyki i Rutyny',
    rune: '水',
    element: 'Woda',
    elementEn: 'Water',
    color: 'var(--c-habit)',
    stat: 'CON',
    desc: 'Woda płynie nieustannie — bez wysiłku, ale z ogromną siłą. Codzienne rytuały są twoją rzeką: drążą skałę kropla po kropli.',
    skills: ['Poranek', 'Wieczór', 'Medytacja', 'Detoks cyfrowy'],
  },
  {
    id: 'learn',
    name: 'Nauka i Rozwój',
    rune: '風',
    element: 'Powietrze',
    elementEn: 'Air',
    color: 'var(--c-learn)',
    stat: 'INT',
    desc: 'Powietrze to wolność umysłu. Czytaj, pytaj, podróżuj myślą. Każda nowa idea unosi cię wyżej.',
    skills: ['Czytanie', 'Kursy', 'Języki', 'Pisanie', 'Refleksja'],
  },
  {
    id: 'work',
    name: 'Praca i Projekty',
    rune: '金',
    element: 'Metal',
    elementEn: 'Metal',
    color: 'var(--c-work)',
    stat: 'DEX',
    desc: 'Metal hartuje się w ogniu i kuje pod młotem. Twoje rzemiosło wymaga skupienia, precyzji i wytrwałości.',
    skills: ['Deep Work', 'Kreatywność', 'Networking', 'Wysyłka'],
  },
  {
    id: 'social',
    name: 'Relacje Społeczne',
    rune: '心',
    element: 'Duch',
    elementEn: 'Spirit',
    color: 'var(--c-social)',
    stat: 'CHA',
    desc: 'Duch łączy nas z innymi i ze sobą. Pielęgnuj więzi, słuchaj uważnie, bądź obecny — to twoja prawdziwa siła.',
    skills: ['Rodzina', 'Przyjaciele', 'Partner', 'Społeczność'],
  },
];

export const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<ElementId, CategoryDef>;

export const STAT_LABELS: Record<StatAbbr, string> = {
  STR: 'Siła',
  WIS: 'Mądrość',
  CON: 'Kond.',
  INT: 'Intelekt',
  DEX: 'Zręcz.',
  CHA: 'Charyzma',
};

export const THEMES: { value: string; label: string; swatch: string }[] = [
  { value: 'elements', label: 'Żywioły', swatch: '#a8421f' },
  { value: 'parchment', label: 'Pergamin', swatch: '#b8862c' },
  { value: 'sunrise', label: 'Świt', swatch: '#ff7a3c' },
  { value: 'meadow', label: 'Łąka', swatch: '#d68a2c' },
  { value: 'midnight', label: 'Północ', swatch: '#d4a857' },
];

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
