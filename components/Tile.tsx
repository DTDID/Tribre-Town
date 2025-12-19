import React, { useMemo } from 'react';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants';
import { CustomAsset, AssetConfig, StewardData } from '../types';

const ISO_GRASS_URL = "https://town.trib.re/assets/tiles/tile_grass.png"; 

interface TileProps {
  x: number;
  y: number;
  type: number;
  isEditing: boolean;
  assetConfigs: Record<number, AssetConfig>; 
  customAssets: CustomAsset[];
  data?: StewardData; 
  onClick: (x: number, y: number) => void;
  seed: number;
  activeFilters?: string[]; // Global filters from App state
}

const Tile: React.FC<TileProps> = ({ x, y, type, isEditing, assetConfigs, customAssets, data, onClick, seed, activeFilters = [] }) => {
  
  // Calculate Screen Position
  const screenX = (x - y) * (TILE_WIDTH / 2);
  const screenY = (x + y) * (TILE_HEIGHT / 2);
  
  // Standard Isometric Layering
  const zIndex = x + y;

  // Determine Content
  const baseConfig = assetConfigs[type];
  const customAsset = customAssets.find(a => a.id === type);
  const overrideImage = data?.imageUrl;

  // Filtering Logic: If filters are active, check if this tile matches any
  const isFilteredOut = useMemo(() => {
    if (activeFilters.length === 0) return false;
    if (!data || !data.labels) return true;
    return !activeFilters.some(filter => data.labels?.includes(filter));
  }, [activeFilters, data]);

  // Determine Decor (only on Grass type 0)
  let DecorComponent = null;
  if (type === 0 && !overrideImage) {
    const pseudoRandom = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    const val = pseudoRandom - Math.floor(pseudoRandom);
    
    if (val < 0.35) {
        let decorSrc = "";
        let width = 100;
        let height = 100;
        let mt = -50;
        let ml = 0;

        if (val < 0.15) {
            decorSrc = "https://town.trib.re/assets/tiles/tile-trees.png";
        } else if (val < 0.25) {
            decorSrc = "https://town.trib.re/assets/tiles/tile-pond.png";
        } else {
            decorSrc = "https://town.trib.re/assets/tiles/tile-flowers.png";
        }
        
        DecorComponent = (
            <div 
                className="absolute pointer-events-none transition-opacity duration-500"
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    marginTop: `${mt}px`,
                    marginLeft: `${ml}px`,
                    backgroundImage: `url(${decorSrc})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'bottom center',
                    zIndex: zIndex + 5,
                    opacity: isFilteredOut ? 0.3 : 1,
                    filter: isFilteredOut ? 'grayscale(1)' : 'none'
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
          opacity: isFilteredOut ? 0.1 : 1
        }}
      />
    );
  }

  const isStandardGrass = type === 0 && !overrideImage;
  const showStructureLayer = (baseConfig || overrideImage) && !isStandardGrass;

  return (
    <div
      onClick={() => onClick(x, y)}
      className="absolute group transition-all duration-500"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: zIndex,
        opacity: isFilteredOut ? 0.4 : 1,
        filter: isFilteredOut ? 'grayscale(0.8) blur(0.5px)' : 'none',
        pointerEvents: isFilteredOut ? 'none' : 'auto'
      }}
    >
      {/* FLOOR TILE */}
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

      {/* CUSTOM ASSET */}
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