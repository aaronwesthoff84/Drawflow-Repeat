import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from "@xyflow/react";

interface Waypoint {
  x: number;
  y: number;
}

export function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  style,
  markerEnd,
  animated,
}: EdgeProps) {
  const { setEdges, screenToFlowPosition } = useReactFlow();
  const [hovered, setHovered] = useState(false);
  const draggingRef = useRef<{ index: number } | null>(null);

  const waypoints: Waypoint[] = (data?.waypoints as Waypoint[]) || [];

  const updateWaypoints = useCallback(
    (newWaypoints: Waypoint[]) => {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === id
            ? { ...e, data: { ...(e.data || {}), waypoints: newWaypoints } }
            : e
        )
      );
    },
    [id, setEdges]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEdges((eds) => eds.filter((e) => e.id !== id));
    },
    [id, setEdges]
  );

  const handleEdgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const allPoints = [
        { x: sourceX, y: sourceY },
        ...waypoints,
        { x: targetX, y: targetY },
      ];
      let insertIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < allPoints.length - 1; i++) {
        const mx = (allPoints[i].x + allPoints[i + 1].x) / 2;
        const my = (allPoints[i].y + allPoints[i + 1].y) / 2;
        const d = Math.hypot(flowPos.x - mx, flowPos.y - my);
        if (d < minDist) {
          minDist = d;
          insertIdx = i;
        }
      }
      const newWaypoints = [...waypoints];
      newWaypoints.splice(insertIdx, 0, flowPos);
      updateWaypoints(newWaypoints);
    },
    [sourceX, sourceY, targetX, targetY, waypoints, updateWaypoints, screenToFlowPosition]
  );

  const handleWaypointMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      e.preventDefault();
      draggingRef.current = { index };

      const onMouseMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return;
        const flowPos = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.id !== id) return edge;
            const wps = [...((edge.data?.waypoints as Waypoint[]) || [])];
            wps[draggingRef.current!.index] = flowPos;
            return { ...edge, data: { ...(edge.data || {}), waypoints: wps } };
          })
        );
      };

      const onMouseUp = () => {
        draggingRef.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [id, setEdges, screenToFlowPosition]
  );

  const handleRemoveWaypoint = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      const newWaypoints = waypoints.filter((_, i) => i !== index);
      updateWaypoints(newWaypoints);
    },
    [waypoints, updateWaypoints]
  );

  let path: string;
  if (waypoints.length === 0) {
    [path] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else {
    const points = [
      { x: sourceX, y: sourceY },
      ...waypoints,
      { x: targetX, y: targetY },
    ];
    path =
      `M ${points[0].x} ${points[0].y}` +
      points
        .slice(1)
        .map((p) => ` L ${p.x} ${p.y}`)
        .join("");
  }

  const midIndex = Math.floor(
    (waypoints.length > 0 ? waypoints.length - 1 : 0) / 2
  );
  const midPoint =
    waypoints.length > 0
      ? waypoints[midIndex]
      : { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };

  const showControls = selected || hovered;

  return (
    <>
      <path
        id={id}
        d={path}
        fill="none"
        style={style}
        markerEnd={markerEnd as string}
        className={`react-flow__edge-path${animated ? " animated" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleEdgeClick}
        className="react-flow__edge-interaction"
      />

      {showControls && waypoints.length === 0 && (
        <circle
          cx={midPoint.x}
          cy={midPoint.y}
          r={4}
          fill="#6b7280"
          stroke="#1a1f2e"
          strokeWidth={1.5}
          style={{ cursor: "copy" }}
          onClick={handleEdgeClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title="Click to add waypoint"
          className="nopan"
        />
      )}

      {waypoints.map((wp, i) => (
        <g key={i} className="nopan nodrag">
          <circle
            cx={wp.x}
            cy={wp.y}
            r={6}
            fill="#3b82f6"
            stroke="#1a1f2e"
            strokeWidth={2}
            style={{ cursor: "move" }}
            onMouseDown={(e) => handleWaypointMouseDown(e, i)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          />
          {showControls && (
            <text
              x={wp.x}
              y={wp.y + 4}
              textAnchor="middle"
              fontSize={9}
              fill="white"
              style={{ cursor: "pointer", userSelect: "none", pointerEvents: "none" }}
            >
              ·
            </text>
          )}
          {selected && (
            <circle
              cx={wp.x + 8}
              cy={wp.y - 8}
              r={5}
              fill="#ef4444"
              stroke="#1a1f2e"
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
              onClick={(e) => handleRemoveWaypoint(e, i)}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            />
          )}
        </g>
      ))}

      {showControls && (
        <g
          className="nopan nodrag"
          transform={`translate(${midPoint.x}, ${midPoint.y})`}
          style={{ cursor: "pointer" }}
          onClick={handleDelete}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <circle cx={0} cy={-18} r={9} fill="#1a1f2e" stroke="#ef4444" strokeWidth={1.5} />
          <text
            x={0}
            y={-14}
            textAnchor="middle"
            fontSize={12}
            fill="#ef4444"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            ×
          </text>
        </g>
      )}
    </>
  );
}
