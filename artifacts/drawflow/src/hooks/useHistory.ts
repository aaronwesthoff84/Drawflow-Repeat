import { useCallback, useState } from "react";
import { Node, Edge } from "@xyflow/react";

export function useHistory<TNode extends Node = Node, TEdge extends Edge = Edge>() {
  const [past, setPast] = useState<{ nodes: TNode[]; edges: TEdge[] }[]>([]);
  const [future, setFuture] = useState<{ nodes: TNode[]; edges: TEdge[] }[]>([]);

  const takeSnapshot = useCallback((nodes: TNode[], edges: TEdge[]) => {
    setPast((p) => {
      const newPast = [...p, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
      if (newPast.length > 50) return newPast.slice(newPast.length - 50);
      return newPast;
    });
    setFuture([]);
  }, []);

  const undo = useCallback(
    (currentNodes: TNode[], currentEdges: TEdge[]) => {
      if (past.length === 0) return null;
      
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      
      setPast(newPast);
      setFuture((f) => [{ nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges)) }, ...f]);
      
      return previous;
    },
    [past]
  );

  const redo = useCallback(
    (currentNodes: TNode[], currentEdges: TEdge[]) => {
      if (future.length === 0) return null;
      
      const next = future[0];
      const newFuture = future.slice(1);
      
      setFuture(newFuture);
      setPast((p) => [...p, { nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges)) }]);
      
      return next;
    },
    [future]
  );

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    takeSnapshot,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clearHistory
  };
}
