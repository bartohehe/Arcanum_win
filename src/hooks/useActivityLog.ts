import { useQuery } from '@tanstack/react-query';
import { getActivityLog } from '../lib/tauri';

export function useActivityLog(limit = 30) {
  return useQuery({ queryKey: ['activity_log'], queryFn: () => getActivityLog(limit) });
}
