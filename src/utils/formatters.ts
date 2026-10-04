export const formatNaira = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'HOUSE':
      return 'House';
    case 'FLAT_APARTMENT':
      return 'Flat & Apartment';
    case 'LAND':
      return 'Land';
    case 'COMMERCIAL':
      return 'Commercial';
    default:
      return category;
  }
};

export const getPropertyTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    DETACHED_DUPLEX: 'Fully Detached Duplex',
    SEMI_DETACHED_DUPLEX: 'Semi-Detached Duplex',
    TERRACED_DUPLEX: 'Terraced Duplex',
    DETACHED_BUNGALOW: 'Detached Bungalow',
    BLOCK_OF_FLATS: 'Block of Flats',
    MINI_FLAT: 'Mini Flat (Room & Parlour)',
    SELF_CONTAIN: 'Self-Contained Studio',
    STANDARD_APARTMENT: 'Standard Apartment',
    PENTHOUSE: 'Luxury Penthouse',
    RESIDENTIAL_LAND: 'Residential Land',
    COMMERCIAL_LAND: 'Commercial Land',
    INDUSTRIAL_LAND: 'Industrial Land',
    PLAZA_COMPLEX_MALL: 'Plaza / Complex',
    OFFICE_SPACE: 'Office Space',
    WAREHOUSE: 'Warehouse',
  };
  return map[type] || type.replace(/_/g, ' ');
};

export const getTitleDocumentLabel = (doc?: string): string => {
  switch (doc) {
    case 'C_OF_O':
      return 'Certificate of Occupancy (C of O)';
    case 'GOVERNORS_CONSENT':
      return "Governor's Consent";
    case 'GAZETTE':
      return 'Government Gazette';
    case 'SURVEY_PLAN':
      return 'Registered Survey Plan';
    case 'DEED_OF_ASSIGNMENT':
      return 'Deed of Assignment';
    case 'EXCISION':
      return 'Approved Excision';
    case 'COURT_JUDGEMENT':
      return 'Court Judgement';
    default:
      return doc || 'Verified Title';
  }
};
