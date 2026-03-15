import { useAuthStore } from '../store/useAuthStore';
import { translations } from '../translations';

export const useTranslation = () => {
  const { language } = useAuthStore();
  const t = (translations as any)[language] || translations.fr;

  return { t, language };
};
