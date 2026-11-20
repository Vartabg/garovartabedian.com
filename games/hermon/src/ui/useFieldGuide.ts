import { useEffect, useState, type ComponentType } from 'react';
import { useGame } from '@/game/store';
// Warm the guide after hydration. A later attempt can retry when a chunk fails to load.
export const GUIDE_LOADING = 'Opening field guide…', GUIDE_FAILED = 'The field guide could not load. Try again.';
type GuideProps = { onClose: () => void };
const loadGuide = () => import('./FieldGuide');
export function useFieldGuide(hydrated: boolean) {
  const journal = useGame(s => s.journal), paused = useGame(s => s.paused), panel = useGame(s => s.panel);
  const [Guide, setGuide] = useState<ComponentType<GuideProps> | null>(null), [failed, setFailed] = useState(false);
  useEffect(() => { if (hydrated) void loadGuide().then(m => setGuide(() => m.default)).catch(() => {}); }, [hydrated]);
  useEffect(() => {
    if (!journal || Guide) return;
    let live = true;
    setFailed(false);
    loadGuide().then(m => { setGuide(() => m.default); setFailed(false); }, () => { if (live) { useGame.setState({ journal: false }); setFailed(true); } });
    return () => { live = false; };
  }, [journal, Guide]);
  useEffect(() => { if (journal && !Guide && panel) useGame.setState({ journal: false }); }, [journal, Guide, panel]);
  // A failure note belongs to the pause it happened in: playing again clears it.
  useEffect(() => { if (!paused) setFailed(false); }, [paused]);
  const fail = () => { useGame.setState({ journal: false }); setFailed(true); };
  // Guide is only handed out while it is wanted and loaded: a falsy Guide with `journal` set means "still loading" (or failed).
  return { Guide: journal ? Guide : null, fail, note: journal && !Guide ? GUIDE_LOADING : failed ? GUIDE_FAILED : '' };
}
