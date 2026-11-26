// Diz ao TypeScript quais variáveis de ambiente existem e seus tipos.
// Sem isto, import.meta.env.VITE_API_URL teria o tipo any.
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
