/**
 * STATIC JSON STORAGE SERVICE (MANIFEST BASED)
 * 
 * 1. Loads 'towns.json' (Manifest) to get the list of available towns.
 * 2. Loads individual town data files (e.g. 'towns/main.json') on demand.
 * 3. Provides 'Download Manifest' and 'Download Town' functionality for Admins.
 */

import { TownVersion, TownData } from '../types';
import { DEFAULT_TOWN_DATA } from '../defaultTownData';

const MANIFEST_FILE = 'towns.json';

// --- SAVE / DOWNLOAD FUNCTIONS ---

/**
 * Trigger a download for a specific town's data (The Map).
 * Admin uploads this to: /towns/{filename}
 */
export const downloadTownData = (filename: string, data: TownData) => {
    try {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error("Error downloading town file:", error);
        return false;
    }
};

/**
 * Trigger a download for the Manifest file (The Registry).
 * Admin uploads this to: /towns.json
 */
export const downloadManifest = (versions: TownVersion[]) => {
    try {
        // We strip the heavy 'data' object from the manifest to keep it lightweight.
        // The app will fetch the data using 'fileUrl' when needed.
        const manifest = versions.map(v => ({
            id: v.id,
            name: v.name,
            isDefault: v.isDefault,
            isPublic: v.isPublic,
            lastModified: v.lastModified,
            fileUrl: v.fileUrl || `towns/${v.id}.json` // Ensure path exists
        }));

        const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = MANIFEST_FILE;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error("Error downloading manifest:", error);
        return false;
    }
};

// --- FETCH FUNCTIONS ---

/**
 * Fetch the content of a specific town file
 */
export const fetchTownContent = async (url: string): Promise<TownData | null> => {
    if (!url) return null;
    
    try {
        // Standardize the path. Relative paths in this environment work best without ./ or /
        // but if they are provided, we keep them as is unless we need to force root.
        let fetchUrl = url;
        
        console.log(`[DB Service] Fetching town content from: ${fetchUrl}`);

        const response = await fetch(fetchUrl); 
        
        if (!response.ok) {
            // If direct fetch fails, try one fallback with ./ prefix
            if (!fetchUrl.startsWith('./') && !fetchUrl.startsWith('http')) {
                const fallbackUrl = `./${fetchUrl}`;
                console.log(`[DB Service] 404 on ${fetchUrl}, trying fallback: ${fallbackUrl}`);
                const secondResponse = await fetch(fallbackUrl);
                if (secondResponse.ok) {
                    console.log(`[DB Service] Successfully loaded content from fallback ${fallbackUrl}`);
                    return await secondResponse.json();
                }
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`[DB Service] Successfully loaded content from ${fetchUrl}`);
        return data;
    } catch (e) {
        console.error(`[DB Service] Failed to fetch town content from ${url}`, e);
        return null;
    }
};

/**
 * 1. Try to load 'towns.json' (Manifest).
 * 2. If missing, try 'town.json' (Legacy single file).
 * 3. If missing, return internal default.
 */
export const fetchTownManifest = async (): Promise<TownVersion[]> => {
    try {
        console.log(`[DB Service] Fetching manifest from ${MANIFEST_FILE}...`);
        
        // Fetch manifest without cache bust initially to avoid 404 on some servers
        const response = await fetch(MANIFEST_FILE);

        if (response.ok) {
            const manifest = await response.json();
            console.log(`[DB Service] Manifest loaded with ${manifest.length} entries.`);
            
            return manifest.map((m: any) => ({
                id: m.id,
                name: m.name,
                isDefault: m.isDefault,
                isPublic: m.isPublic,
                lastModified: m.lastModified,
                fileUrl: m.fileUrl,
                data: DEFAULT_TOWN_DATA // Initial placeholder for lazy loading
            }));
        } else {
            // Try fallback with ./ prefix
            const fallbackRes = await fetch(`./${MANIFEST_FILE}`);
            if (fallbackRes.ok) {
                const manifest = await fallbackRes.json();
                return manifest.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    isDefault: m.isDefault,
                    isPublic: m.isPublic,
                    lastModified: m.lastModified,
                    fileUrl: m.fileUrl,
                    data: DEFAULT_TOWN_DATA
                }));
            }
            throw new Error(`Manifest not found at ${MANIFEST_FILE}`);
        }

    } catch (error) {
        console.warn("[DB Service] Manifest fetch failed. Falling back.", error);
        
        // Fallback: Check for legacy town.json
        try {
            const legacyRes = await fetch('town.json');
            if (legacyRes.ok) {
                const legacyData = await legacyRes.json();
                return [{
                    id: 'legacy_town',
                    name: 'Main Town',
                    isDefault: true,
                    isPublic: true,
                    lastModified: Date.now(),
                    fileUrl: 'town.json',
                    data: legacyData
                }];
            }
        } catch (e) {}

        // Final Fallback: Internal Default
        return [{
            id: 'default_local',
            name: 'Default Town',
            isDefault: true,
            isPublic: true,
            lastModified: Date.now(),
            fileUrl: '', // No remote file
            data: DEFAULT_TOWN_DATA
        }];
    }
};

// Compatibility stubs
export const fetchTownVersions = async (token: string) => fetchTownManifest();
export const saveTownVersions = async (token: string, v: TownVersion[]) => downloadManifest(v);
