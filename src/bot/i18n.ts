import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

i18next
  .use(Backend)
  .init({
    fallbackLng: 'ru',
    lng: 'ru',
    backend: {
      loadPath: path.join(__dirname, 'locales/{{lng}}.json'),
    },
    interpolation: {
      escapeValue: false,
    },
  });

export const t = (key: string, options?: any) => i18next.t(key, options);
export default i18next;
