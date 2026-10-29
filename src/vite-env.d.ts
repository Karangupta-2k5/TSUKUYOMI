/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_WEATHER_WEBHOOK_URL?: string;
  readonly VITE_N8N_GEOCODE_WEBHOOK_URL?: string;
  readonly VITE_N8N_EVENTS_WEBHOOK_URL?: string;
  readonly VITE_APP_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css';
declare module '*.svg' {
  const content: string;
  export default content;
}
