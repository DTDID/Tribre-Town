
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { INITIAL_GRID, INITIAL_STEWARD_DATA, INITIAL_ASSET_CONFIGS, INITIAL_CUSTOM_ASSETS, TOOL_SELECT_ID, TOOLS, TILE_WIDTH, TILE_HEIGHT, THEMED_ASSETS } from './constants';
import { DEFAULT_TOWN_DATA } from './defaultTownData';
import { CameraState, CustomAsset, StewardData, AssetConfig, TownVersion } from './types';
import Tile from './components/Tile';
import AdminToolbar from './components/AdminToolbar';
import CloudLayer from './components/CloudLayer';
import UserMenu from './components/UserMenu';
import { useAuth } from './contexts/AuthContext';
import { fetchTownManifest, fetchTownContent, downloadTownData, downloadManifest } from './services/db';
import { X, ExternalLink, LocateFixed, Hammer, Check, Loader2, Map as MapIcon, ChevronDown, Tag, Plus } from 'lucide-react';

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
  const [labelInput, setLabelInput] = useState('');

  // Global Label Filters
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // --- AUTH & DB STATE ---
  const { user, hasRole, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // --- BACKGROUND STATE ---
  const [bgStyle, setBgStyle] = useState<React.CSSProperties>({ backgroundColor: '#1a1a2e' });

  // --- REFS ---
  const viewportRef = useRef<HTMLDivElement>(null);
  const clickStartRef = useRef<{x: number, y: number} | null>(null);
  const touchRef = useRef<{ lastDist: number | null; lastPan: { x: number, y: number } | null; }>({ lastDist: null, lastPan: null });

  // --- TIME OF DAY LOGIC ---
  useEffect(() => {
    const updateBackground = () => {
        const now = new Date();
        const hour = now.getHours();
        if (hour >= 6 && hour < 8) setBgStyle({ background: 'linear-gradient(to bottom, #2c3e50, #4ca1af, #ff9966)' });
        else if (hour >= 8 && hour < 17) setBgStyle({ background: 'linear-gradient(to bottom, #2980b9, #6dd5fa, #ffffff)' });
        else if (hour >= 17 && hour < 20) setBgStyle({ background: 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364, #ff7e5f)' });
        else setBgStyle({ backgroundColor: '#1a1a2e' });
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
            let versions = await fetchTownManifest();
            
            // SANITIZATION: Ensure only one default exists. 
            // If multiple are true in JSON, keep the first one found and set others to false.
            let foundDefault = false;
            versions = versions.map(v => {
                if (v.isDefault) {
                    if (foundDefault) return { ...v, isDefault: false };
                    foundDefault = true;
                    return v;
                }
                return v;
            });
            
            setTownVersions(versions);
            const defaultTown = versions.find(v => v.isDefault) || versions[0];
            if (defaultTown) await loadTownContent(defaultTown, versions);
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
      const isPlaceholder = data === DEFAULT_TOWN_DATA;
      setIsLoading(true);
      const startTime = Date.now();
      if (targetTown.fileUrl && isPlaceholder) {
          const fetchedData = await fetchTownContent(targetTown.fileUrl);
          if (fetchedData) {
              data = fetchedData;
              const newList = currentList.map(v => v.id === targetTown.id ? { ...v, data: fetchedData } : v);
              setTownVersions(newList);
          }
      }
      setCurrentTownId(targetTown.id);
      setGrid(data.grid || INITIAL_GRID);
      setTileData(data.tileData || INITIAL_STEWARD_DATA);
      setCustomAssets(data.customAssets || []);
      setAssetConfigs(data.assetConfigs || INITIAL_ASSET_CONFIGS);
      setCloudImage(data.cloudImage || '');
      const remainingTime = Math.max(0, 3000 - (Date.now() - startTime));
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      setIsLoading(false);
  };

  const handleLoadTown = async (id: string) => {
      const town = townVersions.find(v => v.id === id);
      if (!town) return;
      await loadTownContent(town, townVersions);
      setEditMode(false);
      setIsSidebarOpen(false);
      setActiveFilters([]); 
  };

  const handleSetDefault = (id: string) => {
    // Logic: Only Public maps can be set as default.
    // Logic: Setting one as default unsets others.
    const town = townVersions.find(v => v.id === id);
    if (!town || !town.isPublic) return;

    setTownVersions(prev => prev.map(v => ({
      ...v,
      isDefault: v.id === id
    })));
  };

  const handleTogglePublic = (id: string) => {
    setTownVersions(prev => prev.map(v => {
      if (v.id === id) {
        const nextState = !v.isPublic;
        return { 
          ...v, 
          isPublic: nextState,
          // Logic: Private maps cannot be default. If turning private, unset default.
          isDefault: nextState ? v.isDefault : false
        };
      }
      return v;
    }));
  };

  // --- CAMERA LOGIC ---
  const centerMap = useCallback(() => {
    const rows = grid.length;
    const cols = grid[0].length;
    const isoCenterX = ((rows - 1) / 2 - (cols - 1) / 2) * (TILE_WIDTH / 2);
    const isoCenterY = ((rows - 1) / 2 + (cols - 1) / 2) * (TILE_HEIGHT / 2);
    setCamera({ x: (window.innerWidth / 2) - isoCenterX, y: (window.innerHeight / 2) - isoCenterY, scale: 1 });
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
        setCamera(prev => ({ ...prev, scale: Math.min(Math.max(0.4, prev.scale - (e.deltaY * 0.002)), 3) })); 
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
  
  const handleMouseMove = (e: React.MouseEvent) => { if (isDragging) setCamera({ ...camera, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
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

  // --- DATA UPDATE HELPERS ---
  const getSelectedData = useCallback(() => selectedCoord ? tileData[`${selectedCoord.x}_${selectedCoord.y}`] : null, [selectedCoord, tileData]);

  const updateTileData = (field: keyof StewardData, value: any) => {
    if (!selectedCoord) return;
    const id = `${selectedCoord.x}_${selectedCoord.y}`;
    setTileData(prev => ({ 
        ...prev, 
        [id]: { 
            ...(prev[id] || { name: 'New Steward', role: 'Role', bio: '', link: '#', actionText: 'Act' }), 
            [field]: value 
        } 
    }));
  };

  const addLabelToTile = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const data = getSelectedData();
    const currentLabels = data?.labels || [];
    if (!currentLabels.includes(trimmed)) { 
        updateTileData('labels', [...currentLabels, trimmed]); 
    }
    setLabelInput('');
  };

  const removeLabelFromTile = (label: string) => {
    const data = getSelectedData();
    const currentLabels = data?.labels || [];
    updateTileData('labels', currentLabels.filter(l => l !== label));
  };

  const updateTileType = (newType: number) => {
    if (!selectedCoord) return;
    const newGrid = [...grid.map(row => [...row])];
    newGrid[selectedCoord.x][selectedCoord.y] = newType;
    setGrid(newGrid);
  };

  const handleUploadAsset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const newId = 200 + customAssets.length + Math.floor(Math.random() * 1000);
      const newAsset: CustomAsset = { id: newId, name: file.name, icon: src, isCustom: true };
      setCustomAssets(prev => [...prev, newAsset]);
    };
    reader.readAsDataURL(file);
  };

  const handleAddRemoteAsset = (url: string) => {
    if (!url.trim()) return;
    const newId = 200 + customAssets.length + Math.floor(Math.random() * 1000);
    const newAsset: CustomAsset = { id: newId, name: 'Remote Asset', icon: url, isCustom: true };
    setCustomAssets(prev => [...prev, newAsset]);
  };

  // --- LABEL FILTER HELPERS ---
  const toggleGlobalFilter = (label: string) => {
    setActiveFilters(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  // --- UI HELPERS ---
  const selectedType = selectedCoord ? grid[selectedCoord.x][selectedCoord.y] : 0;
  const canEdit = hasRole('admin');
  
  const availableLabels = useMemo(() => {
    const labels = new Set<string>(Object.keys(THEMED_ASSETS));
    // Explicitly cast to StewardData[] because Object.values might be inferred as unknown[]
    (Object.values(tileData) as StewardData[]).forEach(data => { if (data.labels) data.labels.forEach(l => labels.add(l)); });
    return Array.from(labels).sort();
  }, [tileData]);

  const filteredSuggestions = useMemo(() => {
    const trimmed = labelInput.trim().toLowerCase();
    if (!trimmed) return [];
    return availableLabels.filter(l => l.toLowerCase().includes(trimmed) && !(getSelectedData()?.labels?.includes(l)));
  }, [availableLabels, labelInput, getSelectedData]);

  return (
    <div className="relative w-screen h-screen overflow-hidden transition-colors duration-1000" style={bgStyle}>
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-[#1a1a2e] flex flex-col items-center justify-center animate-in fade-in duration-700">
          <div className="relative flex flex-col items-center gap-12">
            <div className="relative animate-bounce duration-[2500ms] transition-all"> <img src="https://town.trib.re/assets/tribre-town-sign.png" alt="Loading..." className="w-64 md:w-96 h-auto drop-shadow-[0_0_50px_rgba(233,69,96,0.4)]" /> </div>
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-16 h-16"> <Loader2 size={64} className="animate-spin text-[#e94560]" /> </div>
              <div className="flex flex-col items-center gap-2"> <span className="text-white text-xl font-black tracking-[0.4em] uppercase animate-pulse">Entering Town</span> <div className="flex gap-1.5"> <div className="w-2 h-2 bg-[#e94560] rounded-full animate-bounce [animation-delay:-0.3s]"></div> <div className="w-2 h-2 bg-[#e94560] rounded-full animate-bounce [animation-delay:-0.15s]"></div> <div className="w-2 h-2 bg-[#e94560] rounded-full animate-bounce"></div> </div> </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2e2e4a 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
      <CloudLayer customImage={cloudImage} />

      <div ref={viewportRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div className="absolute top-0 left-0 w-0 h-0 will-change-transform" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}>
            {grid.map((row, x) => row.map((type, y) => (
                <Tile key={`${x}_${y}`} x={x} y={y} type={type} isEditing={editMode} assetConfigs={assetConfigs} customAssets={customAssets} data={tileData[`${x}_${y}`]} onClick={onTileClickWrapper} seed={x * grid.length + y} activeFilters={activeFilters} />
            )))}
        </div>
      </div>

      <div className="ui-layer pointer-events-none absolute inset-0 z-50">
        <UserMenu onLoginClick={login} />

        {!isLoading && (
            <div className="pointer-events-auto fixed top-5 left-5 flex items-center gap-4 z-[60] animate-in slide-in-from-left duration-500">
                {!canEdit && !editMode && (
                  <div className="flex-shrink-0 select-none mr-2 hidden md:block">
                      <img src="https://town.trib.re/assets/tribre-town-sign.png" alt="Sign" className="h-48 w-auto filter drop-shadow-lg" />
                  </div>
                )}
                
                {/* Visitor Town Navigation */}
                 <div className="bg-[#1e1e2e]/90 backdrop-blur-md border border-[#444] rounded-lg p-1 pl-2 flex items-center gap-2 shadow-xl">
                     <MapIcon size={14} className="text-[#e94560]" />
                     <div className="relative">
                         <select 
                           value={currentTownId} 
                           onChange={(e) => handleLoadTown(e.target.value)}
                           className="appearance-none bg-transparent text-xs font-bold text-gray-200 outline-none py-1.5 pr-6 cursor-pointer min-w-[140px] hover:text-white transition-colors"
                         >
                           {townVersions.filter(v => v.isPublic || canEdit).map(v => (
                             <option key={v.id} value={v.id} className="bg-[#1e1e2e] text-gray-300">
                                {v.name} {v.isDefault ? '(Home)' : ''} {(!v.isPublic && canEdit) ? '(Private)' : ''}
                             </option>
                           ))}
                         </select>
                         <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                     </div>
                </div>

                {canEdit && (
                    <button onClick={() => { setEditMode(!editMode); if (!editMode) setCurrentTool(TOOL_SELECT_ID); else setIsSidebarOpen(false); }} className={`px-4 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 ${editMode ? 'bg-[#e94560] border border-[#ff6b81]' : 'bg-[#2a2a40] border border-[#4a4a60] hover:bg-[#3a3a50]'}`}>
                        {editMode ? <Check size={18} /> : <Hammer size={18} />} {editMode ? 'Done' : 'Edit'}
                    </button>
                )}
            </div>
        )}

        {editMode && (
            <div className="pointer-events-auto">
                <AdminToolbar 
                    currentView="creator" currentTool={currentTool} onSelectTool={setCurrentTool} customAssets={customAssets} assetConfigs={assetConfigs}
                    onUploadAsset={handleUploadAsset} onAddRemoteAsset={handleAddRemoteAsset} 
                    onSaveUpdate={() => downloadTownData('town.json', { grid, tileData, customAssets, assetConfigs, cloudImage })}
                    onSaveAs={(name) => {}} onRegisterTown={(n, p) => {}} onDownloadManifest={() => downloadManifest(townVersions)} onExport={() => {}} onImport={() => {}} cloudImage={cloudImage} onCloudImageChange={setCloudImage}
                    versions={townVersions} currentTownId={currentTownId} onLoadTown={handleLoadTown} 
                    onSetDefault={handleSetDefault} onTogglePublic={handleTogglePublic} onDeleteTown={() => {}}
                    tileData={tileData} activeFilters={activeFilters} onToggleFilter={toggleGlobalFilter} onClearFilters={() => setActiveFilters([])}
                />
            </div>
        )}

        <button onClick={centerMap} className="pointer-events-auto fixed bottom-8 right-8 w-12 h-12 rounded-full bg-[#0f3460] border-2 border-[#e94560] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40" title="Reset Camera"> <LocateFixed size={24} /> </button>

        <div className={`pointer-events-auto fixed top-20 right-5 w-[300px] max-h-[85vh] bg-[#1e1e2e]/95 backdrop-blur-md border border-[#444] rounded-xl shadow-2xl z-[90] flex flex-col transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
            <div className="flex flex-col h-full relative overflow-hidden rounded-xl">
                <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-white hover:text-[#e94560] z-20"> <X size={24} /> </button>
                {!editMode && selectedCoord && (
                    <> {getSelectedData() ? (
                        <> <div className="bg-[#0f3460] p-6 pt-12 relative flex-shrink-0"> 
                              <h2 className="text-2xl font-bold m-0">{getSelectedData()?.name}</h2> 
                              <span className="inline-block mt-2 bg-[#e94560] px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"> {getSelectedData()?.role} </span> 
                              {getSelectedData()?.labels && getSelectedData()!.labels!.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-1">
                                  {getSelectedData()!.labels!.map(l => ( <span key={l} className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded border border-white/10 uppercase font-bold tracking-tight">{l}</span> ))}
                                </div>
                              )}
                           </div>
                           <div className="p-6 flex-1 overflow-y-auto custom-scrollbar"> 
                              <p className="text-gray-300 leading-relaxed mb-6">{getSelectedData()?.bio}</p> 
                              <div className="bg-[#1a1a2e] p-4 rounded-lg border border-[#333]"> 
                                <a href={getSelectedData()?.link} target="_blank" rel="noreferrer" className="block w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-center rounded-lg font-bold hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2"> {getSelectedData()?.actionText || 'View'} <ExternalLink size={16} /> </a> 
                              </div> 
                           </div> 
                        </>
                    ) : ( <div className="p-6 text-gray-400 text-center mt-20 italic">No steward data for this tile.</div> )} </>
                )}
                {editMode && selectedCoord && (
                    <div className="flex flex-col h-full bg-[#1e1e2e]">
                        <div className="bg-[#2a2a40] p-4 pt-12 border-b border-[#444] flex-shrink-0"> <h2 className="text-lg font-bold text-[#ffd700]">Edit Tile</h2> <small className="text-gray-400">({selectedCoord.x}, {selectedCoord.y})</small> </div>
                        <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Tile Type</label> <select className="w-full bg-[#111] border border-[#444] rounded p-2 text-white" value={selectedType} onChange={(e) => updateTileType(parseInt(e.target.value))}> <option value={-1}>Empty (Void)</option> <option value={0}>Blank (Grass)</option> <optgroup label="Assets"> {TOOLS.filter(t => t.id > 0).map(t => ( <option key={t.id} value={t.id}>{t.name}</option> ))} </optgroup> <optgroup label="Custom Assets"> {customAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)} </optgroup> </select> </div>
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Name</label> <input className="w-full bg-[#111] border border-[#444] rounded p-2 text-white" value={getSelectedData()?.name || ''} onChange={(e) => updateTileData('name', e.target.value)} /> </div>
                            
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Tag size={12}/> Labels</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {getSelectedData()?.labels?.map(l => (
                                    <span key={l} className="group bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                      {l} <button onClick={() => removeLabelFromTile(l)} className="hover:text-white transition-colors"><X size={10}/></button>
                                    </span>
                                  ))}
                                </div>
                                <div className="relative">
                                  <div className="flex gap-1">
                                    <input className="flex-1 bg-[#111] border border-[#444] rounded p-2 text-xs text-white outline-none focus:border-[#e94560]" value={labelInput} onChange={(e) => setLabelInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLabelToTile(labelInput)} placeholder="Add label..." />
                                    <button onClick={() => addLabelToTile(labelInput)} className="bg-[#2a2a40] border border-[#444] px-2 rounded hover:bg-[#333] transition-colors"> <Plus size={16}/> </button>
                                  </div>
                                  {filteredSuggestions.length > 0 && (
                                    <div className="absolute bottom-full left-0 w-full mb-1 bg-[#2a2a40] border border-[#444] rounded shadow-xl z-[100] max-h-40 overflow-y-auto">
                                      {filteredSuggestions.map(s => ( <button key={s} onClick={() => addLabelToTile(s)} className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase text-gray-300 hover:bg-[#333] hover:text-white border-b border-white/5 last:border-0"> {s} </button> ))}
                                    </div>
                                  )}
                                </div>
                            </div>

                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Role</label> <input className="w-full bg-[#111] border border-[#444] rounded p-2 text-white" value={getSelectedData()?.role || ''} onChange={(e) => updateTileData('role', e.target.value)} /> </div>
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Bio</label> <textarea className="w-full bg-[#111] border border-[#444] rounded p-2 text-white h-24 resize-none" value={getSelectedData()?.bio || ''} onChange={(e) => updateTileData('bio', e.target.value)} /> </div>
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Action Link</label> <input className="w-full bg-[#111] border border-[#444] rounded p-2 text-white" value={getSelectedData()?.link || ''} onChange={(e) => updateTileData('link', e.target.value)} /> </div>
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Action Text</label> <input className="w-full bg-[#111] border border-[#444] rounded p-2 text-white" value={getSelectedData()?.actionText || ''} onChange={(e) => updateTileData('actionText', e.target.value)} /> </div>
                            <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase">Image URL Override</label> <input className="w-full bg-[#111] border border-[#444] rounded p-2 text-white" value={getSelectedData()?.imageUrl || ''} onChange={(e) => updateTileData('imageUrl', e.target.value)} /> </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
export default App;
