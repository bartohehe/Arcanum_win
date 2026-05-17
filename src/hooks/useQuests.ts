import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuests, createQuest, toggleQuest, deleteQuest } from '../lib/tauri';
import { useUiStore } from '../store/uiStore';
import type { CreateQuestPayload, QuestBucket } from '../types';

export function useQuests(bucket: QuestBucket) {
  return useQuery({ queryKey: ['quests', bucket], queryFn: () => getQuests(bucket) });
}

export function useCreateQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuestPayload) => createQuest(payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['quests', vars.bucket] }),
  });
}

export function useToggleQuest() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: (questId: number) => toggleQuest(questId),
    onSuccess: (result) => {
      qc.setQueryData(['character'], result.character_after);
      qc.invalidateQueries({ queryKey: ['quests', result.quest.bucket] });
      qc.invalidateQueries({ queryKey: ['activity_log'] });
      if (result.xp_delta > 0) {
        addToast({ type: 'xp', message: result.quest.title, xp: result.xp_delta });
      }
      if (result.level_up) {
        addToast({ type: 'lvlup', message: `Poziom ${result.character_after.level}!` });
      }
    },
  });
}

export function useDeleteQuest(bucket: QuestBucket) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteQuest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quests', bucket] }),
  });
}
