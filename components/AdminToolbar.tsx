import React, { useState } from 'react';
import { TOOLS, THEMED_ASSETS, TOOL_SELECT_ID } from '../constants';
import { CustomAsset, AssetConfig, TownVersion } from '../types';
import { Download, Upload, Save, ImagePlus, MousePointer2, Map as MapIcon, Hammer, LayoutGrid, Plus, Trash2, Check, Star, Globe, Eye, FolderOpen, PackagePlus, HardDrive, FileJson, Link, ChevronDown, ChevronRight, Lock, Unlock, Link2 } from 'lucide-react';

interface AdminToolbarProps {
  currentView: string;
  currentTool: number;
  onSelectTool: (id: number) => void;
  customAssets: CustomAsset[];
  assetConfigs: Record<number, AssetConfig>;
  onUploadAsset: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddRemoteAsset: (url: string) => void;
  onSaveUpdate: () => void; // Downloads map json
  onSaveAs: (name: string) => void; // Adds entry to manifest list (snapshot current state)
  onRegisterTown: (name: string, path: string) => void; // Links existing file
  onDownloadManifest: () => void; // Downloads towns.json
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
  onDeleteTown
}) => {
  const [activeTab, setActiveTab] = useState<'creator' | 'towns' | 'tiles'>('creator');
  const [newTownName, setNewTownName] = useState('');
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>(Object.keys(THEMED_ASSETS)[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [assetInput, setAssetInput] = useState('');
  
  // State for Linking Existing
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
        <button key={asset.id} onClick={() => onSelectTool(asset.id)} className={`aspect-square w-full rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all ${currentTool === asset.id ? 'border-[#e94560] bg-[#332222] shadow-[0_0_10px_rgba(233,69,96,0.4)]' : 'border-[#444] bg-[#222] hover:border-gray-400'}`}> <img src={asset.icon} alt={asset.name} className="w-[80%] h-auto object-contain" /> </button>
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
            {customAssets.length > 0 && renderSection('Custom', customAssets.map(renderCustomButton))}
            <div className="space-y-3 border-t border-[#444] pt-4 mt-2">
                <div className="space-y-1"> <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"> <ImagePlus size={12} /> Cloud Image URL </label> <input type="text" value={cloudImage} onChange={(e) => onCloudImageChange(e.target.value)} className="w-full bg-[#111] border border-[#444] rounded p-1.5 text-xs text-white focus:border-[#e94560] outline-none" placeholder="https://..." /> </div>
            </div>
        </div>
    );
  };

  const renderTowns = () => (
    <div className="flex flex-col">
        {/* Info Box */}
        <div className="flex-shrink-0 mb-3 bg-blue-900/20 border border-blue-800/50 rounded-lg p-2 gap-2">
            <div className="flex items-center gap-2 mb-1">
               <FileJson size={14} className="text-blue-400" />
               <span className="text-[10px] font-bold text-blue-400 uppercase">File System Mode</span>
            </div>
            <p className="text-[9px] text-gray-400 leading-tight">
                1. <strong>Update Map</strong> saves changes to the <em>current</em> file (e.g. <code>towns/main.json</code>).
            </p>
            <p className="text-[9px] text-gray-400 leading-tight mt-1">
                2. <strong>Save Config</strong> updates the list of towns (<code>towns.json</code>).
            </p>
        </div>

        <div className="space-y-2 pr-1 mb-4">
            {versions.map(v => (
                <div key={v.id} className={`p-2 rounded-lg border ${v.id === currentTownId ? 'bg-[#0f3460] border-[#e94560]' : 'bg-[#222] border-[#444]'} transition-all`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs truncate flex-1" title={v.name}>{v.name}</span>
                        {v.id !== currentTownId && (
                            <button onClick={() => onLoadTown(v.id)} className="text-[9px] bg-[#333] hover:bg-[#444] px-2 py-0.5 rounded text-white flex items-center gap-1"> <Eye size={10} /> Load </button>
                        )}
                        {v.id === currentTownId && <span className="text-[9px] text-[#e94560] font-bold bg-[#e94560]/20 px-1.5 py-0.5 rounded">Active</span>}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                        <div className="flex gap-1">
                            {/* Toggle Public */}
                            <button onClick={() => onTogglePublic(v.id)} className={`p-1 rounded ${v.isPublic ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-gray-500 hover:bg-gray-700'}`} title={v.isPublic ? "Public" : "Private"}>
                                {v.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                            </button>
                            {/* Set Default */}
                            <button onClick={() => onSetDefault(v.id)} className={`p-1 rounded ${v.isDefault ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-900/20'}`} title="Set as Default">
                                <Star size={12} fill={v.isDefault ? "currentColor" : "none"} />
                            </button>
                        </div>
                        <div className="flex gap-1 items-center">
                            <span className="text-[8px] text-gray-500 font-mono truncate max-w-[80px]" title={v.fileUrl}>{v.fileUrl || "No File"}</span>
                            {!v.isDefault && (
                                <button onClick={() => onDeleteTown(v.id)} className="text-red-400 hover:bg-red-900/20 p-1 rounded"> <Trash2 size={12} /> </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        {/* Link Existing File Section */}
        {showLinkTown ? (
             <form onSubmit={handleLinkSubmit} className="mb-3 bg-[#111] p-2 rounded border border-[#444] animate-in slide-in-from-bottom-2">
                 <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-bold uppercase text-gray-400">Link Existing File</span>
                     <button type="button" onClick={() => setShowLinkTown(false)} className="text-gray-500 hover:text-white"><Trash2 size={10}/></button>
                 </div>
                 <input autoFocus type="text" value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="Display Name (e.g. Town 2026)" className="w-full bg-[#222] border border-[#444] rounded p-1.5 text-xs text-white mb-2 focus:border-[#e94560] outline-none" />
                 <input type="text" value={linkPath} onChange={(e) => setLinkPath(e.target.value)} placeholder="File Path (e.g. towns/town-2026.json)" className="w-full bg-[#222] border border-[#444] rounded p-1.5 text-xs text-white mb-2 focus:border-[#e94560] outline-none" />
                 <button type="submit" className="w-full bg-[#0f3460] hover:bg-[#16213e] text-white text-xs py-1.5 rounded font-bold border border-[#4a4a60]"> Add Link </button>
             </form>
        ) : (
             <button onClick={() => setShowLinkTown(true)} className="mb-4 w-full bg-[#222] hover:bg-[#333] border border-[#444] text-gray-300 py-1.5 rounded text-[10px] flex items-center justify-center gap-1">
                <Link2 size={12} /> Link Existing File
            </button>
        )}

        <div className="mt-auto pt-2 border-t border-[#444]">
            <button onClick={onDownloadManifest} className="w-full bg-blue-700 hover:bg-blue-600 text-white text-xs py-2 rounded flex items-center justify-center gap-2 font-bold transition-colors">
                <Save size={14} /> Download Config (towns.json)
            </button>
            <p className="text-[9px] text-gray-500 text-center mt-1">Updates the town list. Does not update grid.</p>
        </div>
    </div>
  );

  const renderTiles = () => (
      <div className="space-y-4">
        <div className="flex-shrink-0">
            <h4 className="font-bold text-xs text-gray-400 uppercase mb-3 flex items-center gap-2"> <PackagePlus size={14} /> Custom Tiles </h4>
            <div className="grid grid-cols-3 gap-2 pr-1">
                {isAdding ? (
                    <div className="col-span-3 bg-[#2a2a40] p-2 rounded border border-[#e94560] animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-1 mb-2"> <Link size={12} className="text-[#e94560]" /> <p className="text-[10px] font-bold text-gray-200">Remote Asset</p> </div>
                        <input autoFocus className="w-full bg-[#111] border border-[#555] rounded px-2 py-1.5 text-xs text-white mb-2 focus:border-[#e94560] outline-none" placeholder="e.g. tile_market.png" value={assetInput} onChange={e => setAssetInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && assetInput.trim()) { onAddRemoteAsset(assetInput); setAssetInput(''); setIsAdding(false); } }} />
                        <div className="flex gap-2 mb-2"> <button onClick={() => { if(assetInput.trim()) onAddRemoteAsset(assetInput); setAssetInput(''); setIsAdding(false); }} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1.5 rounded transition-colors"> Add </button> <button onClick={() => setIsAdding(false)} className="flex-1 bg-[#444] hover:bg-[#555] text-white text-[10px] font-bold py-1.5 rounded transition-colors"> Cancel </button> </div>
                        <div className="pt-2 border-t border-[#444] flex justify-center"> <label className="flex items-center gap-1 text-[9px] text-gray-400 hover:text-white cursor-pointer transition-colors"> <Upload size={10} /> <span>Or upload from device</span> <input type="file" onChange={onUploadAsset} accept="image/*" className="hidden" /> </label> </div>
                    </div>
                ) : (
                    <button onClick={() => setIsAdding(true)} className="aspect-square w-full rounded-lg border-2 border-dashed border-[#666] hover:border-gray-400 bg-[#2a2a40] hover:bg-[#333] flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-white transition-colors group"> <Plus size={20} className="mb-1 group-hover:scale-110 transition-transform" /> <span className="text-[9px] font-bold">ADD NEW</span> </button>
                )}
                {customAssets.map((asset) => ( <button key={asset.id} onClick={() => onSelectTool(asset.id)} className={`aspect-square w-full rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all bg-[#222] ${currentTool === asset.id ? 'border-[#e94560] shadow-[0_0_10px_rgba(233,69,96,0.4)]' : 'border-[#444] hover:border-gray-400'}`}> <img src={asset.icon} alt={asset.name} className="w-[80%] h-auto object-contain" /> </button> ))}
            </div>
        </div>
        <div className="flex flex-col">
            <h4 className="font-bold text-xs text-gray-400 uppercase mb-3 flex items-center gap-2"> <FolderOpen size={14} /> Asset Library </h4>
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin flex-shrink-0"> {Object.keys(THEMED_ASSETS).map(theme => ( <button key={theme} onClick={() => setSelectedTheme(theme)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors ${selectedTheme === theme ? 'bg-[#e94560] text-white' : 'bg-[#333] text-gray-400 hover:bg-[#444]'}`}> {theme} </button> ))} </div>
            <div className="grid grid-cols-3 gap-2 pr-1"> {THEMED_ASSETS[selectedTheme].map((asset, idx) => ( <div key={idx} className="group relative aspect-square bg-[#222] border border-[#444] rounded-lg overflow-hidden hover:border-gray-300 transition-colors"> <img src={asset.url} alt={asset.name} className="w-full h-full object-contain p-1" /> <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1"> <span className="text-[8px] text-center text-white font-medium leading-tight">{asset.name}</span> </div> </div> ))} </div>
        </div>
    </div>
  );

  return (
    <div className="fixed top-20 left-5 w-[300px] bg-[#1e1e2e]/95 backdrop-blur-md border border-[#444] rounded-xl shadow-2xl z-50 text-white flex flex-col max-h-[85vh]">
      <div className="flex border-b border-[#444] flex-shrink-0">
          <button onClick={() => setActiveTab('creator')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-colors ${activeTab === 'creator' ? 'text-[#e94560] bg-[#2a2a40]' : 'text-gray-400 hover:text-white hover:bg-[#252535]'}`}> <Hammer size={16} /> Creator </button>
          <button onClick={() => setActiveTab('towns')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-colors ${activeTab === 'towns' ? 'text-[#e94560] bg-[#2a2a40]' : 'text-gray-400 hover:text-white hover:bg-[#252535]'}`}> <MapIcon size={16} /> Towns </button>
          <button onClick={() => setActiveTab('tiles')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-colors ${activeTab === 'tiles' ? 'text-[#e94560] bg-[#2a2a40]' : 'text-gray-400 hover:text-white hover:bg-[#252535]'}`}> <LayoutGrid size={16} /> Tiles </button>
      </div>
      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar min-h-0">
        {activeTab === 'creator' && renderCreator()}
        {activeTab === 'towns' && renderTowns()}
        {activeTab === 'tiles' && renderTiles()}
      </div>
      <div className="flex-shrink-0 p-4 border-t border-[#444] bg-[#252535]">
         <div className="flex gap-2 mb-2">
             <button onClick={onSaveUpdate} className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white p-2 rounded text-xs flex items-center justify-center gap-2 font-bold transition-colors"> <Download size={14} /> Update Map </button>
             <button onClick={() => setShowSaveAs(!showSaveAs)} className="flex-1 bg-[#444] hover:bg-[#555] text-white p-2 rounded text-xs flex items-center justify-center gap-2 font-bold transition-colors"> <Plus size={14} /> New Town </button>
         </div>
         {showSaveAs && (
             <form onSubmit={handleSaveAsSubmit} className="bg-[#111] p-2 rounded border border-[#444] animate-in slide-in-from-bottom-2 mb-2">
                 <input autoFocus type="text" value={newTownName} onChange={(e) => setNewTownName(e.target.value)} placeholder="New Town Name" className="w-full bg-[#222] border border-[#444] rounded p-1.5 text-xs text-white mb-2" />
                 <button type="submit" className="w-full bg-[#e94560] hover:bg-[#ff5773] text-white text-xs py-1.5 rounded font-bold"> Confirm & Add to List </button>
             </form>
         )}
      </div>
    </div>
  );
};
export default AdminToolbar;