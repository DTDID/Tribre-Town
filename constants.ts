import { StewardData, AssetConfig, Tool, CustomAsset } from './types';
import { DEFAULT_TOWN_DATA } from './defaultTownData';

// --- CONFIGURATION ---
// Safely access environment variables to prevent crashes if process is undefined
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return process.env[key];
  } catch (e) {
    return undefined;
  }
};

export const CLERK_PUBLISHABLE_KEY = getEnv('CLERK_PUBLISHABLE_KEY') || "";

// --- ASSETS (UI PALETTE REFERENCES) ---
const ASSETS = {
  GRASS: "https://town.trib.re/assets/tiles/tile_grass.png", 
  BUILDER: "https://town.trib.re/assets/tiles/tile-clock-building.png", 
  NURTURER: "https://town.trib.re/assets/tiles/tile-house-a.png",
  HUB: "https://town.trib.re/assets/tiles/tile-wisdom-square.png",
  SCRIBE: "https://town.trib.re/assets/tiles/tile-books.png",
  VISIONARY: "https://town.trib.re/assets/tiles/tile-observatory.png",
  TREE: "https://town.trib.re/assets/tiles/tile-trees.png",
  ROCK: "https://town.trib.re/assets/tiles/tile-pond.png",
  FLOWERS: "https://town.trib.re/assets/tiles/tile-flowers.png",
};

// Simulated Asset Scan from "assets/tiles"
export const THEMED_ASSETS: Record<string, { name: string, url: string }[]> = {
  "Structures": [
    { name: "Builder House", url: ASSETS.BUILDER },
    { name: "Nurturer House", url: ASSETS.NURTURER },
    { name: "Hub Center", url: ASSETS.HUB },
    { name: "Scribe House", url: ASSETS.SCRIBE },
    { name: "Visionary House", url: ASSETS.VISIONARY },
  ],
  "Nature": [
    { name: "Pine Tree", url: ASSETS.TREE },
    { name: "Grey Rock", url: ASSETS.ROCK },
    { name: "Wild Flowers", url: ASSETS.FLOWERS },
  ],
  "Base": [
    { name: "Grass Tile", url: ASSETS.GRASS },
  ]
};

// --- INITIAL STATE FROM DEFAULT TOWN DATA ---
export const INITIAL_GRID = DEFAULT_TOWN_DATA.grid;
export const INITIAL_STEWARD_DATA = DEFAULT_TOWN_DATA.tileData;
export const INITIAL_ASSET_CONFIGS = DEFAULT_TOWN_DATA.assetConfigs;
export const INITIAL_CUSTOM_ASSETS = DEFAULT_TOWN_DATA.customAssets;

export const TOOL_SELECT_ID = -99; // Special ID for the "Cursor" tool

export const TOOLS: Tool[] = [
  { id: TOOL_SELECT_ID, name: 'Select / Edit', label: 'EDIT', style: { border: '2px dashed yellow' } },
  { id: 0, name: 'Grass', label: 'Grass' },
  { id: -1, name: 'Void', label: 'VOID' },
  { id: 1, name: 'Builder' },
  { id: 4, name: 'Nurturer' },
  { id: 5, name: 'Scribe' },
  { id: 6, name: 'Visionary' },
  { id: 2, name: 'Hub' },
  { id: 3, name: 'Stream', style: { filter: 'hue-rotate(180deg)' } },
];

export const TILE_WIDTH = 93;
export const TILE_HEIGHT = 100;
export const DECOR_DENSITY = 0.85;