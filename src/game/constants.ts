// Every balancing number lives here so the game can be tuned in one place.
// Rates are "points per hour" unless noted. Stats are 0–100.

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export const STAT_MIN = 0;
export const STAT_MAX = 100;

// --- Simulation clock -------------------------------------------------------
/** Offline catch-up is simulated in steps of this size. */
export const SIM_STEP = 5 * MINUTE;
/** Away for longer than this → the pet is treated as dead from neglect. */
export const MAX_CATCH_UP = 14 * DAY;
/** Live tick interval while the app is open. */
export const LIVE_TICK_MS = 10_000;

// --- Decay / regen (per hour) ----------------------------------------------
export const DECAY = {
  awake: { hunger: 6, happiness: 5, energy: 4, hygiene: 3 },
  asleep: { hunger: 2, happiness: 1, energy: -12, hygiene: 1 }, // negative = regenerates
} as const;

// --- Poop -------------------------------------------------------------------
export const POOP_MIN_INTERVAL = 2 * HOUR; // of awake time
export const POOP_MAX_INTERVAL = 4 * HOUR;
export const POOP_HYGIENE_HIT = 15; // instant hygiene loss when a poop drops
export const POOP_HAPPINESS_DRAIN = 2; // per hour, per uncleaned poop
export const MAX_POOPS = 6;

// --- Feeding ----------------------------------------------------------------
export const MEAL_HUNGER = 30;
export const SNACK_HUNGER = 10;
export const SNACK_HAPPINESS = 8;
export const FULL_THRESHOLD = 95; // meals refused at/above this fullness
export const OVERFEED_WINDOW = 2 * HOUR;
export const OVERFEED_SNACKS = 4; // more than this many snacks in the window…
export const OVERFEED_SICK_CHANCE = 0.4; // …rolls this chance of getting sick

// --- Play / petting ----------------------------------------------------------
export const PLAY_HAPPINESS = 15;
export const PLAY_ENERGY_COST = 8;
export const PLAY_HUNGER_COST = 3;
export const STROKE_HAPPINESS = 2;
export const STROKE_COOLDOWN = 5_000; // ms between rewarded strokes
export const MINIGAME_ENERGY_COST = 6;

// --- Cleaning -----------------------------------------------------------------
export const CLEAN_HYGIENE = 40;

// --- Sickness -----------------------------------------------------------------
export const SICK_BASE_CHANCE = 0.005; // per hour
export const SICK_LOW_HYGIENE = 25;
export const SICK_LOW_HYGIENE_CHANCE = 0.08; // added per hour when hygiene < 25
export const SICK_LOW_HUNGER = 15;
export const SICK_LOW_HUNGER_CHANCE = 0.08; // added per hour when hunger < 15
export const SICK_HEALTH_DRAIN = 4;
export const MEDICINE_DOSES_MIN = 1;
export const MEDICINE_DOSES_MAX = 2;
export const MEDICINE_NOT_SICK_HAPPINESS = -5;

// --- Health ---------------------------------------------------------------------
export const LOW_STAT = 20; // below this a stat "calls" and drains health
export const LOW_STAT_HEALTH_DRAIN = 2; // per hour, per low stat
export const HEALTH_REGEN = 1;
export const HEALTH_REGEN_MIN_STAT = 50;
export const CRITICAL_HEALTH = 25; // warnings shown below this

// --- Sleep ------------------------------------------------------------------------
export const DEFAULT_BEDTIME = { start: 22 * 60, end: 7 * 60 }; // minutes after local midnight
export const LIGHTS_ON_ASLEEP_HAPPINESS = 3; // per hour drained while asleep with lights on
export const WAKE_HAPPINESS_PENALTY = 10;
export const STAY_AWAKE_AFTER_WAKE = HOUR; // woken during bedtime → stays up this long
export const NAP_ENERGY_THRESHOLD = 60; // lights off while awake → naps if energy below this
export const NAP_WAKE_ENERGY = 100;

// --- Calls / care mistakes / discipline --------------------------------------------
export const CALL_GRACE = 15 * MINUTE; // unanswered call becomes a care mistake after this
export const ACT_UP_CHANCE = 0.12; // per awake hour (child stage and up)
export const ACT_UP_DURATION = 15 * MINUTE;
export const SCOLD_DISCIPLINE = 25;
export const UNFAIR_SCOLD_HAPPINESS = -10;
export const START_DISCIPLINE = 0;

// --- Death --------------------------------------------------------------------------
export const ZERO_STAT_DEATH = 12 * HOUR;

// --- Life cycle -----------------------------------------------------------------------
export const STAGE_DURATION = {
  egg: 5 * MINUTE,
  baby: 1 * DAY,
  child: 2 * DAY,
  teen: 3 * DAY,
  adult: 7 * DAY,
} as const;
export const SENIOR_MIN = 3 * DAY;
export const SENIOR_MAX = 5 * DAY;
export const EGG_WARM_PER_TAP = 3_000; // ms of hatch progress per tap
export const EGG_WARM_MAX = 150_000; // taps can at most halve the 5-minute hatch

// --- Evolution ---------------------------------------------------------------------------
export const CARE_MISTAKE_PENALTY = 8;
export const IGNORED_ACT_PENALTY = 3;
export const DISCIPLINE_WEIGHT = 0.1; // score bonus per discipline point (0–100)
export const STAR_SCORE = 75;
export const GRUMPY_SCORE = 45;

// --- Coins -------------------------------------------------------------------------------
export const SURVIVAL_COINS_PER_DAY = 10;
export const START_COINS = 20;

// --- Storage -------------------------------------------------------------------------------
export const LOG_LIMIT = 50;
export const MEMORIAL_LIMIT = 40;
export const SNACK_HISTORY_LIMIT = 8;
