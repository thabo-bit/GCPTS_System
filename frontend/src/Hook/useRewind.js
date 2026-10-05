import { useState, useCallback } from 'react';

export const useRewind = (initialPresent) => {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initialPresent);
  const [future, setFuture] = useState([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture([present, ...future]);
    setPresent(previous);
  }, [canUndo, past, present, future]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast([...past, present]);
    setPresent(next);
    setFuture(newFuture);
  }, [canRedo, future, past, present]);

  const set = useCallback((newPresent) => {
    if (newPresent === present) return;

    setPast([...past, present]);
    setPresent(newPresent);
    setFuture([]);
  }, [present, past]);

  return { state: present, set, undo, redo, canUndo, canRedo };
};