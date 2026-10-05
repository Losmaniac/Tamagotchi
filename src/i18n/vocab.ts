// Short phrases the pet says in bilingual mode. Each entry carries both languages,
// so nothing can go missing. (Word Snack's vocabulary lives in words.ts.)

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
