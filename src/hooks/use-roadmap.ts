import { useEffect } from 'react';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';

export function useRoadmap() {
  const store = useRoadmapStore();

  useEffect(() => {
    store.loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
