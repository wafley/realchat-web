import { useQuery } from '@tanstack/react-query';
import { getContacts } from '@/services/contacts';

export function useCustomNames(): Map<string, string> {
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  });
  return new Map(
    contacts
      .map((c) => [c.userId, c.customName] as const)
      .filter((pair): pair is readonly [string, string] => !!pair[1]),
  );
}
