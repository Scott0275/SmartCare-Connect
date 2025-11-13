import { useParams } from 'next/navigation';

export function useSafeParams<Key extends string>(key: Key): string | null {
  const params = useParams();
  const value = params?.[key];

  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}
