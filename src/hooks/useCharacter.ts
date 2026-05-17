import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCharacter, updateName } from '../lib/tauri';

export function useCharacter() {
  return useQuery({ queryKey: ['character'], queryFn: getCharacter });
}

export function useUpdateName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateName,
    onSuccess: (data) => qc.setQueryData(['character'], data),
  });
}
