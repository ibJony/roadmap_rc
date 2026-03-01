import { useEffect } from 'react';
import { useOKRStore } from '@/lib/stores/okr-store';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';

export function useOKRs() {
  const store = useOKRStore();
  const selectedProject = useRoadmapStore(s => s.selectedProject);

  useEffect(() => {
    if (selectedProject?.id) {
      store.loadObjectives(selectedProject.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?.id]);

  return store;
}
