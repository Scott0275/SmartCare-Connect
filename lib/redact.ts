const PHI_PATTERNS = [
  // SSN patterns
  /\b\d{3}-?\d{2}-?\d{4}\b/g,
  // Phone numbers
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Credit card numbers (basic pattern)
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // Medical record numbers (assuming format MRN-XXXXXX)
  /\bMRN-?\d{6,}\b/gi,
];

const PHI_FIELDS = [
  'ssn', 'socialSecurityNumber', 'phone', 'phoneNumber', 'email', 'emailAddress',
  'address', 'streetAddress', 'zipCode', 'postalCode', 'medicalRecordNumber',
  'mrn', 'patientId', 'dob', 'dateOfBirth', 'birthDate', 'password', 'token',
  'apiKey', 'secret', 'privateKey', 'creditCard', 'cardNumber'
];

export function redactText(text: string): string {
  let redacted = text;
  
  PHI_PATTERNS.forEach(pattern => {
    redacted = redacted.replace(pattern, '[REDACTED]');
  });
  
  return redacted;
}

export function redactObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return redactText(obj);
  }
  
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item));
  }
  
  const redacted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (PHI_FIELDS.some(field => lowerKey.includes(field))) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactObject(value);
    }
  }
  
  return redacted;
}

export function redactLogData(data: any): any {
  return redactObject(data);
}

export function createRedactedLogger(originalLogger: any) {
  return {
    ...originalLogger,
    info: (message: string, data?: any) => 
      originalLogger.info(redactText(message), data ? redactObject(data) : undefined),
    warn: (message: string, data?: any) => 
      originalLogger.warn(redactText(message), data ? redactObject(data) : undefined),
    error: (message: string, error?: Error, data?: any) => 
      originalLogger.error(redactText(message), error, data ? redactObject(data) : undefined),
    debug: (message: string, data?: any) => 
      originalLogger.debug(redactText(message), data ? redactObject(data) : undefined),
  };
}