import React, { useMemo } from 'react';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants';
import { CustomAsset, AssetConfig, StewardData } from '../types';

const ISO_GRASS_URL = "https://town.trib.re/assets/tiles/tile_grass.png"; 

interface TileProps {
  x: number;
  y: number;
  type: number;
  isEditing: boolean;
  assetConfigs: Record<number, AssetConfig>; // Passed from parent state
  customAssets: CustomAsset[];
  data?: StewardData; // Specific data for this tile, including image override
  onClick: (x: number, y: number) => void;
  seed: number;
}

const Tile: React.FC<TileProps> = ({ x, y, type, isEditing, assetConfigs, customAssets, data, onClick, seed }) => {
  
  // Calculate Screen Position
  const screenX = (x - y) * (TILE_WIDTH / 2);
  const screenY = (x + y) * (TILE_HEIGHT / 2);
  
  // Standard Isometric Layering:
  // Tiles with higher x+y (closer to bottom of screen/viewer) cover tiles behind them.
  const zIndex = x + y;

  // Determine Content
  const baseConfig = assetConfigs[type];
  const customAsset = customAssets.find(a => a.id === type);
  
  // Handle Image Override from Tile Data
  const overrideImage = data?.imageUrl;

  // Determine Decor (only on Grass type 0)
  let DecorComponent = null;
  // Use override image or check if it is explicitly standard grass
  if (type === 0 && !overrideImage) {
    // Deterministic random based on position and seed
    const pseudoRandom = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    const val = pseudoRandom - Math.floor(pseudoRandom);
    
    if (val < 0.35) { // 35% chance
        let decorSrc = "";
        let width = 100;
        let height = 100;
        let mt = -50;
        let ml = 0;

        if (val < 0.15) {
            // Tree
            decorSrc = "https://town.trib.re/assets/tiles/tile-trees.png";
            width = 100; height= 100; mt = -50;
        } else if (val < 0.25) {
             // Rock
            decorSrc = "https://town.trib.re/assets/tiles/tile-pond.png";
            width = 100; height=100; mt = -50;
        } else {
             // Flowers
            decorSrc = "https://town.trib.re/assets/tiles/tile-flowers.png";
            width = 100; height=100; mt = -50;
        }
        
        DecorComponent = (
            <div 
                className="absolute pointer-events-none"
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    marginTop: `${mt}px`,
                    marginLeft: `${ml}px`,
                    backgroundImage: `url(${decorSrc})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'bottom center',
                    zIndex: zIndex + 5
                }}
            />
        );
    }
  }

  // Handle Void
  if (type === -1) {
    if (!isEditing) return null;
    return (
      <div
        onClick={() => onClick(x, y)}
        className="absolute cursor-pointer border border-dashed border-white/20 bg-white/5 hover:bg-red-500/20 hover:border-red-500 transition-colors"
        style={{
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${TILE_WIDTH}px`,
          height: `${TILE_HEIGHT}px`,
          zIndex: zIndex,
          transform: 'skewY(0deg)',
        }}
      />
    );
  }

  // We check if we should render the "Structure" layer.
  // If the tile is standard Grass (type 0 with no override), the base floor div already displays the grass image.
  // Rendering it again in the structure layer is redundant and can cause visual artifacts.
  // However, if there is an override image (custom data), we must render it.
  const isStandardGrass = type === 0 && !overrideImage;
  const showStructureLayer = (baseConfig || overrideImage) && !isStandardGrass;

  return (
    <div
      onClick={() => onClick(x, y)}
      className="absolute group"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: zIndex,
      }}
    >
      {/* FLOOR TILE - Always renders grass floor base */}
      <div 
        className="absolute w-[100px] h-[100px] -mt-[50px] cursor-pointer transition-filter duration-200 group-hover:brightness-110"
        style={{
            backgroundImage: `url(${ISO_GRASS_URL})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
        }}
      />

      {/* STRUCTURE / ASSET */}
      {showStructureLayer && (
         <div 
            className="absolute pointer-events-auto transition-transform duration-200 ease-out group-hover:scale-105 group-hover:-translate-y-1 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] group-hover:z-[9999]"
            style={{
                width: baseConfig ? `${baseConfig.width}px` : '100px',
                height: baseConfig ? `${baseConfig.height}px` : '100px',
                marginTop: baseConfig ? `${baseConfig.marginTop}px` : '-50px',
                marginLeft: baseConfig && baseConfig.marginLeft ? `${baseConfig.marginLeft}px` : '0px',
                backgroundImage: `url(${overrideImage || baseConfig?.src})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'bottom center',
                zIndex: zIndex + 10,
                ...(baseConfig?.style || {})
            }}
         />
      )}

      {/* CUSTOM ASSET (Generic Types added via UI that don't have asset configs) */}
      {customAsset && !overrideImage && !baseConfig && (
        <div 
            className="absolute pointer-events-auto transition-transform duration-200 ease-out group-hover:scale-105 group-hover:-translate-y-1 group-hover:z-[9999]"
            style={{
                width: `100px`,
                height: `100px`,
                marginTop: `-50px`,
                backgroundImage: `url(${customAsset.icon})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'bottom center',
                zIndex: zIndex + 10,
            }}
        />
      )}

      {/* DECOR */}
      {DecorComponent}
    </div>
  );
};

export default React.memo(Tile);