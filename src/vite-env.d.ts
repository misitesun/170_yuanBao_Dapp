/// <reference types="vite/client" />

interface ViteTypeOptions {
    strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    readonly VITE_BASE_URL: string
    readonly VITE_RPC_URL: string
    readonly VITE_YB_PROJECT_ADDRESS: string
    readonly VITE_YB_PROJECT_CHAIN_ID: string
    readonly VITE_APP_NAME: string
    readonly VITE_ENABLE_SOCIAL_META: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
