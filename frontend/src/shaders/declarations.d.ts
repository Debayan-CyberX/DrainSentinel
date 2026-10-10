declare module "../tidecrest-hero/tidecrestDocument.js" {
  export const buildTidecrestDocument: any;
}

declare module "../meridian-landing-page/meridianDocument.js" {
  export const buildMeridianDocument: any;
}

declare module "../ascii-field/asciiFieldDocuments.js" {
  export const buildAsciiFieldDocument: any;
}

declare module "../betawise-globe/betawiseGlobeDocument.js" {
  export const buildBetawiseGlobeDocument: any;
}

declare module "../nocturne-hero/NocturneScene" {
  export const NOCTURNE_CONTROL_KEYS: any;
  export type NocturneControlKey = any;
  export const NOCTURNE_RECIPES: any;
  export const applyNocturneVariant: any;
}

declare module "./sandboxedPageDocument" {
  export const buildSandboxedPageDocument: any;
}

declare module "../sylva-living-world/SylvaLivingWorldScene" {
  export const SYLVA_HERO_RECIPES: any;
  export const applySakuraSunsetVariant: any;
  export const applyMapleAutumnVariant: any;
  export const applySequoiaMistVariant: any;
}

declare module "*.html?raw" {
  const content: string;
  export default content;
}
