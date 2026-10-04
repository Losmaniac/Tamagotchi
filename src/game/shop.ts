// Cosmetic-only shop catalog. Coins are earned in-game; no real money.

export const ITEM_SLOTS = ['hat', 'glasses', 'scarf', 'background'] as const;
export type ItemSlot = (typeof ITEM_SLOTS)[number];

export interface ShopItem {
  id: string;
  slot: ItemSlot;
  price: number;
  /** Main color used by the 3D accessory / background. */
  color: string;
  accent?: string;
}

export const SHOP_ITEMS = [
  { id: 'partyHat', slot: 'hat', price: 30, color: '#ff6fb5', accent: '#ffd23f' },
  { id: 'beanie', slot: 'hat', price: 40, color: '#4cc9f0', accent: '#ffffff' },
  { id: 'flowerCrown', slot: 'hat', price: 60, color: '#3ddc97', accent: '#ff8fc7' },
  { id: 'crown', slot: 'hat', price: 120, color: '#ffd23f', accent: '#ff4d6d' },
  { id: 'roundGlasses', slot: 'glasses', price: 35, color: '#2b1a3d' },
  { id: 'sunglasses', slot: 'glasses', price: 50, color: '#1a1a2e', accent: '#7b2cbf' },
  { id: 'heartGlasses', slot: 'glasses', price: 70, color: '#ff4d6d' },
  { id: 'redScarf', slot: 'scarf', price: 30, color: '#ff4d6d' },
  { id: 'stripedScarf', slot: 'scarf', price: 45, color: '#8b5cf6', accent: '#ffd23f' },
  { id: 'bowtie', slot: 'scarf', price: 40, color: '#4361ee' },
  { id: 'bgSunset', slot: 'background', price: 60, color: '#ff9a8b', accent: '#ffd29d' },
  { id: 'bgForest', slot: 'background', price: 70, color: '#a8e6cf', accent: '#dcedc1' },
  { id: 'bgCandy', slot: 'background', price: 80, color: '#ffc6ff', accent: '#bde0fe' },
  { id: 'bgSpace', slot: 'background', price: 100, color: '#3a0ca3', accent: '#7209b7' },
] as const satisfies readonly ShopItem[];

export type ItemId = (typeof SHOP_ITEMS)[number]['id'];

export function getItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

export function isItemId(id: unknown): id is ItemId {
  return typeof id === 'string' && SHOP_ITEMS.some((i) => i.id === id);
}

export interface Inventory {
  owned: ItemId[];
  equipped: Partial<Record<ItemSlot, ItemId>>;
}
