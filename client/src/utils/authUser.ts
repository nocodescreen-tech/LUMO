export const normalizeAuthUser = (userData: any) => {
  if (!userData) return null;
  
  // Si les données sont enveloppées dans un objet 'user'
  const data = userData.user || userData;
  
  return {
    id: data.id,
    nom: data.nom,
    email: data.email,
    role: data.role,
    avatar: data.avatar,
    telephone: data.telephone,
    typeActivite: data.typeActivite,
    entreprise: {
      nom: data.entreprise?.nom || '',
      devise: data.entreprise?.devise || 'FC',
      adresse: data.entreprise?.adresse || '',
      logo: data.entreprise?.logo || '',
    },
    preferences: {
      theme: data.preferences?.theme || 'light',
      language: data.preferences?.language || 'fr',
      enabledModules: data.preferences?.enabledModules || ['suppliers', 'debts'],
    }
  };
};
