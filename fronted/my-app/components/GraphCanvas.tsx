import { useRef } from "react";
import { GraphNode, GraphEdge } from "../lib/graph";

const NODE_RADIUS = 20;
const LONG_PRESS_MS = 350;

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  weightedMode: boolean;
  selectedNode: number | null;
  startNodeId: number | null;
  goalNodeId: number | null;
  shortestPath: number[];
  shortestPathVisible: boolean;
  longestPath: number[];
  longestPathVisible: boolean;
  showMaxIn: boolean;
  maxInNodeId: number | null;
  showMaxOut: boolean;
  maxOutNodeId: number | null;
  onCanvasClick: (e: React.MouseEvent<SVGSVGElement>) => void;
  onNodeClick: (nodeId: number) => void;
  onNodeRightClick: (e: React.MouseEvent, nodeId: number) => void;
  onNodeDrag: (nodeId: number, x: number, y: number) => void;
}

export default function GraphCanvas({
  nodes,
  edges,
  weightedMode,
  selectedNode,
  startNodeId,
  goalNodeId,
  shortestPath,
  shortestPathVisible,
  longestPath,
  longestPathVisible,
  showMaxIn,
  maxInNodeId,
  showMaxOut,
  maxOutNodeId,
  onCanvasClick,
  onNodeClick,
  onNodeRightClick,
  onNodeDrag,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  {/* ノードのドラッグ移動量を現在位置に加算し、キャンバス範囲内にクランプする */ }
  const handleNodeDragDelta = (nodeId: number, dx: number, dy: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const rect = svgRef.current?.getBoundingClientRect();
    const maxX = rect ? Math.max(rect.width - NODE_RADIUS, NODE_RADIUS) : Infinity;
    const maxY = rect ? Math.max(rect.height - NODE_RADIUS, NODE_RADIUS) : Infinity;
    const newX = Math.min(Math.max(node.x + dx, NODE_RADIUS), maxX);
    const newY = Math.min(Math.max(node.y + dy, NODE_RADIUS), maxY);
    onNodeDrag(nodeId, newX, newY);
  };

  return (
    <svg ref={svgRef} className="flex-1 border min-w-0" onClick={onCanvasClick}>
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="black" />
        </marker>
      </defs>

      {edges.map((edge, i) => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return null;
        const shorten = NODE_RADIUS + 2;
        const dx = toNode.x - fromNode.x, dy = toNode.y - fromNode.y;
        const length = Math.sqrt(dx * dx + dy * dy), factor = (length - shorten) / length;
        const x2 = fromNode.x + dx * factor, y2 = fromNode.y + dy * factor;

        const isOnShortest = shortestPathVisible && shortestPath.includes(edge.from) && shortestPath.includes(edge.to) && shortestPath.indexOf(edge.to) === shortestPath.indexOf(edge.from) + 1;
        const isOnLongest = longestPathVisible && longestPath.includes(edge.from) && longestPath.includes(edge.to) && longestPath.indexOf(edge.to) === longestPath.indexOf(edge.from) + 1;

        return (
          <g key={i}>
            <line
              x1={fromNode.x} y1={fromNode.y} x2={x2} y2={y2}
              stroke={isOnShortest ? "orange" : isOnLongest ? "purple" : "black"}
              strokeWidth={isOnShortest || isOnLongest ? 4 : 2}
              markerEnd="url(#arrow)"
            />
            {weightedMode && <text x={(fromNode.x + x2) / 2} y={(fromNode.y + y2) / 2 - 5} textAnchor="middle" fill="black">{edge.weight}</text>}
          </g>
        )
      })}

      {nodes.map(node => {
        let fillColor = "lightblue";
        if (node.id === selectedNode) fillColor = "orange";
        else if (node.id === startNodeId) fillColor = "green";
        else if (node.id === goalNodeId) fillColor = "red";
        else if (showMaxIn && node.id === maxInNodeId) fillColor = "pink";    // 入次数最大
        else if (showMaxOut && node.id === maxOutNodeId) fillColor = "cyan";   // 出次数最大
        return (
          <DraggableNode
            key={node.id}
            node={node}
            fillColor={fillColor}
            onClick={() => onNodeClick(node.id)}
            onRightClick={(e) => onNodeRightClick(e, node.id)}
            onDragDelta={(dx, dy) => handleNodeDragDelta(node.id, dx, dy)}
          />
        )
      })}
    </svg>
  );
}

{/* 長押し(350ms)後のドラッグでノードを移動、それ未満のリリースは通常クリック扱い */ }
function DraggableNode({
  node,
  fillColor,
  onClick,
  onRightClick,
  onDragDelta,
}: {
  node: GraphNode;
  fillColor: string;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
  onDragDelta: (dx: number, dy: number) => void;
}) {
  const isDraggingRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const pendingDeltaRef = useRef({ dx: 0, dy: 0 });
  const rafRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  {/* 同一フレーム内のpointermoveを1回のonDragDelta呼び出しにまとめ、再レンダー頻度を抑える */ }
  const flushPendingDelta = () => {
    rafRef.current = null;
    const { dx, dy } = pendingDeltaRef.current;
    pendingDeltaRef.current = { dx: 0, dy: 0 };
    if (dx !== 0 || dy !== 0) onDragDelta(dx, dy);
  };

  const flushAndCancelPendingFrame = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    flushPendingDelta(); // 予約中フレームをキャンセルした分、未反映の移動量を即座に反映
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button > 0) return; // 右クリックは削除用のコンテキストメニューに譲る
    pointerIdRef.current = e.pointerId;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => { isDraggingRef.current = true; }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId || !isDraggingRef.current || !lastPosRef.current) return;
    e.preventDefault();
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    pendingDeltaRef.current.dx += dx;
    pendingDeltaRef.current.dy += dy;
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(flushPendingDelta);
  };

  const endPress = (e: React.PointerEvent) => {
    clearTimer();
    flushAndCancelPendingFrame();
    pointerIdRef.current = null;
    lastPosRef.current = null;
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef.current) { isDraggingRef.current = false; return; } // ドラッグ後のクリックは無視
    onClick();
  };

  return (
    <g
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      onClick={handleClick}
      onContextMenu={onRightClick}
      style={{ touchAction: "none", cursor: "grab" }}
    >
      <circle cx={node.x} cy={node.y} r={NODE_RADIUS} fill={fillColor} stroke="black" strokeWidth={2} />
      <text x={node.x} y={node.y} textAnchor="middle" alignmentBaseline="middle" style={{ userSelect: "none", pointerEvents: "none" }}>{node.label}</text>
    </g>
  );
}
