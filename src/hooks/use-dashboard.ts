import { useEffect } from 'react';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';

export function useDashboard() {
  const store = useDashboardStore();
  const selectedProject = useRoadmapStore(s => s.selectedProject);

  useEffect(() => {
    if (selectedProject?.id) {
      store.loadDashboard(selectedProject.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?.id]);

  return store;
}
