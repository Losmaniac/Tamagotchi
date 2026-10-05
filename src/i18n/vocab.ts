// Bilingual content: words for the Word Snack game and short phrases the pet says
// in bilingual mode. Each entry carries both languages, so nothing can go missing.

export interface Word {
  emoji: string;
  en: string;
  cs: string;
}

export const WORDS: readonly Word[] = [
  { emoji: '🍎', en: 'apple', cs: 'jablko' },
  { emoji: '🍌', en: 'banana', cs: 'banán' },
  { emoji: '🥕', en: 'carrot', cs: 'mrkev' },
  { emoji: '🍞', en: 'bread', cs: 'chleba' },
  { emoji: '🧀', en: 'cheese', cs: 'sýr' },
  { emoji: '🥛', en: 'milk', cs: 'mléko' },
  { emoji: '🍓', en: 'strawberry', cs: 'jahoda' },
  { emoji: '🍒', en: 'cherry', cs: 'třešeň' },
  { emoji: '🥚', en: 'egg', cs: 'vejce' },
  { emoji: '🐟', en: 'fish', cs: 'ryba' },
  { emoji: '🍐', en: 'pear', cs: 'hruška' },
  { emoji: '🍇', en: 'grapes', cs: 'hrozny' },
  { emoji: '🥒', en: 'cucumber', cs: 'okurka' },
  { emoji: '🍅', en: 'tomato', cs: 'rajče' },
  { emoji: '🥔', en: 'potato', cs: 'brambora' },
  { emoji: '🍯', en: 'honey', cs: 'med' },
  { emoji: '🍰', en: 'cake', cs: 'dort' },
  { emoji: '🍋', en: 'lemon', cs: 'citron' },
  { emoji: '🧅', en: 'onion', cs: 'cibule' },
  { emoji: '🍉', en: 'watermelon', cs: 'meloun' },
  { emoji: '💧', en: 'water', cs: 'voda' },
  { emoji: '🍄', en: 'mushroom', cs: 'houba' },
  { emoji: '🌽', en: 'corn', cs: 'kukuřice' },
  { emoji: '🍪', en: 'cookie', cs: 'sušenka' },
];

export const PHRASES = {
  hello: { en: 'Hi!', cs: 'Ahoj!' },
  yummy: { en: 'Yummy!', cs: 'Mňam!' },
  love: { en: "You're the best!", cs: 'Jsi nejlepší!' },
  fun: { en: 'That was fun!', cs: 'To byla zábava!' },
  clean: { en: 'So fresh!', cs: 'Voním!' },
  thanks: { en: 'Thank you!', cs: 'Děkuju!' },
  goodNight: { en: 'Good night!', cs: 'Dobrou noc!' },
  goodMorning: { en: 'Good morning!', cs: 'Dobré ráno!' },
  sleepy: { en: "I'm sleepy…", cs: 'Chce se mi spát…' },
  missedYou: { en: 'I missed you!', cs: 'Stýskalo se mi!' },
  favorite: { en: 'My favourite!', cs: 'Moje oblíbené!' },
  yuck: { en: 'Yuck!', cs: 'Fuj!' },
} as const satisfies Record<string, { en: string; cs: string }>;

export type PhraseKey = keyof typeof PHRASES;
