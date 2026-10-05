// Word Snack vocabulary in themed packs. Each entry carries both languages, so nothing can go
// missing. A word's id ("pack:english") keys its spaced-repetition box in the save.

export interface Word {
  id: string;
  emoji: string;
  en: string;
  cs: string;
}

export const WORD_PACKS = ['food', 'animals', 'feelings', 'body', 'weather', 'school'] as const;
export type WordPack = (typeof WORD_PACKS)[number];

export const PACK_ICON: Record<WordPack, string> = {
  food: '🍎',
  animals: '🐾',
  feelings: '😊',
  body: '🫀',
  weather: '⛅',
  school: '🎒',
};

type Raw = readonly [emoji: string, en: string, cs: string];

const RAW: Record<WordPack, readonly Raw[]> = {
  food: [
    ['🍎', 'apple', 'jablko'],
    ['🍌', 'banana', 'banán'],
    ['🥕', 'carrot', 'mrkev'],
    ['🍞', 'bread', 'chleba'],
    ['🧀', 'cheese', 'sýr'],
    ['🥛', 'milk', 'mléko'],
    ['🍓', 'strawberry', 'jahoda'],
    ['🍒', 'cherry', 'třešeň'],
    ['🥚', 'egg', 'vejce'],
    ['🐟', 'fish', 'ryba'],
    ['🍐', 'pear', 'hruška'],
    ['🍇', 'grapes', 'hrozny'],
    ['🥒', 'cucumber', 'okurka'],
    ['🍅', 'tomato', 'rajče'],
    ['🥔', 'potato', 'brambora'],
    ['🍯', 'honey', 'med'],
    ['🍰', 'cake', 'dort'],
    ['🍋', 'lemon', 'citron'],
    ['🧅', 'onion', 'cibule'],
    ['🍉', 'watermelon', 'meloun'],
    ['💧', 'water', 'voda'],
    ['🍄', 'mushroom', 'houba'],
    ['🌽', 'corn', 'kukuřice'],
    ['🍪', 'cookie', 'sušenka'],
  ],
  animals: [
    ['🐱', 'cat', 'kočka'],
    ['🐶', 'dog', 'pes'],
    ['🐰', 'rabbit', 'králík'],
    ['🦊', 'fox', 'liška'],
    ['🐼', 'panda', 'panda'],
    ['🐧', 'penguin', 'tučňák'],
    ['🦉', 'owl', 'sova'],
    ['🐢', 'turtle', 'želva'],
    ['🐴', 'horse', 'kůň'],
    ['🐮', 'cow', 'kráva'],
    ['🐷', 'pig', 'prase'],
    ['🐑', 'sheep', 'ovce'],
    ['🐔', 'chicken', 'slepice'],
    ['🐭', 'mouse', 'myš'],
    ['🐻', 'bear', 'medvěd'],
    ['🐺', 'wolf', 'vlk'],
    ['🦁', 'lion', 'lev'],
    ['🐘', 'elephant', 'slon'],
  ],
  feelings: [
    ['😊', 'happy', 'šťastný'],
    ['😢', 'sad', 'smutný'],
    ['😠', 'angry', 'naštvaný'],
    ['😨', 'scared', 'vyděšený'],
    ['😟', 'worried', 'ustaraný'],
    ['😌', 'calm', 'klidný'],
    ['🥱', 'tired', 'unavený'],
    ['🤩', 'excited', 'nadšený'],
    ['😳', 'embarrassed', 'v rozpacích'],
    ['😲', 'surprised', 'překvapený'],
    ['🥰', 'loved', 'milovaný'],
    ['😒', 'bored', 'znuděný'],
    ['😤', 'proud', 'hrdý'],
    ['🫥', 'lonely', 'osamělý'],
  ],
  body: [
    ['👤', 'head', 'hlava'],
    ['👁️', 'eye', 'oko'],
    ['👂', 'ear', 'ucho'],
    ['👃', 'nose', 'nos'],
    ['👄', 'mouth', 'pusa'],
    ['🦷', 'tooth', 'zub'],
    ['✋', 'hand', 'ruka'],
    ['🦶', 'foot', 'chodidlo'],
    ['🦵', 'leg', 'noha'],
    ['💪', 'arm', 'paže'],
    ['🫀', 'heart', 'srdce'],
    ['🫁', 'lungs', 'plíce'],
    ['🧠', 'brain', 'mozek'],
    ['🦴', 'bone', 'kost'],
  ],
  weather: [
    ['☀️', 'sun', 'slunce'],
    ['🌧️', 'rain', 'déšť'],
    ['❄️', 'snow', 'sníh'],
    ['💨', 'wind', 'vítr'],
    ['☁️', 'cloud', 'mrak'],
    ['⛈️', 'storm', 'bouřka'],
    ['🌫️', 'fog', 'mlha'],
    ['🌈', 'rainbow', 'duha'],
    ['🔥', 'hot', 'horko'],
    ['🥶', 'cold', 'chladno'],
    ['🌸', 'spring', 'jaro'],
    ['🏖️', 'summer', 'léto'],
    ['🍂', 'autumn', 'podzim'],
    ['⛄', 'winter', 'zima'],
  ],
  school: [
    ['📚', 'book', 'kniha'],
    ['✏️', 'pencil', 'tužka'],
    ['🖊️', 'pen', 'propiska'],
    ['🎒', 'backpack', 'batoh'],
    ['📏', 'ruler', 'pravítko'],
    ['✂️', 'scissors', 'nůžky'],
    ['🧑‍🏫', 'teacher', 'učitel'],
    ['🏫', 'school', 'škola'],
    ['📓', 'notebook', 'sešit'],
    ['🖥️', 'computer', 'počítač'],
    ['🔔', 'break', 'přestávka'],
    ['📝', 'test', 'test'],
    ['🗺️', 'map', 'mapa'],
    ['🧮', 'maths', 'matematika'],
  ],
};

export const WORDS = {} as Record<WordPack, readonly Word[]>;
for (const pack of WORD_PACKS)
  WORDS[pack] = RAW[pack].map(([emoji, en, cs]) => ({ id: `${pack}:${en}`, emoji, en, cs }));

export const ALL_WORDS: readonly Word[] = WORD_PACKS.flatMap((p) => WORDS[p]);
