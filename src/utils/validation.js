/**
 * Validates Indian Phone Number format.
 * Accepts 10 digits starting with 6, 7, 8, or 9 (with optional +91 or leading 0).
 */
export const validatePhone = (phone) => {
  if (!phone) return { isValid: false, message: 'Phone number is required.' };
  
  // Clean whitespace, hyphens, and brackets
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Strip leading +91 or 0 if present
  let normalized = cleaned;
  if (normalized.startsWith('+91')) {
    normalized = normalized.substring(3);
  } else if (normalized.startsWith('91') && normalized.length === 12) {
    normalized = normalized.substring(2);
  } else if (normalized.startsWith('0') && normalized.length === 11) {
    normalized = normalized.substring(1);
  }

  // Check 10-digit Indian phone regex (starts with 6, 7, 8, 9)
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(normalized)) {
    return { 
      isValid: false, 
      message: 'Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.' 
    };
  }

  return { isValid: true, normalizedPhone: normalized, message: '' };
};

/**
 * Validates customer name.
 */
export const validateName = (name) => {
  if (!name || !name.trim()) {
    return { isValid: false, message: 'Name is required.' };
  }
  if (name.trim().length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long.' };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates order quantity.
 */
export const validateQuantity = (quantity) => {
  const num = Number(quantity);
  if (isNaN(num) || !Number.isInteger(num) || num < 1) {
    return { isValid: false, message: 'Quantity must be a positive whole number (minimum 1).' };
  }
  return { isValid: true, quantity: num, message: '' };
};

/**
 * Formats Rupee currency
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Formats Firestore timestamp or JS Date to human readable string
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  let date;
  if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput.seconds) {
    date = new Date(dateInput.seconds * 1000);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return 'N/A';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
