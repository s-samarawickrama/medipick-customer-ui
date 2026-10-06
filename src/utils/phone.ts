export const normalizePhoneNumber = (value: string): string => {
  let cleaned = value.replace(/[^\d+]/g, '').replace(/^00/, '+');
  if (cleaned.startsWith('0')) {
    // Convert local 0... to +94...
    cleaned = '+94' + cleaned.slice(1);
  }
  return cleaned;
};

export const formatPhoneNumber = (value: string): string => {
  const digits = normalizePhoneNumber(value).replace(/\D/g, '');

  if (!digits) return '';

  if (digits.startsWith('94')) {
    const local = digits.slice(2);
    if (local.length <= 2) return `+94 ${local}`;
    if (local.length <= 5) return `+94 ${local.slice(0, 2)} ${local.slice(2)}`;
    if (local.length <= 7) {
      return `+94 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
    }
    return `+94 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7, 10)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
};

export const maskPhoneNumber = (value: string | null | undefined): string => {
  if (!value) return '';
  const normalized = normalizePhoneNumber(value);
  if (!normalized || !normalized.startsWith('+94') || normalized.length !== 12) {
    // Fallback for non-standard formats
    return value.replace(/.(?=.{4})/g, '*');
  }
  const code = normalized.slice(3, 5); // e.g. "77" or "11"
  const last = normalized.slice(8);     // e.g. "4567"
  return `+94 ${code} *** ${last}`;
};

export const isValidPhoneNumber = (value: string): boolean => {
  const normalized = normalizePhoneNumber(value);
  // Mobile: 70, 71, 72, 74, 75, 76, 77, 78
  // Landline: 11, 21, 23-27, 31-38, 41, 45, 47, 51, 52, 54, 55, 57, 63, 65-67, 81, 91
  const slRegex = /^\+94(?:7[01245678]|11|2[13-7]|3[1-8]|4[157]|5[12457]|6[35-7]|81|91)\d{7}$/;
  return slRegex.test(normalized);
};
