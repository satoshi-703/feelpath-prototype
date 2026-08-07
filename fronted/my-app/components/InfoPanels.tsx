import { useRef, useState } from "react";
import {
  GraphNode,
  GraphEdge,
  generateAdjacencyMatrix,
  generateDistanceMatrix,
  generateUndirectedAdjacencyMatrix,
} from "../lib/graph";

const LONG_PRESS_MS = 350;

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  weightedMode: boolean;

  showUndirectedMatrix: boolean;
  onCloseUndirectedMatrix: () => void;

  showMatrix: boolean;
  onCloseMatrix: () => void;

  showDistanceMatrix: boolean;
  onCloseDistanceMatrix: () => void;

  showDegrees: boolean;
  onCloseDegrees: () => void;
  nodeDegrees: { id: number; label: string; degree: number }[];

  showDegreeDist: boolean;
  onCloseDegreeDist: () => void;
  degreeDist: Record<number, number>;

  showClustering: boolean;
  onCloseClustering: () => void;
  clusteringCoefficients: Record<number, number>;
  averageClustering: number | null;

  showAverageDistance: boolean;
  onCloseAverageDistance: () => void;
  averageDistance: number | null;

  showAvgNeighborDegree: boolean;
  onCloseAvgNeighborDegree: () => void;
  avgNeighborDegreeList: { id: number; label: string; avgNeighborDegree: number }[];
}

export default function InfoPanels({
  nodes,
  edges,
  weightedMode,
  showUndirectedMatrix,
  onCloseUndirectedMatrix,
  showMatrix,
  onCloseMatrix,
  showDistanceMatrix,
  onCloseDistanceMatrix,
  showDegrees,
  onCloseDegrees,
  nodeDegrees,
  showDegreeDist,
  onCloseDegreeDist,
  degreeDist,
  showClustering,
  onCloseClustering,
  clusteringCoefficients,
  averageClustering,
  showAverageDistance,
  onCloseAverageDistance,
  averageDistance,
  showAvgNeighborDegree,
  onCloseAvgNeighborDegree,
  avgNeighborDegreeList,
}: Props) {
  return (
    <>
      {showUndirectedMatrix && (
        <DraggablePanel defaultTop={72} defaultRight={12} onClose={onCloseUndirectedMatrix}>
          <h2 className="text-lg font-bold mb-2 border-b pb-1">無向 A =</h2>
          <table className="table-auto border-collapse border border-gray-400 w-full text-sm">
            <tbody>
              {generateUndirectedAdjacencyMatrix(nodes, edges).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-2 py-1 text-center">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </DraggablePanel>
      )}

      {showMatrix && (
        <DraggablePanel defaultTop={108} defaultRight={36} onClose={onCloseMatrix}>
          <h2 className="text-lg font-bold mb-2 border-b pb-1">有向 A =</h2>
          <table className="table-auto border-collapse border border-gray-400 w-full text-sm">
            <tbody>
              {generateAdjacencyMatrix(nodes, edges, weightedMode).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-2 py-1 text-center">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </DraggablePanel>
      )}

      {showDistanceMatrix && (
        <DraggablePanel defaultTop={144} defaultRight={60} onClose={onCloseDistanceMatrix}>
          <h2 className="text-lg font-bold mb-2 border-b pb-1">G =</h2>
          <table className="table-auto border-collapse border border-gray-400 w-full text-sm">
            <tbody>
              {generateDistanceMatrix(nodes, edges, weightedMode).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-2 py-1 text-center">
                      {cell === Infinity ? "∞" : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </DraggablePanel>
      )}

      {showDegrees && (
        <DraggablePanel defaultTop={180} defaultRight={12} onClose={onCloseDegrees}>
          <h2 className="text-lg font-bold mb-2 border-b pb-1">無向グラフの次数</h2>
          <ul className="mt-2 space-y-1">
            {nodeDegrees.map(n => (
              <li key={n.id}>{n.label}: {n.degree} </li>
            ))}
          </ul>
        </DraggablePanel>
      )}

      {showDegreeDist && (
        <DraggablePanel defaultTop={216} defaultRight={36} onClose={onCloseDegreeDist}>
          <h2 className="text-lg font-bold mb-2 border-b pb-1">P(k) =</h2>
          <ul className="mt-2 space-y-1">
            {Object.keys(degreeDist)
              .sort((a, b) => Number(a) - Number(b))
              .map(k => (
                <li key={k}>
                  P({k}) = {degreeDist[Number(k)]} / {nodes.length}
                </li>
              ))}
          </ul>
        </DraggablePanel>
      )}

      {showClustering && (
        <DraggablePanel defaultTop={252} defaultRight={60} onClose={onCloseClustering}>
          <h2 className="text-lg font-bold mb-2">クラスタ係数</h2>
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">ノード</th>
                <th className="border px-2 py-1">係数</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(clusteringCoefficients).map(([id, coeff]) => (
                <tr key={id}>
                  <td className="border px-2 py-1">{id}</td>
                  <td className="border px-2 py-1">{coeff.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 font-bold">
            平均クラスタ係数：{averageClustering?.toFixed(3)}
          </p>
        </DraggablePanel>
      )}

      {showAverageDistance && (
        <DraggablePanel defaultTop={288} defaultRight={12} onClose={onCloseAverageDistance}>
          <h2 className="text-xl font-bold mb-2">平均ノード間距離</h2>
          <div className="text-center text-2xl font-semibold text-indigo-600">
            {averageDistance !== null ? averageDistance.toFixed(3) : "-"}
          </div>
          <p className="text-gray-600 text-sm mt-2">
            グラフ内の全ペアの最短距離の平均値です。
          </p>
        </DraggablePanel>
      )}

      {showAvgNeighborDegree && (
        <DraggablePanel defaultTop={324} defaultRight={36} onClose={onCloseAvgNeighborDegree}>
          <h2 className="text-lg font-bold mb-2 border-b pb-1">平均近傍次数</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">ラベル</th>
                <th className="border px-2 py-1">平均近傍次数</th>
              </tr>
            </thead>
            <tbody>
              {avgNeighborDegreeList.map(n => (
                <tr key={n.id}>
                  <td className="border px-2 py-1">{n.id}</td>
                  <td className="border px-2 py-1">{n.label}</td>
                  <td className="border px-2 py-1">{n.avgNeighborDegree.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DraggablePanel>
      )}
    </>
  );
}

{/* 長押し(350ms)後のドラッグでパネルを移動。閉じるボタンはドラッグ対象から除外 */ }
function DraggablePanel({
  defaultTop,
  defaultRight,
  onClose,
  children,
}: {
  defaultTop: number;
  defaultRight: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
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

  {/* 同一フレーム内のpointermoveを1回のsetPosにまとめ、再レンダー頻度を抑える */ }
  const flushPendingDelta = () => {
    rafRef.current = null;
    const { dx, dy } = pendingDeltaRef.current;
    pendingDeltaRef.current = { dx: 0, dy: 0 };
    if (dx === 0 && dy === 0) return;

    setPos(prev => {
      const rect = panelRef.current!.getBoundingClientRect();
      const base = prev ?? { left: rect.left, top: rect.top };
      const maxLeft = Math.max(window.innerWidth - rect.width, 0);
      const maxTop = Math.max(window.innerHeight - rect.height, 0);
      const left = Math.min(Math.max(base.left + dx, 0), maxLeft);
      const top = Math.min(Math.max(base.top + dy, 0), maxTop);
      return { left, top };
    });
  };

  const flushAndCancelPendingFrame = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    flushPendingDelta(); // 予約中フレームをキャンセルした分、未反映の移動量を即座に反映
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button > 0) return;
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

  const style: React.CSSProperties = pos
    ? { left: pos.left, top: pos.top, right: "auto" }
    : { top: defaultTop, right: defaultRight };

  return (
    <div
      ref={panelRef}
      className="fixed bg-white border shadow-lg p-4 w-80 max-w-[calc(100vw-1.5rem)] max-h-72 overflow-auto rounded-lg z-40"
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPress}
      onPointerCancel={endPress}
    >
      <button
        className="bg-red-500 text-white px-2 py-1 rounded mb-2"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onClose}
      >
        ×
      </button>
      {children}
    </div>
  );
}
