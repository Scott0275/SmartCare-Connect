import { isOnline } from './networkService';

export async function requireOnlineForAuth() {
  const online = await isOnline();
  if (!online) {
    throw new Error('Authentication requires internet connection');
  }
}

export const ONLINE_ONLY_OPERATIONS = [
  'login',
  'user-creation', 
  'role-changes',
  'admin-operations'
];

export const OFFLINE_ALLOWED_OPERATIONS = [
  'vitals',
  'consultations', 
  'prescriptions',
  'notes',
  'labs',
  'pharmacy',
  'appointments',
  'timeline-items'
];

export function isOperationAllowedOffline(operation: string): boolean {
  return OFFLINE_ALLOWED_OPERATIONS.includes(operation);
}