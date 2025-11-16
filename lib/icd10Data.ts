export const ICD10_CODES = [
  { code: 'A00', description: 'Cholera', category: 'Infectious diseases' },
  { code: 'A01', description: 'Typhoid and paratyphoid fevers', category: 'Infectious diseases' },
  { code: 'A02', description: 'Other salmonella infections', category: 'Infectious diseases' },
  { code: 'A09', description: 'Infectious gastroenteritis and colitis', category: 'Infectious diseases' },
  { code: 'B00', description: 'Herpesviral infections', category: 'Infectious diseases' },
  { code: 'B15', description: 'Acute hepatitis A', category: 'Infectious diseases' },
  { code: 'B16', description: 'Acute hepatitis B', category: 'Infectious diseases' },
  { code: 'B20', description: 'Human immunodeficiency virus disease', category: 'Infectious diseases' },
  { code: 'E10', description: 'Type 1 diabetes mellitus', category: 'Endocrine diseases' },
  { code: 'E11', description: 'Type 2 diabetes mellitus', category: 'Endocrine diseases' },
  { code: 'E78', description: 'Disorders of lipoprotein metabolism', category: 'Endocrine diseases' },
  { code: 'I10', description: 'Essential hypertension', category: 'Circulatory diseases' },
  { code: 'I20', description: 'Angina pectoris', category: 'Circulatory diseases' },
  { code: 'I21', description: 'Acute myocardial infarction', category: 'Circulatory diseases' },
  { code: 'I25', description: 'Chronic ischaemic heart disease', category: 'Circulatory diseases' },
  { code: 'J00', description: 'Acute nasopharyngitis (common cold)', category: 'Respiratory diseases' },
  { code: 'J06', description: 'Acute upper respiratory infections', category: 'Respiratory diseases' },
  { code: 'J18', description: 'Pneumonia, unspecified organism', category: 'Respiratory diseases' },
  { code: 'J44', description: 'Chronic obstructive pulmonary disease', category: 'Respiratory diseases' },
  { code: 'J45', description: 'Asthma', category: 'Respiratory diseases' },
  { code: 'K29', description: 'Gastritis and duodenitis', category: 'Digestive diseases' },
  { code: 'K30', description: 'Functional dyspepsia', category: 'Digestive diseases' },
  { code: 'K59', description: 'Other functional intestinal disorders', category: 'Digestive diseases' },
  { code: 'M25', description: 'Other joint disorders', category: 'Musculoskeletal diseases' },
  { code: 'M54', description: 'Dorsalgia', category: 'Musculoskeletal diseases' },
  { code: 'N39', description: 'Other disorders of urinary system', category: 'Genitourinary diseases' },
  { code: 'R50', description: 'Fever, unspecified', category: 'Symptoms and signs' },
  { code: 'R51', description: 'Headache', category: 'Symptoms and signs' },
  { code: 'R06', description: 'Abnormalities of breathing', category: 'Symptoms and signs' },
  { code: 'Z00', description: 'General examination and investigation', category: 'Health services' },
];

export function searchICD10(query: string) {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase();
  return ICD10_CODES.filter(code => 
    code.code.toLowerCase().includes(searchTerm) ||
    code.description.toLowerCase().includes(searchTerm)
  ).slice(0, 10);
}