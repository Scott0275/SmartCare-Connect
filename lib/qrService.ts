export function generatePatientQR(patientId: string): string {
  const qrData = {
    type: 'patient',
    id: patientId,
    timestamp: Date.now()
  };
  return JSON.stringify(qrData);
}

export function parsePatientQR(qrString: string): { patientId: string } | null {
  try {
    const data = JSON.parse(qrString);
    if (data.type === 'patient' && data.id) {
      return { patientId: data.id };
    }
    return null;
  } catch (error) {
    console.error('Invalid QR code:', error);
    return null;
  }
}