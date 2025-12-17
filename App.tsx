import React, { useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_GRID, INITIAL_STEWARD_DATA, INITIAL_ASSET_CONFIGS, INITIAL_CUSTOM_ASSETS, TOOL_SELECT_ID, TOOLS, TILE_WIDTH, TILE_HEIGHT } from './constants';
import { DEFAULT_TOWN_DATA } from './defaultTownData';
import { CameraState, CustomAsset, StewardData, AssetConfig, TownVersion } from './types';
import Tile from './components/Tile';
import AdminToolbar from './components/AdminToolbar';
import CloudLayer from './components/CloudLayer';
import LoginModal from './components/LoginModal';
import UserMenu from './components/UserMenu';
import { useAuth } from './contexts/AuthContext';
import { fetchTownManifest, fetchTownContent, downloadTownData, downloadManifest } from './services/db';
import { X, ExternalLink, LocateFixed, Hammer, Check, Loader2, Map as MapIcon, ChevronDown } from 'lucide-react';

const App: React.FC = () => {
  // --- STATE ---
  const [grid, setGrid] = useState<number[][]>(INITIAL_GRID);
  const [tileData, setTileData] = useState<Record<string, StewardData>>(INITIAL_STEWARD_DATA);
  const [assetConfigs, setAssetConfigs] = useState<Record<number, AssetConfig>>(INITIAL_ASSET_CONFIGS);
  const [customAssets, setCustomAssets] = useState<CustomAsset[]>(INITIAL_CUSTOM_ASSETS);
  const [cloudImage, setCloudImage] = useState<string>(DEFAULT_TOWN_DATA.cloudImage || '');
  
  // Versions
  const [townVersions, setTownVersions] = useState<TownVersion[]>([]);
  const [currentTownId, setCurrentTownId] = useState<string>('default');

  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [editMode, setEditMode] = useState(false);
  const [currentTool, setCurrentTool] = useState(TOOL_SELECT_ID);
  
  const [selectedCoord, setSelectedCoord] = useState<{x: number, y: number} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- AUTH & DB STATE ---
  const { user, hasRole, login, isDemo } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTownSwitcher, setShowTownSwitcher] = useState(false);

  // --- BACKGROUND STATE ---
  const [bgStyle, setBgStyle] = useState<React.CSSProperties>({ backgroundColor: '#1a1a2e' });

  // --- REFS ---
  const viewportRef = useRef<HTMLDivElement>(null);
  const clickStartRef = useRef<{x: number, y: number} | null>(null);
  
  const touchRef = useRef<{
    lastDist: number | null;
    lastPan: { x: number, y: number } | null;
  }>({
    lastDist: null,
    lastPan: null
  });

  // --- TIME OF DAY LOGIC ---
  useEffect(() => {
    const updateBackground = () => {
        const now = new Date();
        const hour = now.getHours();
        if (hour >= 6 && hour < 8) {
             setBgStyle({ background: 'linear-gradient(to bottom, #2c3e50, #4ca1af, #ff9966)' });
        } else if (hour >= 8 && hour < 17) {
             setBgStyle({ background: 'linear-gradient(to bottom, #2980b9, #6dd5fa, #ffffff)' });
        } else if (hour >= 17 && hour < 20) {
             setBgStyle({ background: 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364, #ff7e5f)' });
        } else {
             setBgStyle({ backgroundColor: '#1a1a2e' });
        }
    };
    updateBackground();
    const interval = setInterval(updateBackground, 60000); 
    return () => clearInterval(interval);
  }, []);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const init = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Manifest
            const versions = await fetchTownManifest();
            setTownVersions(versions);

            // 2. Determine Initial Town
            const defaultTown = versions.find(v => v.isDefault) || versions[0];
            
            // 3. Load Content
            if (defaultTown) {
                await loadTownContent(defaultTown, versions);
            }

        } catch (error) {
            console.error("Initialization failed:", error);
            setIsLoading(false);
        }
    };
    init();
  }, []);

  // --- TOWN LOADING LOGIC ---
  
  const loadTownContent = async (targetTown: TownVersion, currentList: TownVersion[]) => {
      let data = targetTown.data;
      
      // If data is placeholder AND we have a URL, fetch it
      const isPlaceholder = data === DEFAULT_TOWN_DATA;
      
      setIsLoading(true);
      const startTime = Date.now();

      if (targetTown.fileUrl && isPlaceholder) {
          const fetchedData = await fetchTownContent(targetTown.fileUrl);
          if (fetchedData) {
              data = fetchedData;
              // Cache the fetched data in the local list
              const newList = currentList.map(v => v.id === targetTown.id ? { ...v, data: fetchedData } : v);
              setTownVersions(newList);
          } else {
              console.warn(`Failed to load town data from ${targetTown.fileUrl}. Using defaults.`);
          }
      }

      // Sync state with town data
      setCurrentTownId(targetTown.id);
      setGrid(data.grid || INITIAL_GRID);
      setTileData(data.tileData || INITIAL_STEWARD_DATA);
      setCustomAssets(data.customAssets || []);
      setAssetConfigs(data.assetConfigs || INITIAL_ASSET_CONFIGS);
      setCloudImage(data.cloudImage || '');
      
      // Ensure loading screen is visible for at least 3 seconds (3000ms)
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      setIsLoading(false);
  };

  const handleLoadTown = async (id: string) => {
      const town = townVersions.find(v => v.id === id);
      if (!town) return;
      
      await loadTownContent(town, townVersions);
      
      setEditMode(false);
      setIsSidebarOpen(false);
      setShowTownSwitcher(false);
  };

  // --- SAVE / MANAGE FUNCTIONS ---

  const handleDownloadMap = () => {
      const currentTown = townVersions.find(v => v.id === currentTownId);
      const filename = currentTown?.fileUrl ? currentTown.fileUrl.split('/').pop() || 'town.json' : 'town.json';
      const currentData = { grid, tileData, customAssets, assetConfigs, cloudImage };
      downloadTownData(filename, currentData);
  };

  const handleDownloadManifest = () => {
      downloadManifest(townVersions);
  };

  const handleSaveAs = (name: string) => {
      if (!user || !hasRole('admin')) return;
      const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newEntry: TownVersion = {
          id: newId,
          name: name,
          isDefault: false,
          isPublic: false,
          lastModified: Date.now(),
          fileUrl: `towns/${newId}.json`,
          data: { grid: [...grid], tileData: {...tileData}, customAssets: [...customAssets], assetConfigs: {...assetConfigs}, cloudImage }
      };
      setTownVersions(prev => [...prev, newEntry]);
      setCurrentTownId(newId);
      alert(`Entry added. Download Map and Config to save permanently.`);
  };

  const handleRegisterTown = (name: string, path: string) => {
      if (!user || !hasRole('admin')) return;
      const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newEntry: TownVersion = {
          id: newId,
          name: name,
          isDefault: false,
          isPublic: false,
          lastModified: Date.now(),
          fileUrl: path,
          data: DEFAULT_TOWN_DATA
      };
      setTownVersions(prev => [...prev, newEntry]);
      alert(`Link added. Download Config to save permanently.`);
  };

  // --- CAMERA LOGIC ---
  const centerMap = useCallback(() => {
    const rows = grid.length;
    const cols = grid[0].length;
    const centerX = (rows - 1) / 2;
    const centerY = (cols - 1) / 2;
    const isoCenterX = (centerX - centerY) * (TILE_WIDTH / 2);
    const isoCenterY = (centerX + centerY) * (TILE_HEIGHT / 2);
    setCamera({
      x: (window.innerWidth / 2) - isoCenterX,
      y: (window.innerHeight / 2) - isoCenterY,
      scale: 1
    });
  }, [grid]);

  useEffect(() => {
    centerMap();
    window.addEventListener('resize', centerMap);
    return () => window.removeEventListener('resize', centerMap);
  }, [centerMap]);

  // --- INPUT HANDLERS ---
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) { 
        e.preventDefault(); 
        const newScale = Math.min(Math.max(0.4, camera.scale - (e.deltaY * 0.002)), 3); 
        setCamera(prev => ({ ...prev, scale: newScale })); 
    } else { 
        setCamera(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY })); 
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => { 
      if ((e.target as HTMLElement).closest('.ui-layer')) return; 
      setIsDragging(true); 
      setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y }); 
      clickStartRef.current = { x: e.clientX, y: e.clientY }; 
  };
  
  const handleMouseMove = (e: React.MouseEvent) => { 
      if (!isDragging) return; 
      setCamera({ ...camera, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); 
  };
  
  const handleMouseUp = () => setIsDragging(false);

  const handleTileClick = useCallback((x: number, y: number) => {
    if (editMode) {
      if (currentTool === TOOL_SELECT_ID) { setSelectedCoord({ x, y }); setIsSidebarOpen(true); } 
      else { const newGrid = [...grid.map(row => [...row])]; newGrid[x][y] = currentTool; setGrid(newGrid); }
    } else {
      const type = grid[x][y];
      if ((type > 0 || tileData[`${x}_${y}`]) && type !== -1) { setSelectedCoord({ x, y }); setIsSidebarOpen(true); } 
      else { setSelectedCoord(null); setIsSidebarOpen(false); }
    }
  }, [editMode, grid, currentTool, tileData]);

  const onTileClickWrapper = (x: number, y: number) => {
     if (!clickStartRef.current) return;
     const dx = Math.abs(clickStartRef.current.x - (touchRef.current.lastPan?.x || clickStartRef.current.x));
     const dy = Math.abs(clickStartRef.current.y - (touchRef.current.lastPan?.y || clickStartRef.current.y));
     if (dx < 5 && dy < 5) handleTileClick(x, y);
  };

  const updateTileData = (field: keyof StewardData, value: string) => {
    if (!selectedCoord) return;
    const id = `${selectedCoord.x}_${selectedCoord.y}`;
    setTileData(prev => ({ ...prev, [id]: { ...(prev[id] || { name: 'New', role: 'Role', bio: '', link: '#', actionText: 'Act' }), [field]: value } }));
  };

  const updateTileType = (newType: number) => {
    if (!selectedCoord) return;
    const newGrid = [...grid.map(row => [...row])];
    newGrid[selectedCoord.x][selectedCoord.y] = newType;
    setGrid(newGrid);
  };

  // --- UI HELPERS ---
  const getSelectedData = () => selectedCoord ? tileData[`${selectedCoord.x}_${selectedCoord.y}`] : null;
  const selectedType = selectedCoord ? grid[selectedCoord.x][selectedCoord.y] : 0;
  const canEdit = hasRole('admin');
  const visibleTowns = canEdit ? townVersions : townVersions.filter(t => t.isPublic);
  const currentTownName = townVersions.find(t => t.id === currentTownId)?.name || "Town Builder";

  return (
    <div className="relative w-screen h-screen overflow-hidden transition-colors duration-1000" style={bgStyle}>
      {/* FULL SCREEN LOADING SCREEN */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-[#1a1a2e] flex flex-col items-center justify-center animate-in fade-in duration-700">
          <div className="relative flex flex-col items-center gap-12">
            {/* The Animated Sign */}
            <div className="relative animate-bounce duration-[2500ms] transition-all">
              <img 
                src="https://town.trib.re/assets/tribre-town-sign.png" 
                alt="Loading Tribre Town..." 
                className="w-64 md:w-96 h-auto drop-shadow-[0_0_50px_rgba(233,69,96,0.4)] filter brightness-110"
              />
            </div>
            
            {/* Loading Indicator and Text */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-16 h-16">
                 <Loader2 size={64} className="animate-spin text-[#e94560]" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-white text-xl font-black tracking-[0.4em] uppercase animate-pulse">
                  Entering Town
                </span>
                <div className="flex gap-1.5">
                   <div className="w-2 h-2 bg-[#e94560] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-2 h-2 bg-[#e94560] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-2 h-2 bg-[#e94560] rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Background decoration for the loader */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#e94560] rounded-full blur-[140px] animate-pulse"></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0f3460] rounded-full blur-[140px] animate-pulse [animation-delay:1.5s]"></div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2e2e4a 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
      <CloudLayer customImage={cloudImage} />

      <div ref={viewportRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      >
        <div className="absolute top-0 left-0 w-0 h-0 will-change-transform" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}>
            {grid.map((row, x) => row.map((type, y) => (
                <Tile key={`${x}_${y}`} x={x} y={y} type={type} isEditing={editMode} assetConfigs={assetConfigs} customAssets={customAssets} data={tileData[`${x}_${y}`]} onClick={onTileClickWrapper} seed={x * grid.length + y} />
            )))}
        </div>
      </div>

      <div className="ui-layer pointer-events-none absolute inset-0 z-50">
        <UserMenu onLoginClick={() => { if (isDemo) login(); else setShowLoginModal(true); }} />

        {/* LOGO AND ACTIONS CONTAINER (Consolidated top-left UI) */}
        {!showLoginModal && !isLoading && (
            <div className="pointer-events-auto fixed top-5 left-5 flex items-center gap-6 z-[60] animate-in slide-in-from-left duration-500">
                {/* Logo - Hidden for admins/stewards to clear space for Edit button and Admin Panel */}
                {!canEdit && !editMode && (
                  <div className="flex-shrink-0 select-none">
                      {/* Big version for desktop - Doubled size to h-64 */}
                      <img 
                          src="https://town.trib.re/assets/tribre-town-sign.png" 
                          alt="Tribre Steward Town" 
                          className="hidden md:block h-64 w-auto filter drop-shadow-lg"
                          onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                      />
                      {/* Small version for mobile and tablet */}
                      <img 
                          src="https://town.trib.re/assets/tribre-town-hex.png" 
                          alt="Tribre Town Hex" 
                          className="block md:hidden h-12 w-auto filter drop-shadow-lg"
                          onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                      />
                  </div>
                )}

                {canEdit && (
                    <button 
                        onClick={() => { setEditMode(!editMode); if (!editMode) setCurrentTool(TOOL_SELECT_ID); else setIsSidebarOpen(false); }} 
                        className={`px-4 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 ${editMode ? 'bg-[#e94560] border border-[#ff6b81]' : 'bg-[#2a2a40] border border-[#4a4a60] hover:bg-[#3a3a50]'}`}
                    >
                        {editMode ? <Check size={18} /> : <Hammer size={18} />} {editMode ? 'Done' : 'Edit'}
                    </button>
                )}
            </div>
        )}

        {!isLoading && visibleTowns.length > 1 && (
            <div className="pointer-events-auto fixed top-5 left-1/2 -translate-x-1/2 flex flex-col items-center">
                 <button onClick={() => setShowTownSwitcher(!showTownSwitcher)} className="bg-[#1e1e2e]/90 backdrop-blur border border-[#444] hover:border-[#e94560] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all group">
                     <MapIcon size={16} className="text-[#e94560]" /> <span className="font-bold text-sm">{currentTownName}</span> <ChevronDown size={14} className={`text-gray-400 transition-transform ${showTownSwitcher ? 'rotate-180' : ''}`} />
                 </button>
                 {showTownSwitcher && (
                     <div className="mt-2 bg-[#1e1e2e] border border-[#444] rounded-xl shadow-xl overflow-hidden w-64 animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto">
                         {visibleTowns.map(t => (
                             <button key={t.id} onClick={() => handleLoadTown(t.id)} className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-[#2a2a40] transition-colors border-b border-[#333] last:border-0 ${t.id === currentTownId ? 'bg-[#2a2a40] text-white' : 'text-gray-300'}`}>
                                 <span>{t.name}</span> {t.id === currentTownId && <Check size={14} className="text-[#e94560]" />}
                             </button>
                         ))}
                     </div>
                 )}
            </div>
        )}

        {editMode && (
            <div className="pointer-events-auto">
                <AdminToolbar 
                    currentView="creator" currentTool={currentTool} onSelectTool={setCurrentTool} customAssets={customAssets} assetConfigs={assetConfigs}
                    onUploadAsset={() => {}} onAddRemoteAsset={() => {}}
                    onSaveUpdate={handleDownloadMap} onSaveAs={handleSaveAs} onRegisterTown={handleRegisterTown} onDownloadManifest={handleDownloadManifest}
                    onExport={() => {}} onImport={() => {}} cloudImage={cloudImage} onCloudImageChange={setCloudImage}
                    versions={townVersions} currentTownId={currentTownId} onLoadTown={handleLoadTown} onSetDefault={() => {}} onTogglePublic={() => {}} onDeleteTown={() => {}}
                />
            </div>
        )}

        <button onClick={centerMap} className="pointer-events-auto fixed bottom-8 right-8 w-12 h-12 rounded-full bg-[#0f3460] border-2 border-[#e94560] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40" title="Reset Camera">
            <LocateFixed size={24} />
        </button>

        <div className={`pointer-events-auto fixed top-20 right-5 w-[300px] max-h-[85vh] bg-[#1e1e2e]/95 backdrop-blur-md border border-[#444] rounded-xl shadow-2xl z-[90] flex flex-col transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
            <div className="flex flex-col h-full relative overflow-hidden rounded-xl">
                <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-white hover:text-[#e94560] z-20"> <X size={24} /> </button>
                {!editMode && selectedCoord && (
                    <> {getSelectedData() ? (
                        <> <div className="bg-[#0f3460] p-6 pt-12 relative flex-shrink-0"> <h2 className="text-2xl font-bold m-0">{getSelectedData()?.name}</h2> <span className="inline-block mt-2 bg-[#e94560] px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"> {getSelectedData()?.role} </span> </div>
                           <div className="p-6 flex-1 overflow-y-auto custom-scrollbar"> <p className="text-gray-300 leading-relaxed mb-6">{getSelectedData()?.bio}</p> <div className="bg-[#1a1a2e] p-4 rounded-lg border border-[#333]"> <a href={getSelectedData()?.link} target="_blank" rel="noreferrer" className="block w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-center rounded-lg font-bold hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2"> {getSelectedData()?.actionText || 'View'} <ExternalLink size={16} /> </a> </div> </div> </>
                    ) : ( <div className="p-6 text-gray-400 text-center mt-20 italic">No steward data for this tile.</div> )} </>
                )}
                {editMode && selectedCoord && (
                    <div className="flex flex-col h-full bg-[#1e1e2e]">
                        <div className="bg-[#2a2a40] p-4 pt-12 border-b border-[#444] flex-shrink-0"> <h2 className="text-lg font-bold text-[#ffd700]">Edit Tile</h2> <small className="text-gray-400">({selectedCoord.x}, {selectedCoord.y})</small> </div>
                        <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Tile Type</label> <select className="w-full bg-[#111] border border-[#444] rounded p-2 text-white" value={selectedType} onChange={(e) => updateTileType(parseInt(e.target.value))}> <option value={-1}>Empty (Void)</option> <option value={0}>Blank (Grass)</option> <optgroup label="Assets"> {TOOLS.filter(t => t.id > 0).map(t => ( <option key={t.id} value={t.id}>{t.name}</option> ))} </optgroup> </select> </div>
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Name</label> <input className="w-full bg-[#111] border border-[#444] rounded p-2 text-white" value={getSelectedData()?.name || ''} onChange={(e) => updateTileData('name', e.target.value)} /> </div>
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Role</label> <input className="w-full bg-[#111] border border-[#444] rounded p-2 text-white" value={getSelectedData()?.role || ''} onChange={(e) => updateTileData('role', e.target.value)} /> </div>
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Bio</label> <textarea className="w-full bg-[#111] border border-[#444] rounded p-2 text-white h-24 resize-none" value={getSelectedData()?.bio || ''} onChange={(e) => updateTileData('bio', e.target.value)} /> </div>
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Action Link</label> <input className="w-full bg-[#111] border border-[#444] rounded p-2 text-white" value={getSelectedData()?.link || ''} onChange={(e) => updateTileData('link', e.target.value)} /> </div>
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Action Text</label> <input className="w-full bg-[#111] border border-[#444] rounded p-2 text-white" value={getSelectedData()?.actionText || ''} onChange={(e) => updateTileData('actionText', e.target.value)} placeholder="e.g. View Project" /> </div>
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Image URL Override</label> <input className="w-full bg-[#111] border border-[#444] rounded p-2 text-white" value={getSelectedData()?.imageUrl || ''} onChange={(e) => updateTileData('imageUrl', e.target.value)} placeholder="https://..." /> </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      </div>
    </div>
  );
};
export default App;