// Food lab: simple nutrition per food, food groups and the weekly "balanced plate" challenge.
import { PLATE_COINS, PLATE_MAX_TREATS, PLATE_MIN_GROUP, PLATE_MIN_MEALS } from './constants';
import { shiftDay } from './diary';
import type { SnackId } from './food';

export const FOOD_GROUPS = ['fruit', 'veg', 'protein', 'meal', 'treat'] as const;
export type FoodGroup = (typeof FOOD_GROUPS)[number];
/** The groups the plate challenge asks for (treats only have a limit). */
export const PLATE_GROUPS = ['fruit', 'veg', 'protein', 'meal'] as const;

export const NUTRIENTS = ['sugar', 'protein', 'fibre', 'vitamins'] as const;
export type Nutrient = (typeof NUTRIENTS)[number];

export interface Nutrition {
  group: FoodGroup;
  /** 0 = none, 3 = a lot. */
  levels: Record<Nutrient, 0 | 1 | 2 | 3>;
}

const n = (
  group: FoodGroup,
  sugar: 0 | 1 | 2 | 3,
  protein: 0 | 1 | 2 | 3,
  fibre: 0 | 1 | 2 | 3,
  vitamins: 0 | 1 | 2 | 3,
): Nutrition => ({ group, levels: { sugar, protein, fibre, vitamins } });

export type FoodId = SnackId | 'meal';

/** Rough, kid-level nutrition: what each food is mostly good for. */
export const NUTRITION: Record<FoodId, Nutrition> = {
  meal: n('meal', 1, 2, 2, 2),
  apple: n('fruit', 2, 0, 2, 2),
  berries: n('fruit', 1, 0, 2, 3),
  lemon: n('fruit', 0, 0, 1, 3),
  carrot: n('veg', 1, 0, 2, 3),
  lettuce: n('veg', 0, 0, 2, 2),
  bamboo: n('veg', 0, 1, 3, 1),
  chili: n('veg', 0, 0, 1, 3),
  fish: n('protein', 0, 3, 0, 1),
  bone: n('protein', 0, 2, 0, 0),
  worm: n('protein', 0, 3, 0, 1),
  cricket: n('protein', 0, 3, 1, 1),
  cookie: n('treat', 3, 0, 0, 0),
  cupcake: n('treat', 3, 0, 0, 0),
};

export interface Plate {
  /** Monday of the week (YYYY-MM-DD). */
  week: string;
  counts: Record<FoodGroup, number>;
  claimed: boolean;
}

/** Monday of the week containing `day`. */
export function weekOf(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const weekday = (new Date(y!, (m ?? 1) - 1, d).getDay() + 6) % 7; // Monday = 0
  return shiftDay(day, -weekday);
}

export function emptyPlate(week: string): Plate {
  return { week, counts: { fruit: 0, veg: 0, protein: 0, meal: 0, treat: 0 }, claimed: false };
}

/** This week's plate (a new week starts empty). */
export function currentPlate(plate: Plate | null, day: string): Plate {
  const week = weekOf(day);
  return plate && plate.week === week ? plate : emptyPlate(week);
}

export function recordFood(plate: Plate | null, day: string, food: FoodId): Plate {
  const p = currentPlate(plate, day);
  const group = NUTRITION[food].group;
  return { ...p, counts: { ...p.counts, [group]: p.counts[group] + 1 } };
}

export interface PlateGoal {
  group: FoodGroup;
  have: number;
  need: number;
  done: boolean;
}

export function plateGoals(plate: Plate): PlateGoal[] {
  const goals: PlateGoal[] = PLATE_GROUPS.map((group) => {
    const need = group === 'meal' ? PLATE_MIN_MEALS : PLATE_MIN_GROUP;
    return { group, have: plate.counts[group], need, done: plate.counts[group] >= need };
  });
  return goals;
}

export function treatsOk(plate: Plate): boolean {
  return plate.counts.treat <= PLATE_MAX_TREATS;
}

export function plateComplete(plate: Plate): boolean {
  return plateGoals(plate).every((g) => g.done) && treatsOk(plate);
}

/** Claims the weekly reward. Returns the coins earned (0 if not complete or already claimed). */
export function claimPlate(plate: Plate): { plate: Plate; coins: number } {
  if (plate.claimed || !plateComplete(plate)) return { plate, coins: 0 };
  return { plate: { ...plate, claimed: true }, coins: PLATE_COINS };
}
