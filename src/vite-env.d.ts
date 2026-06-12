/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MERCADO_PAGO_PUBLIC_KEY?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
