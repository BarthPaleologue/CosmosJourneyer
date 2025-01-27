/// <reference types="vite/client" />

declare module "vite/client" {
    interface ImportMeta {
        glob: (pattern: string) => Record<string, () => Promise<any>>;
    }
}
