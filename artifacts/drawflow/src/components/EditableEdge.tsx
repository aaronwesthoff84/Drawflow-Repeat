import React, { useState, useCallback, useRef } from "react";
import { EdgeProps, getBezierPath, useReactFlow } from "@xyflow/react";

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
  const [hoveredWaypoint, setHoveredWaypoint] = useState<number | null>(null);
  const draggingRef = useRef<{ index: number } | null>(null);
  const didDragRef = useRef(false);

  const waypoints: Waypoint[] = (data?.waypoints as Waypoint[]) || [];
  const pathStyle = (data?.pathStyle as string) || "default";

  const updateWaypoints = useCallback(
    (newWaypoints: Waypoint[]) => {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === id ? { ...e, data: { ...(e.data || {}), waypoints: newWaypoints } } : e
        )
      );
    },
    [id, setEdges]
  );

  const handleDeleteEdge = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEdges((eds) => eds.filter((e) => e.id !== id));
    },
    [id, setEdges]
  );

  const handleDeleteWaypoint = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      e.preventDefault();
      const newWaypoints = waypoints.filter((_, i) => i !== index);
      updateWaypoints(newWaypoints);
      setHoveredWaypoint(null);
    },
    [waypoints, updateWaypoints]
  );

  const handleEdgeClick = useCallback(
    (e: React.MouseEvent) => {
      if (draggingRef.current) return;
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
        if (d < minDist) { minDist = d; insertIdx = i; }
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
      didDragRef.current = false;
      draggingRef.current = { index };

      const onMouseMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return;
        didDragRef.current = true;
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

  // Build SVG path based on pathStyle
  let path: string;
  if (waypoints.length === 0) {
    if (pathStyle === "straight") {
      path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    } else if (pathStyle === "step") {
      const midX = (sourceX + targetX) / 2;
      path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
    } else {
      [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    }
  } else {
    const points = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }];
    if (pathStyle === "step") {
      path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const midX = (points[i - 1].x + points[i].x) / 2;
        path += ` L ${midX} ${points[i - 1].y} L ${midX} ${points[i].y} L ${points[i].x} ${points[i].y}`;
      }
    } else {
      path = `M ${points[0].x} ${points[0].y}` + points.slice(1).map((p) => ` L ${p.x} ${p.y}`).join("");
    }
  }

  const midPoint = waypoints.length > 0
    ? waypoints[Math.floor(waypoints.length / 2)]
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
        style={{ cursor: "copy" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleEdgeClick}
        className="react-flow__edge-interaction"
      />

      {showControls && waypoints.length === 0 && (
        <circle
          cx={midPoint.x}
          cy={midPoint.y}
          r={5}
          fill="#374151"
          stroke="#6b7280"
          strokeWidth={1.5}
          style={{ cursor: "copy", pointerEvents: "all" }}
          onClick={handleEdgeClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title="Click to add bend point"
          className="nopan"
        />
      )}

      {waypoints.map((wp, i) => (
        <g key={i} className="nopan nodrag" style={{ pointerEvents: "all" }}>
          <circle
            cx={wp.x}
            cy={wp.y}
            r={7}
            fill={hoveredWaypoint === i ? "#2563eb" : "#3b82f6"}
            stroke="#1a1f2e"
            strokeWidth={2}
            style={{ cursor: "move" }}
            onMouseDown={(e) => handleWaypointMouseDown(e, i)}
            onMouseEnter={() => { setHovered(true); setHoveredWaypoint(i); }}
            onMouseLeave={() => { setHoveredWaypoint(null); }}
          />

          {(hoveredWaypoint === i || selected) && (
            <g
              style={{ cursor: "pointer" }}
              onClick={(e) => handleDeleteWaypoint(e, i)}
              onMouseEnter={() => { setHovered(true); setHoveredWaypoint(i); }}
              onMouseLeave={() => setHoveredWaypoint(null)}
            >
              <circle cx={wp.x + 10} cy={wp.y - 10} r={7} fill="#1a1f2e" stroke="#ef4444" strokeWidth={1.5} />
              <text x={wp.x + 10} y={wp.y - 6} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#ef4444" style={{ userSelect: "none", pointerEvents: "none" }}>×</text>
            </g>
          )}
        </g>
      ))}

      {showControls && (
        <g
          className="nopan nodrag"
          transform={`translate(${midPoint.x}, ${midPoint.y - (waypoints.length > 0 ? 24 : 20)})`}
          style={{ cursor: "pointer" }}
          onClick={handleDeleteEdge}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <rect x={-18} y={-9} width={36} height={18} rx={4} fill="#1a1f2e" stroke="#ef4444" strokeWidth={1.5} />
          <text x={0} y={4} textAnchor="middle" fontSize={10} fill="#ef4444" style={{ userSelect: "none", pointerEvents: "none" }}>del edge</text>
        </g>
      )}
    </>
  );
}
