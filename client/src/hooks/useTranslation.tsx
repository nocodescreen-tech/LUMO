import { useAuthStore } from '../store/useAuthStore';
import { translations } from '../translations';

export const useTranslation = () => {
  const { language } = useAuthStore();
  const dict = (translations as any)[language] || translations.fr;

  const t = (key: string) => dict[key] || key;
  // Proxy for property access to allow t.key style
  Object.assign(t, dict);

  return { t: t as any, language };
};
