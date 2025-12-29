
import React, { useState, useMemo, useRef } from 'react';
import { TOOLS, THEMED_ASSETS, TOOL_SELECT_ID } from '../constants';
import { CustomAsset, AssetConfig, TownVersion, StewardData } from '../types';
// Added X and PlusCircle to the lucide-react import list
import { Download, Upload, Save, ImagePlus, MousePointer2, Map as MapIcon, Hammer, LayoutGrid, Plus, Trash2, Check, Star, Globe, Eye, FolderOpen, PackagePlus, HardDrive, FileJson, Link, ChevronDown, ChevronRight, Lock, Unlock, Link2, Tag, FilterX, Image as ImageIcon, X, PlusCircle } from 'lucide-react';

interface AdminToolbarProps {
  currentView: string;
  currentTool: number;
  onSelectTool: (id: number) => void;
  customAssets: CustomAsset[];
  assetConfigs: Record<number, AssetConfig>;
  onUploadAsset: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddRemoteAsset: (url: string) => void;
  onSaveUpdate: () => void;
  onSaveAs: (name: string) => void;
  onRegisterTown: (name: string, path: string) => void;
  onDownloadManifest: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cloudImage: string;
  onCloudImageChange: (url: string) => void;
  versions: TownVersion[];
  currentTownId: string;
  onLoadTown: (id: string) => void;
  onSetDefault: (id: string) => void;
  onTogglePublic: (id: string) => void;
  onDeleteTown: (id: string) => void;
  tileData: Record<string, StewardData>;
  activeFilters: string[];
  onToggleFilter: (label: string) => void;
  onClearFilters: () => void;
}

const AdminToolbar: React.FC<AdminToolbarProps> = ({
  currentTool,
  onSelectTool,
  customAssets,
  assetConfigs,
  onUploadAsset,
  onAddRemoteAsset,
  onSaveUpdate,
  onSaveAs,
  onRegisterTown,
  onDownloadManifest,
  onExport,
  onImport,
  cloudImage,
  onCloudImageChange,
  versions,
  currentTownId,
  onLoadTown,
  onSetDefault,
  onTogglePublic,
  onDeleteTown,
  tileData,
  activeFilters,
  onToggleFilter,
  onClearFilters
}) => {
  const [activeTab, setActiveTab] = useState<'creator' | 'towns' | 'labels'>('creator');
  const [newTownName, setNewTownName] = useState('');
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [remoteAssetUrl, setRemoteAssetUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showLinkTown, setShowLinkTown] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkPath, setLinkPath] = useState('');

  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({
      'Essentials': true, 'Buildings': true, 'Nature': true, 'Custom': true
  });

  const toggleSection = (key: string) => setSectionsOpen(prev => ({...prev, [key]: !prev[key]}));
  
  const handleSaveAsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTownName.trim()) { onSaveAs(newTownName); setNewTownName(''); setShowSaveAs(false); }
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(linkName.trim() && linkPath.trim()) {
          onRegisterTown(linkName.trim(), linkPath.trim());
          setLinkName('');
          setLinkPath('');
          setShowLinkTown(false);
      }
  };

  const labelStats = useMemo(() => {
    const stats: Record<string, number> = {};
    Object.keys(THEMED_ASSETS).forEach(cat => stats[cat] = 0);
    // Explicitly cast to StewardData[] because Object.values might be inferred as unknown[]
    (Object.values(tileData) as StewardData[]).forEach(data => {
      if (data.labels) { data.labels.forEach(l => { stats[l] = (stats[l] || 0) + 1; }); }
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [tileData]);

  const renderCreator = () => {
    const essentials = TOOLS.filter(t => t.id === TOOL_SELECT_ID || t.id === 0 || t.id === -1);
    const buildings = TOOLS.filter(t => [1, 2, 4, 5, 6].includes(t.id));
    const nature = TOOLS.filter(t => [3].includes(t.id));
    
    const renderToolButton = (tool: any) => (
        <button key={tool.id} onClick={() => onSelectTool(tool.id)} className={`aspect-square w-full rounded-lg border-2 flex flex-col items-center justify-center overflow-hidden transition-all relative ${currentTool === tool.id ? 'border-[#e94560] bg-[#332222] shadow-[0_0_10px_rgba(233,69,96,0.4)]' : 'border-[#444] bg-[#222] hover:border-gray-400'}`} title={tool.name}>
            {tool.name.includes('Select') ? (<MousePointer2 size={24} className="mb-1" />) : assetConfigs[tool.id] ? (<div className="w-full h-full bg-no-repeat bg-contain bg-center scale-75 absolute bottom-0" style={{ backgroundImage: `url(${assetConfigs[tool.id].src})`, ...tool.style }} />) : null}
            <span className="text-[10px] font-bold text-gray-300 z-10 bg-black/50 px-1 rounded mt-auto mb-1">{tool.label || tool.name}</span>
        </button>
    );

    const renderCustomButton = (asset: CustomAsset) => (
        <button key={asset.id} onClick={() => onSelectTool(asset.id)} className={`aspect-square w-full rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all relative ${currentTool === asset.id ? 'border-[#e94560] bg-[#332222] shadow-[0_0_10px_rgba(233,69,96,0.4)]' : 'border-[#444] bg-[#222] hover:border-gray-400'}`} title={asset.name}> 
            <img src={asset.icon} alt={asset.name} className="w-[80%] h-auto object-contain" /> 
            <span className="text-[8px] absolute bottom-1 text-gray-400 truncate w-full px-1 bg-black/40 text-center">{asset.name}</span>
        </button>
    );

    const renderSection = (title: string, content: React.ReactNode) => (
        <div className="mb-2">
            <button onClick={() => toggleSection(title)} className="w-full flex items-center justify-between p-2 bg-[#2a2a40] hover:bg-[#333] rounded-lg transition-colors group mb-1 border border-[#333] hover:border-[#555]"> <span className="text-xs font-bold text-gray-300 uppercase group-hover:text-white flex items-center gap-2"> {sectionsOpen[title] ? <ChevronDown size={12} /> : <ChevronRight size={12} />} {title} </span> </button>
            {sectionsOpen[title] && (<div className="grid grid-cols-3 gap-2.5 p-1 animate-in zoom-in-95 duration-200 origin-top"> {content} </div>)}
        </div>
    );

    return (
        <div className="pr-1">
            {renderSection('Essentials', essentials.map(renderToolButton))}
            {renderSection('Buildings', buildings.map(renderToolButton))}
            {renderSection('Nature', nature.map(renderToolButton))}
            {renderSection('Custom', [
                ...customAssets.map(renderCustomButton),
                <button key="add" onClick={() => setShowAddAsset(!showAddAsset)} className="aspect-square w-full rounded-lg border-2 border-dashed border-[#444] hover:border-[#e94560] flex flex-col items-center justify-center transition-all bg-[#1a1a2e]">
                    <PackagePlus size={20} className="text-gray-500 group-hover:text-[#e94560]" />
                    <span className="text-[8px] text-gray-500 font-bold mt-1 uppercase">Add Tile</span>
                </button>
            ])}

            {showAddAsset && (
                <div className="mb-4 p-3 bg-[#111] rounded-lg border border-[#e94560]/30 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Library Extension</span>
                        <button onClick={() => setShowAddAsset(false)} className="text-gray-500 hover:text-white"><X size={12}/></button>
                    </div>
                    
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 mb-2 bg-[#222] border border-[#444] rounded text-[10px] font-bold text-gray-300 hover:bg-[#2a2a40] flex items-center justify-center gap-2">
                        <Upload size={14} /> Upload Image File
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onUploadAsset} className="hidden" />

                    <div className="relative mt-2">
                        <input type="text" value={remoteAssetUrl} onChange={(e) => setRemoteAssetUrl(e.target.value)} placeholder="Image URL..." className="w-full bg-[#222] border border-[#444] rounded p-1.5 text-xs text-white pr-8 outline-none focus:border-[#e94560]" />
                        <button onClick={() => { onAddRemoteAsset(remoteAssetUrl); setRemoteAssetUrl(''); setShowAddAsset(false); }} className="absolute right-1 top-1/2 -translate-y-1/2 text-[#e94560] p-1"><PlusCircle size={16}/></button>
                    </div>
                </div>
            )}

            <div className="space-y-3 border-t border-[#444] pt-4 mt-2">
                <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"> <ImagePlus size={12} /> Cloud Image URL </label> <input type="text" value={cloudImage} onChange={(e) => onCloudImageChange(e.target.value)} className="w-full bg-[#111] border border-[#444] rounded p-1.5 text-xs text-white focus:border-[#e94560] outline-none" placeholder="https://..." /> </div>
            </div>
        </div>
    );
  };

  const renderTowns = () => (
    <div className="flex flex-col">
        <div className="flex-shrink-0 mb-3 bg-blue-900/20 border border-blue-800/50 rounded-lg p-2 gap-2">
            <div className="flex items-center gap-2 mb-1"> <FileJson size={14} className="text-blue-400" /> <span className="text-[10px] font-bold text-blue-400 uppercase">File System Mode</span> </div>
            <p className="text-[9px] text-gray-400 leading-tight">Changes are local until you export/download the town JSON.</p>
        </div>

        <div className="space-y-2 pr-1 mb-4">
            {versions.map(v => {
                const isPrivate = !v.isPublic;
                return (
                <div key={v.id} className={`p-2 rounded-lg border ${v.id === currentTownId ? 'bg-[#0f3460] border-[#e94560]' : 'bg-[#222] border-[#444]'} transition-all`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs truncate flex-1" title={v.name}>{v.name}</span>
                        {v.id !== currentTownId && ( <button onClick={() => onLoadTown(v.id)} className="text-[9px] bg-[#333] hover:bg-[#444] px-2 py-0.5 rounded text-white flex items-center gap-1"> <Eye size={10} /> Load </button> )}
                        {v.id === currentTownId && <span className="text-[9px] text-[#e94560] font-bold bg-[#e94560]/20 px-1.5 py-0.5 rounded">Active</span>}
                    </div>
                    {/* Admin Controls */}
                    <div className="flex items-center gap-2 mt-2 border-t border-white/10 pt-2">
                        <button 
                            onClick={() => onSetDefault(v.id)} 
                            disabled={v.isDefault || isPrivate} 
                            className={`flex-1 text-[9px] flex items-center justify-center gap-1 py-1 rounded transition-colors 
                                ${v.isDefault 
                                    ? 'text-yellow-400 bg-yellow-400/10 cursor-default' 
                                    : isPrivate 
                                        ? 'text-gray-600 cursor-not-allowed opacity-50' 
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                            title={isPrivate ? "Make public first to set as default" : ""}
                        >
                            <Star size={10} fill={v.isDefault ? "currentColor" : "none"} /> {v.isDefault ? 'Default' : 'Set Default'}
                        </button>
                        <div className="w-px h-3 bg-white/10"></div>
                        <button onClick={() => onTogglePublic(v.id)} className={`flex-1 text-[9px] flex items-center justify-center gap-1 py-1 rounded transition-colors ${v.isPublic ? 'text-emerald-400 bg-emerald-400/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                            {v.isPublic ? <Globe size={10} /> : <Lock size={10} />} {v.isPublic ? 'Public' : 'Private'}
                        </button>
                    </div>
                </div>
                );
            })}
        </div>
        
        {showLinkTown ? (
             <form onSubmit={handleLinkSubmit} className="mb-3 bg-[#111] p-2 rounded border border-[#444] animate-in slide-in-from-bottom-2">
                 <div className="flex justify-between items-center mb-2"> <span className="text-[10px] font-bold uppercase text-gray-400">Link Existing File</span> <button type="button" onClick={() => setShowLinkTown(false)} className="text-gray-500 hover:text-white"><Trash2 size={10}/></button> </div>
                 <input autoFocus type="text" value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="Display Name" className="w-full bg-[#222] border border-[#444] rounded p-1.5 text-xs text-white mb-2" />
                 <input type="text" value={linkPath} onChange={(e) => setLinkPath(e.target.value)} placeholder="File Path" className="w-full bg-[#222] border border-[#444] rounded p-1.5 text-xs text-white mb-2" />
                 <button type="submit" className="w-full bg-[#0f3460] hover:bg-[#16213e] text-white text-xs py-1.5 rounded font-bold border border-[#4a4a60]"> Add Link </button>
             </form>
        ) : (
             <button onClick={() => setShowLinkTown(true)} className="mb-4 w-full bg-[#222] hover:bg-[#333] border border-[#444] text-gray-300 py-1.5 rounded text-[10px] flex items-center justify-center gap-1"> <Link2 size={12} /> Link Existing File </button>
        )}
    </div>
  );

  const renderLabels = () => (
    <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-gray-400 uppercase flex items-center gap-2"> <Tag size={14} /> Global Labels </h4>
            {activeFilters.length > 0 && ( <button onClick={onClearFilters} className="text-[10px] text-[#e94560] hover:underline flex items-center gap-1"> <FilterX size={10} /> Clear </button> )}
        </div>
        <div className="flex flex-col gap-1 pr-1 max-h-[40vh] overflow-y-auto custom-scrollbar">
            {labelStats.map(([label, count]) => {
                const isActive = activeFilters.includes(label);
                return (
                    <button key={label} onClick={() => onToggleFilter(label)} className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left group ${isActive ? 'bg-[#e94560]/20 border-[#e94560] text-white' : 'bg-[#222] border-[#444] text-gray-400 hover:border-gray-500 hover:text-gray-200'}`}>
                        <div className="flex items-center gap-2"> <Tag size={12} className={isActive ? 'text-[#e94560]' : 'text-gray-500'} /> <span className="text-xs font-bold uppercase tracking-tight">{label}</span> </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-[#e94560] text-white' : 'bg-[#333] text-gray-500'}`}> {count} </span>
                    </button>
                );
            })}
        </div>
    </div>
  );

  return (
    <div className="fixed top-20 left-5 w-[300px] bg-[#1e1e2e]/95 backdrop-blur-md border border-[#444] rounded-xl shadow-2xl z-50 text-white flex flex-col max-h-[85vh]">
      <div className="flex border-b border-[#444] flex-shrink-0">
          <button onClick={() => setActiveTab('creator')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-colors ${activeTab === 'creator' ? 'text-[#e94560] bg-[#2a2a40]' : 'text-gray-400 hover:text-white hover:bg-[#252535]'}`}> <Hammer size={16} /> Creator </button>
          <button onClick={() => setActiveTab('towns')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-colors ${activeTab === 'towns' ? 'text-[#e94560] bg-[#2a2a40]' : 'text-gray-400 hover:text-white hover:bg-[#252535]'}`}> <MapIcon size={16} /> Towns </button>
          <button onClick={() => setActiveTab('labels')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-colors ${activeTab === 'labels' ? 'text-[#e94560] bg-[#2a2a40]' : 'text-gray-400 hover:text-white hover:bg-[#252535]'}`}> <Tag size={16} /> Labels </button>
      </div>
      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar min-h-0">
        {activeTab === 'creator' && renderCreator()}
        {activeTab === 'towns' && renderTowns()}
        {activeTab === 'labels' && renderLabels()}
      </div>
      <div className="flex-shrink-0 p-4 border-t border-[#444] bg-[#252535]">
         <div className="flex gap-2 mb-2">
             <button onClick={onSaveUpdate} className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white p-2 rounded text-xs flex items-center justify-center gap-2 font-bold transition-colors"> <Download size={14} /> Update Map </button>
             <button onClick={() => setShowSaveAs(!showSaveAs)} className="flex-1 bg-[#444] hover:bg-[#555] text-white p-2 rounded text-xs flex items-center justify-center gap-2 font-bold transition-colors"> <Plus size={14} /> New Town </button>
         </div>
         {showSaveAs && (
             <form onSubmit={handleSaveAsSubmit} className="bg-[#111] p-2 rounded border border-[#444] animate-in slide-in-from-bottom-2 mb-2">
                 <input autoFocus type="text" value={newTownName} onChange={(e) => setNewTownName(e.target.value)} placeholder="New Town Name" className="w-full bg-[#222] border border-[#444] rounded p-1.5 text-xs text-white mb-2" />
                 <button type="submit" className="w-full bg-[#e94560] hover:bg-[#ff5773] text-white text-xs py-1.5 rounded font-bold"> Confirm & Add </button>
             </form>
         )}
      </div>
    </div>
  );
};
export default AdminToolbar;
