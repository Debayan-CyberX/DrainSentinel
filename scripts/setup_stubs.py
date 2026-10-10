from pathlib import Path

base = Path("frontend/src/shaders")

files = {
    "tidecrest-hero/tidecrestDocument.js": 'export function buildTidecrestDocument() { return ""; }',
    "tidecrest-hero/tidecrestDocument.d.ts": 'export declare function buildTidecrestDocument(...args: any[]): any;',
    "meridian-landing-page/meridianDocument.js": 'export function buildMeridianDocument() { return ""; }',
    "meridian-landing-page/meridianDocument.d.ts": 'export declare function buildMeridianDocument(...args: any[]): any;',
    "ascii-field/asciiFieldDocuments.js": 'export function buildAsciiFieldDocument() { return ""; }',
    "ascii-field/asciiFieldDocuments.d.ts": 'export declare function buildAsciiFieldDocument(...args: any[]): any;',
    "betawise-globe/betawiseGlobeDocument.js": 'export function buildBetawiseGlobeDocument() { return ""; }',
    "betawise-globe/betawiseGlobeDocument.d.ts": 'export declare function buildBetawiseGlobeDocument(...args: any[]): any;',
    "landing-pages/sandboxedPageDocument.ts": 'export function buildSandboxedPageDocument(...args: any[]): any { return ""; }',
    "nocturne-hero/NocturneScene.ts": """export const NOCTURNE_CONTROL_KEYS = [] as const;
export type NocturneControlKey = string;
export const NOCTURNE_TITLES: Record<string, string> = {};
export const NOCTURNE_VARIANTS = [] as const;
export type NocturneVariant = string;
export function buildNocturneDocument(...args: any[]): any { return ""; }
export const NOCTURNE_RECIPES: Record<string, any> = {};
export function applyNocturneVariant(...args: any[]): any {}
""",
    "sylva-living-world/SylvaLivingWorldScene.ts": """export const SYLVA_HERO_RECIPES: Record<string, any> = {};
export const MAPLE_AUTUMN_STYLE = "";
export const SAKURA_SUNSET_STYLE = "";
export const SEQUOIA_MIST_STYLE = "";
export function applyMapleAutumnVariant(source: string): string { return source; }
export function applySakuraSunsetVariant(source: string): string { return source; }
export function applySequoiaMistVariant(source: string): string { return source; }
""",
}

for rel, content in files.items():
    p = base / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)

print("Updated catalog stubs.")
