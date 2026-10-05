import type { Locale } from '../types';
import { learnCs } from './cs';
import { learnEn } from './en';
import type { LearnText } from './types';

export type { LabView, LearnText } from './types';

export const LEARN: Record<Locale, LearnText> = { en: learnEn, cs: learnCs };
