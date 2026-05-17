import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHabits, createHabit, toggleHabit, deleteHabit, getHabitLog } from '../lib/tauri';
import { useUiStore } from '../store/uiStore';
import type { CreateHabitPayload } from '../types';

export function useHabits() {
  return useQuery({ queryKey: ['habits'], queryFn: getHabits });
}

export function useHabitLog(days: number) {
  return useQuery({ queryKey: ['habit_log', days], queryFn: () => getHabitLog(days) });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHabitPayload) => createHabit(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useToggleHabit() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: number; date?: string }) =>
      toggleHabit(habitId, date),
    onSuccess: (result) => {
      qc.setQueryData(['character'], result.character_after);
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['habit_log'] });
      qc.invalidateQueries({ queryKey: ['activity_log'] });
      if (result.xp_delta > 0) {
        addToast({ type: 'xp', message: result.habit.name, xp: result.xp_delta });
      }
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}
