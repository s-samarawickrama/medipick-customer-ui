export const getLocalImage = (name: string | null | undefined) => {
  if (!name) return null;
  const key = name.trim();
  
  switch (key) {
    case 'M1': return require('../../assets/images/M1.png');
    case 'M2': return require('../../assets/images/M2.png');
    case 'M3': return require('../../assets/images/M3.png');
    case 'M4': return require('../../assets/images/M4.png');
    case 'M5': return require('../../assets/images/M5.png');
    case 'P1': return require('../../assets/images/P1.png');
    case 'P2': return require('../../assets/images/P2.png');
    case 'P3': return require('../../assets/images/P3.png');
    default:
      const lower = key.toLowerCase();
      if (lower.includes('panadol')) return require('../../assets/images/M1.png');
      if (lower.includes('metformin')) return require('../../assets/images/M2.png');
      if (lower.includes('vitamin')) return require('../../assets/images/M3.png');
      if (lower.includes('jeevanee') || lower.includes('ors') || lower.includes('bandage')) return require('../../assets/images/M4.png');
      if (lower.includes('siddhalepa') || lower.includes('balm')) return require('../../assets/images/M5.png');
      if (lower.includes('piriton')) return require('../../assets/images/P1.png');
      if (lower.includes('dettol')) return require('../../assets/images/P2.png');
      if (lower.includes('cetaphil')) return require('../../assets/images/P3.png');
      
      // Pharmacy Fallbacks
      if (lower.includes('healthguard')) return require('../../assets/images/P1.png');
      if (lower.includes('union')) return require('../../assets/images/P2.png');
      if (lower.includes('lanka') || lower.includes('city')) return require('../../assets/images/P3.png');
      
      return null;
  }
};

