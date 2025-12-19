import React from 'react';

export interface User {
  username: string;
  roles: string[]; // 'member' | 'admin' | 'contributor' | 'foundation' | 'steward'
}

export interface StewardData {
  name: string;
  role: string;
  bio: string;
  link: string;
  actionText: string;
  imageUrl?: string; // Allow per-tile image override
  labels?: string[]; // Array of tags for categorization
}

export interface CustomAsset {
  id: number;
  name: string;
  icon: string;
  isCustom: boolean;
}

export interface Tool {
  id: number;
  name: string;
  icon?: string;
  style?: React.CSSProperties;
  label?: string;
}

export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

export interface AssetConfig {
  src: string;
  width: number;
  height: number;
  marginTop: number;
  marginLeft?: number;
  style?: React.CSSProperties;
}

export interface TownData {
    grid: number[][];
    tileData: Record<string, StewardData>;
    customAssets: CustomAsset[];
    assetConfigs: Record<number, AssetConfig>;
    cloudImage?: string;
}

export interface TownVersion {
  id: string;
  name: string;
  isDefault: boolean;
  isPublic: boolean;
  lastModified: number;
  fileUrl?: string; // Path to the JSON file relative to root (e.g. "towns/main.json")
  data: TownData;
}