// Shape of the Learning lab texts. Both locales implement this interface, so a missing
// translation fails the type check. Loaded lazily with the lab (not in the first-screen bundle).
import type { BudgetItem, BudgetOutcome } from '../../game/budget';
import type { ClueKey } from '../../game/detective';
import type { Conclusion, ExperimentId, Metric } from '../../game/experiments';
import type { BodyTopic, Mood } from '../../game/learning';
import type { FoodGroup, Nutrient } from '../../game/nutrition';
import type { ReportCategory } from '../../game/report';
import type { SickCause, Species } from '../../game/types';
import type { IucnStatus, Region } from '../../game/wild';

export type LabView =
  'wild' | 'life' | 'body' | 'food' | 'detective' | 'experiments' | 'budget' | 'report';

type PerSpecies = Record<Species, string>;

export interface LearnText {
  lab: { title: string; intro: string; tiles: Record<LabView, { title: string; desc: string }> };
  wild: {
    intro: string;
    realName: PerSpecies;
    relation: PerSpecies;
    diet: PerSpecies;
    threat: PerSpecies;
    status: Record<IucnStatus, string>;
    region: Record<Region, string>;
    labels: {
      status: string;
      where: string;
      diet: string;
      lifespan: string;
      lifespanPet: string;
      why: string;
    };
    /** "{min}–{max} years" etc. are formatted with Intl; this wraps a single value. */
    about: string;
    iucnNote: string;
  };
  life: {
    intro: string;
    inGame: string;
    realLife: string;
    realPet: string;
    olderThan: string;
    now: string;
    note: PerSpecies;
    approx: string;
  };
  body: {
    intro: string;
    locked: string;
    unlock: Record<BodyTopic, string>;
    topics: Record<BodyTopic, { title: string; text: readonly string[] }>;
  };
  food: {
    intro: string;
    nutrients: Record<Nutrient, string>;
    groups: Record<FoodGroup, string>;
    meal: string;
    plateTitle: string;
    plateText: string;
    treats: string;
    claim: string;
    claimed: string;
    reward: string;
    tableTitle: string;
    tip: string;
  };
  detective: {
    intro: string;
    howTo: readonly string[];
    noCase: string;
    openCase: string;
    caseTitle: string;
    question: string;
    clues: Record<ClueKey, string>;
    suspicious: string;
    causes: Record<SickCause, { label: string; explain: string }>;
    right: string;
    wrong: string;
    stats: string;
    medicine: string;
  };
  experiments: {
    intro: string;
    steps: readonly string[];
    defs: Record<ExperimentId, { hypothesis: string; change: string }>;
    metric: Record<Metric, string>;
    needBaseline: string;
    start: string;
    running: string;
    doThis: string;
    cancel: string;
    before: string;
    after: string;
    changed: string;
    noData: string;
    question: string;
    conclusions: Record<Conclusion, { label: string; feedback: string }>;
    reward: string;
    sample: string;
    done: string;
  };
  budget: {
    intro: string;
    rules: readonly string[];
    goal: string;
    start: string;
    needs: string;
    wants: string;
    left: string;
    daysLeft: string;
    prices: string;
    items: Record<BudgetItem, string>;
    free: string;
    outcomes: Record<BudgetOutcome, { title: string; text: string }>;
    collect: string;
    cancel: string;
    ready: string;
  };
  report: {
    intro: string;
    categories: Record<ReportCategory, { label: string; detail: string }>;
    overall: string;
    empty: string;
    tipTitle: string;
    tips: Record<Species, readonly [string, string]>;
    gradeText: Record<'A' | 'B' | 'C' | 'D', string>;
  };
  checkin: {
    question: string;
    moods: Record<Mood, string>;
    replies: Record<Mood, string>;
    tips: Record<Mood, string>;
    talk: string;
    helpline: string;
    privacy: string;
    history: string;
    done: string;
  };
}
