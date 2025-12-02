"use client";
import { useState } from "react";
import DegreeCardSlider from "../components/ui/DegreeCardSlider";

export default function Home() {
  const [nodes, setNodes] = useState<{ id: number; x: number; y: number; label: string }[]>([]);
  const [edges, setEdges] = useState<{ from: number; to: number; weight: number }[]>([]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [nodeIdCounter, setNodeIdCounter] = useState(0);
  const [startNodeId, setStartNodeId] = useState<number | null>(null);
  const [goalNodeId, setGoalNodeId] = useState<number | null>(null);
  const [graphId, setGraphId] = useState<string | null>(null);
  const [weightedMode, setWeightedMode] = useState(true);
  const [shortestPath, setShortestPath] = useState<number[]>([]);
  const [shortestPathVisible, setShortestPathVisible] = useState(true);
  const [longestPath, setLongestPath] = useState<number[]>([]);
  const [longestPathVisible, setLongestPathVisible] = useState(true);
  const [nodeLabelInput, setNodeLabelInput] = useState("");
  const [noteText, setNoteText] = useState("");
  const [maxInNodeId, setMaxInNodeId] = useState<number | null>(null);
  const [maxOutNodeId, setMaxOutNodeId] = useState<number | null>(null);
  const [showMaxIn, setShowMaxIn] = useState(false);
  const [showMaxOut, setShowMaxOut] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showDistanceMatrix, setShowDistanceMatrix] = useState(false);
  const [showUndirectedMatrix, setShowUndirectedMatrix] = useState(false);
  const [nodeDegrees, setNodeDegrees] = useState<{ id: number, label: string, degree: number }[]>([]);
  const [averageDegree, setAverageDegree] = useState<number | null>(null);
  const [showDegrees, setShowDegrees] = useState(false);
  const [degreeDist, setDegreeDist] = useState<Record<number, number>>({});
  const [showDegreeDist, setShowDegreeDist] = useState(false);
  const [clusteringCoefficients, setClusteringCoefficients] = useState<Record<number, number>>({});
  const [showClustering, setShowClustering] = useState(false);
  const [averageClustering, setAverageClustering] = useState<number | null>(null);
  const [averageDistance, setAverageDistance] = useState<number | null>(null);
  const [showAverageDistance, setShowAverageDistance] = useState(false);
  const [showAvgNeighborDegree, setShowAvgNeighborDegree] = useState(false);
  const [avgNeighborDegreeList, setAvgNeighborDegreeList] = useState<{ id: number; label: string; avgNeighborDegree: number }[]>([]);






  {/*ノード追加処理*/ }
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const label = nodeLabelInput.trim() || `Node ${nodeIdCounter}`;
    setNodes([...nodes, { id: nodeIdCounter, x, y, label }]);
    setNodeIdCounter(nodeIdCounter + 1);
    setNodeLabelInput("");
  };


  const handleNodeClick = (nodeId: number) => {
    if (selectedNode === null) {
      setSelectedNode(nodeId);
    } else if (selectedNode !== nodeId) {
      let weight = 1;
      if (weightedMode) {
        const input = prompt("この経路の距離を入力");
        if (input === null) return;
        weight = Number(input) || 1;
      }
      setEdges([...edges, { from: selectedNode, to: nodeId, weight }]);
      setSelectedNode(null);
    } else {
      setSelectedNode(null);
    }
  };


  const handleNodeRightClick = (e: React.MouseEvent, nodeId: number) => {
    e.preventDefault();
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.from !== nodeId && e.to !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
    if (startNodeId === nodeId) setStartNodeId(null);
    if (goalNodeId === nodeId) setGoalNodeId(null);
  };


  {/*最短経路探索*/ }
  function findShortestPath(startId: number, goalId: number) {
    const dist: Record<number, number> = {};
    const prev: Record<number, number | null> = {};
    const unvisited = new Set(nodes.map(n => n.id));
    nodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; });
    dist[startId] = 0;

    while (unvisited.size > 0) {
      let current = [...unvisited].reduce((a, b) => (dist[a] < dist[b] ? a : b));
      unvisited.delete(current);
      if (current === goalId) break;
      edges.filter(e => e.from === current).forEach(e => {
        const alt = dist[current] + e.weight;
        if (alt < dist[e.to]) { dist[e.to] = alt; prev[e.to] = current; }
      });
    }

    const path: number[] = [];
    let u: number | null = goalId;
    while (u !== null) { path.unshift(u); u = prev[u]; }
    return path;
  }


  {/*最長経路探索*/ }
  function findLongestPath(startId: number, goalId: number) {
    const paths: number[][] = [];
    function dfs(current: number, visited: Set<number>, path: number[]) {
      if (current === goalId) {
        paths.push([...path]);
        return;
      }
      edges.filter(e => e.from === current).forEach(e => {
        if (!visited.has(e.to)) {
          visited.add(e.to);
          path.push(e.to);
          dfs(e.to, visited, path);
          path.pop();
          visited.delete(e.to);
        }
      });
    }
    dfs(startId, new Set([startId]), [startId]);

    let maxPath: number[] = [];
    let maxWeight = -Infinity;
    paths.forEach(p => {
      let w = 0;
      for (let i = 1; i < p.length; i++) {
        const e = edges.find(e => e.from === p[i - 1] && e.to === p[i]);
        if (e) w += e.weight;
      }
      if (w > maxWeight) { maxWeight = w; maxPath = p; }
    });
    return maxPath;
  }
  const calcMaxDegreeNodes = () => {
    const inDegree: Record<number, number> = {};
    const outDegree: Record<number, number> = {};
    nodes.forEach(n => { inDegree[n.id] = 0; outDegree[n.id] = 0; });
    edges.forEach(e => { outDegree[e.from]++; inDegree[e.to]++; });

    const maxIn = Math.max(...Object.values(inDegree));
    const maxOut = Math.max(...Object.values(outDegree));

    const maxInNode = nodes.find(n => inDegree[n.id] === maxIn)?.id ?? null;
    const maxOutNode = nodes.find(n => outDegree[n.id] === maxOut)?.id ?? null;

    setMaxInNodeId(maxInNode);
    setMaxOutNodeId(maxOutNode);
  };


  {/*隣接行列生成*/ }
  function generateAdjacencyMatrix() {
    const n = nodes.length;
    const idToIndex: Record<number, number> = {};
    nodes.forEach((node, idx) => { idToIndex[node.id] = idx; });

    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    edges.forEach(edge => {
      const fromIdx = idToIndex[edge.from];
      const toIdx = idToIndex[edge.to];
      matrix[fromIdx][toIdx] = weightedMode ? edge.weight : 1;
    });

    return matrix;
  }


  {/*距離行列生成*/ }
  function generateDistanceMatrix(): number[][] {
    const n = nodes.length;
    const idToIndex: Record<number, number> = {};
    nodes.forEach((node, idx) => { idToIndex[node.id] = idx; });

    const dist: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));
    for (let i = 0; i < n; i++) dist[i][i] = 0;

    edges.forEach(e => {
      const from = idToIndex[e.from];
      const to = idToIndex[e.to];
      dist[from][to] = weightedMode ? e.weight : 1;
    });

    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (dist[i][k] + dist[k][j] < dist[i][j]) {
            dist[i][j] = dist[i][k] + dist[k][j];
          }
        }
      }
    }

    return dist;
  }


  {/*無向隣接行列生成*/ }
  function generateUndirectedAdjacencyMatrix() {
    const n = nodes.length;
    const idToIndex: Record<number, number> = {};
    nodes.forEach((node, idx) => { idToIndex[node.id] = idx; });

    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    edges.forEach(edge => {
      const fromIdx = idToIndex[edge.from];
      const toIdx = idToIndex[edge.to];
      matrix[fromIdx][toIdx] = 1;
      matrix[toIdx][fromIdx] = 1; // 無向グラフなので逆も1
    });

    return matrix;
  }


  {/*各ノードの次数を計算*/ }
  function calculateDegrees() {
    const matrix = generateUndirectedAdjacencyMatrix();
    const n = matrix.length;
    if (n === 0) return { degrees: [], avg: 0 };

    const degrees = matrix.map((row, idx) => ({
      id: nodes[idx].id,
      label: nodes[idx].label,
      degree: row.reduce((a, b) => a + b, 0),
    }));

    const totalDegree = degrees.reduce((sum, node) => sum + node.degree, 0);

    return { degrees, avg: totalDegree };
  }


  {/*次数分布を計算*/ }
  function calculateDegreeDistribution() {
    const { degrees } = calculateDegrees();
    const counts: Record<number, number> = {};

    degrees.forEach(d => {
      const k = d.degree;
      if (!(k in counts)) counts[k] = 0;
      counts[k] += 1;
    });

    return { counts };
  }

  // ▼ ノードの隣接ノードを取得
  function getNeighbors(nodeId: number, edges: { from: number; to: number; weight: number }[]) {
    const neighbors = new Set<number>();
    edges.forEach(e => {
      if (e.from === nodeId) neighbors.add(e.to);
      if (e.to === nodeId) neighbors.add(e.from); // 無向グラフ扱い
    });
    return Array.from(neighbors);
  }

  // ▼ 隣接ノード同士でつながっている数を数える
  function countNeighborConnections(neighbors: number[], edges: { from: number; to: number; weight: number }[]) {
    let count = 0;
    const set = new Set(neighbors);
    edges.forEach(e => {
      if (set.has(e.from) && set.has(e.to)) count++;
    });
    return count;
  }

  // ▼ クラスタ係数（あるノード）
  function clusteringCoefficient(nodeId: number, edges: { from: number; to: number; weight: number }[]) {
    const neighbors = getNeighbors(nodeId, edges);
    const k = neighbors.length;

    if (k < 2) return 0;

    const E = countNeighborConnections(neighbors, edges);

    return E / (k * (k - 1));
  }

  // ▼ 全ノードのクラスタ係数を計算
  function computeClusteringCoefficients() {
    const result: Record<number, number> = {};

    nodes.forEach(node => {
      result[node.id] = clusteringCoefficient(node.id, edges);
    });

    setClusteringCoefficients(result);

    // 平均値も計算
    const values = Object.values(result);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    setAverageClustering(avg);

    setShowClustering(true);
  }

  function averageShortestPathFromMatrix() {
    const dist = generateDistanceMatrix();
    const n = dist.length;

    let total = 0;
    let count = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j && dist[i][j] < Infinity) {
          total += dist[i][j];
          count++;
        }
      }
    }

    if (count === 0) return 0;
    return total / count;
  }

  // ▼ ノードの次数を取得
  function getDegree(nodeId: number) {
    const matrix = generateUndirectedAdjacencyMatrix();
    const idToIndex: Record<number, number> = {};
    nodes.forEach((node, idx) => { idToIndex[node.id] = idx; });

    const idx = idToIndex[nodeId];
    if (idx === undefined) return 0;

    return matrix[idx].reduce((a, b) => a + b, 0);
  }

  // ▼ 平均近傍次数を計算
  function averageNeighborDegree(nodeId: number) {
    const neighbors = getNeighbors(nodeId, edges);
    const k = neighbors.length;

    if (k === 0) return 0;

    let total = 0;
    neighbors.forEach(nid => {
      total += getDegree(nid);
    });

    return total / k;
  }




  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* 左メニュー */}
      <div className="w-1/4 p-4 space-y-6 overflow-y-auto">
        {/* グラフ操作カード */}
        <div className="bg-white rounded-xl p-5 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 animate-fade-in">グラフ操作</h2>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-gray-700">
              <input type="checkbox" checked={weightedMode} onChange={() => setWeightedMode(!weightedMode)} />
              重みを設定
            </label>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow transition-all duration-300"
              onClick={() => {
                if (confirm("本当にキャンバスをクリアしますか？")) {
                  setNodes([]); setEdges([]); setSelectedNode(null); setStartNodeId(null); setGoalNodeId(null);
                  setShortestPath([]); setLongestPath([]); setShortestPathVisible(true); setLongestPathVisible(true);
                }
              }}
            >クリア</button>
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 mb-1">ノード名</label>
            <input
              type="text"
              value={nodeLabelInput}
              onChange={(e) => setNodeLabelInput(e.target.value)}
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
              placeholder="新しいノード名"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-gray-700 mb-1">始点</label>
              <select
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300"
                value={startNodeId ?? ""}
                onChange={(e) => setStartNodeId(e.target.value === "" ? null : Number(e.target.value))}
              >
                <option value="">未設定</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">終点</label>
              <select
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-300"
                value={goalNodeId ?? ""}
                onChange={(e) => setGoalNodeId(e.target.value === "" ? null : Number(e.target.value))}
              >
                <option value="">未設定</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
            </div>
          </div>

          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg shadow transition-all duration-300 hover:scale-105 mb-2"
            onClick={() => {
              if (startNodeId !== null && goalNodeId !== null) {
                if (shortestPathVisible) setShortestPathVisible(false);
                else { setShortestPath(findShortestPath(startNodeId, goalNodeId)); setShortestPathVisible(true); }
              }
            }}
          >
            最短経路 {shortestPathVisible ? "非表示" : "表示"}
          </button>

          <button
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg shadow transition-all duration-300 hover:scale-105"
            onClick={() => {
              if (startNodeId !== null && goalNodeId !== null) {
                if (longestPathVisible) setLongestPathVisible(false);
                else { setLongestPath(findLongestPath(startNodeId, goalNodeId)); setLongestPathVisible(true); }
              }
            }}
          >
            最長経路 {longestPathVisible ? "非表示" : "表示"}
          </button>
        </div>

        {/*以下に実装されているのは有向ネットワークに対しての操作である*/}
        {/* 学習カード */}
        <div className="bg-white rounded-xl p-5 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <DegreeCardSlider
            cards={[
              {
                title: "ai202 基本統計量分析",
                content: (
                  <div className="space-y-2">
                    <button
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-lg 
             transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => { calcMaxDegreeNodes(); setShowMaxIn(!showMaxIn); }}
                    >
                      入次数最大ノード {showMaxIn ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg
             transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => { calcMaxDegreeNodes(); setShowMaxOut(!showMaxOut); }}
                    >
                      出次数最大ノード {showMaxOut ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-lime-500 hover:bg-lime-600 text-white py-2 rounded-lg
  transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => setShowUndirectedMatrix(!showUndirectedMatrix)}
                    >
                      無向隣接行列 {showUndirectedMatrix ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg
             transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => setShowMatrix(!showMatrix)}
                    >
                      隣接行列 {showMatrix ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg
             transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => setShowDistanceMatrix(!showDistanceMatrix)}
                    >
                      距離行列 {showDistanceMatrix ? "非表示" : "表示"}
                    </button>
                    <p>〈　ノードの次数分布　〉</p>
                    <button
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg
  transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => {
                        if (!showDegrees) { // 非表示なら計算して表示
                          const { degrees, avg } = calculateDegrees();
                          setNodeDegrees(degrees);
                          setAverageDegree(avg);
                          setShowDegrees(true);
                        } else { // 表示中なら非表示にする
                          setShowDegrees(false);
                        }
                      }}
                    >
                      無向グラフの次数 {showDegrees ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-lg
  transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => {
                        if (!showDegreeDist) { // 非表示なら計算して表示
                          const { counts } = calculateDegreeDistribution();
                          setDegreeDist(counts);
                          setShowDegreeDist(true);
                        } else { // 表示中なら非表示
                          setShowDegreeDist(false);
                        }
                      }}
                    >
                      次数分布 {showDegreeDist ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg
  transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => {
                        if (!showClustering) {
                          computeClusteringCoefficients(); // 計算して表示
                        } else {
                          setShowClustering(false); // すでに表示中なら閉じる
                        }
                      }}
                    >
                      クラスタ係数 {showClustering ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg
  transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => {
                        if (!showAverageDistance) {
                          const avg = averageShortestPathFromMatrix();
                          setAverageDistance(avg);
                          setShowAverageDistance(true);
                        } else {
                          setShowAverageDistance(false);
                        }
                      }}
                    >
                      平均ノード間距離 {showAverageDistance ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg
  transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => {
                        if (!showAvgNeighborDegree) {
                          const list = nodes.map(n => ({
                            id: n.id,
                            label: n.label,
                            avgNeighborDegree: averageNeighborDegree(n.id)
                          }));
                          setAvgNeighborDegreeList(list);
                          setShowAvgNeighborDegree(true);
                        } else {
                          setShowAvgNeighborDegree(false);
                        }
                      }}
                    >
                      平均近傍次数 {showAvgNeighborDegree ? "非表示" : "表示"}
                    </button>

                  </div>
                ),
              },

              {
                title: "ai203 中心性分析",
                content: (
                  <div className="space-y-2">
                    <button
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-lg"
                      onClick={() => { calcMaxDegreeNodes(); setShowMaxIn(!showMaxIn); }}
                    >
                      入次数最大ノード {showMaxIn ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg"
                      onClick={() => { calcMaxDegreeNodes(); setShowMaxOut(!showMaxOut); }}
                    >
                      出次数最大ノード {showMaxOut ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg"
                      onClick={() => setShowMatrix(!showMatrix)}
                    >
                      隣接行列 {showMatrix ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg"
                      onClick={() => setShowDistanceMatrix(!showDistanceMatrix)}
                    >
                      距離行列 {showDistanceMatrix ? "非表示" : "表示"}
                    </button>
                  </div>
                ),
              },

              {
                title: "ai209 ネットワーク構築法",
                content: (
                  <div className="space-y-2">
                    <button
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-lg 
             transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => { calcMaxDegreeNodes(); setShowMaxIn(!showMaxIn); }}
                    >
                      入次数最大ノード {showMaxIn ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg
             transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => { calcMaxDegreeNodes(); setShowMaxOut(!showMaxOut); }}
                    >
                      出次数最大ノード {showMaxOut ? "非表示" : "表示"}
                    </button>

                    <button
                      className="w-full bg-lime-500 hover:bg-lime-600 text-white py-2 rounded-lg
  transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => setShowUndirectedMatrix(!showUndirectedMatrix)}
                    >
                      無向隣接行列 {showUndirectedMatrix ? "非表示" : "表示"}
                    </button>
                  </div>
                ),
              }
            ]}
          /></div>



        {/* 保存/読み込みカード */}
        <div className="bg-white rounded-xl p-5 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 animate-fade-in">保存 / 読み込み</h2>
          <div className="flex gap-2 mb-2">
            <button
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg shadow transition-all duration-300 hover:scale-105"
              onClick={async () => {
                const data = { nodes, edges, weightedMode, user_id: "user1" };
                const res = await fetch("http://localhost:8000/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
                const json = await res.json();
                setGraphId(json.graph_id); alert("保存完了! ID:" + json.graph_id);
              }}
            >保存</button>
            <button
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg shadow transition-all duration-300 hover:scale-105"
              onClick={async () => {
                if (!graphId) return alert("Graph ID を入力してください");
                const res = await fetch(`http://localhost:8000/api/load/${graphId}`);
                const data = await res.json();
                const fixedEdges = data.edges.map((e: any) => ({ from: e.from_ ?? e.from, to: e.to, weight: e.weight }));
                setNodes(data.nodes); setEdges(fixedEdges); setWeightedMode(data.weightedMode);
                alert("読み込み完了!");
              }}
            >読み込み</button>
          </div>
          <input
            type="text"
            value={graphId ?? ""}
            onChange={(e) => setGraphId(e.target.value)}
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
            placeholder="Graph ID"
          />
        </div>

        {/* メモカード */}
        <div className="bg-white rounded-xl p-5 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <h2 className="text-xl font-bold mb-2 border-b pb-2 animate-fade-in">メモ</h2>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full border rounded-lg p-2 h-48 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-300"
            placeholder="自由にメモを入力"
          />
        </div>
      </div>


      {/* 右キャンバス */}
      {showUndirectedMatrix && (
        <div className="absolute top-10 right-10 bg-white border shadow-lg p-4 w-80 h-80 overflow-auto rounded-lg z-50">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded mb-2"
            onClick={() => setShowUndirectedMatrix(false)}
          >
            ×
          </button>
          <h2 className="text-lg font-bold mb-2 border-b pb-1">無向 A =</h2>
          <table className="table-auto border-collapse border border-gray-400 w-full text-sm">
            <tbody>
              {generateUndirectedAdjacencyMatrix().map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-2 py-1 text-center">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {showMatrix && (
        <div className="absolute top-1/3 right-10 bg-white border shadow-lg p-4 w-80 h-80 overflow-auto rounded-lg z-50">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded mb-2"
            onClick={() => setShowMatrix(false)}
          >
            ×
          </button>
          <h2 className="text-lg font-bold mb-2 border-b pb-1">有向 A =</h2>
          <table className="table-auto border-collapse border border-gray-400 w-full text-sm">
            <tbody>
              {generateAdjacencyMatrix().map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-2 py-1 text-center">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {showDistanceMatrix && (
        <div className="absolute top-2/3 right-10 bg-white border shadow-lg p-4 w-80 h-80 overflow-auto rounded-lg z-50">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded mb-2"
            onClick={() => setShowDistanceMatrix(false)}
          >
            ×
          </button>
          <h2 className="text-lg font-bold mb-2 border-b pb-1">G =</h2>
          <table className="table-auto border-collapse border border-gray-400 w-full text-sm">
            <tbody>
              {generateDistanceMatrix().map((row, i) => (
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
        </div>
      )}


      {showDegrees && (
        <div className="absolute top-2/3 right-2/8 bg-white border shadow-lg p-4 w-50 h-80 overflow-auto rounded-lg z-50">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded mb-2"
            onClick={() => setShowDegrees(false)}
          >
            ×
          </button>
          <h2 className="text-lg font-bold mb-2 border-b pb-1"></h2>
          <ul className="mt-2 space-y-1">
            {nodeDegrees.map(n => (
              <li key={n.id}>{n.label}: {n.degree} </li>
            ))}
          </ul>
        </div>
      )}


      {showDegreeDist && (
        <div className="absolute top-2/3 right-3/8 bg-white border shadow-lg p-4 w-50 h-80 overflow-auto rounded-lg z-50">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded mb-2"
            onClick={() => setShowDegreeDist(false)}
          >
            ×
          </button>
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
        </div>
      )}


      {showClustering && (
        <div className="absolute top-2/3 right-4/8 bg-white border shadow-lg p-4 w-80 h-80 overflow-auto rounded-lg z-50">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded mb-2"
            onClick={() => setShowClustering(false)}
          >
            ×
          </button>

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
        </div>
      )}

      {showAverageDistance && (
        <div className="absolute top-10 right-2/8 bg-white border shadow-lg p-4 w-80 rounded-lg z-50">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded mb-2"
            onClick={() => setShowAverageDistance(false)}
          >
            ×
          </button>

          <h2 className="text-xl font-bold mb-2">平均ノード間距離</h2>

          <div className="text-center text-2xl font-semibold text-indigo-600">
            {averageDistance !== null ? averageDistance.toFixed(3) : "-"}
          </div>

          <p className="text-gray-600 text-sm mt-2">
            グラフ内の全ペアの最短距離の平均値です。
          </p>
        </div>
      )}

      {showAvgNeighborDegree && (
        <div className="absolute top-1/4 right-2/8 bg-white border shadow-lg p-4 w-80 h-80 overflow-auto rounded-lg z-50">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded mb-2"
            onClick={() => setShowAvgNeighborDegree(false)}
          >
            ×
          </button>
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
        </div>
      )}


      <svg className="flex-1 border" onClick={handleCanvasClick}>
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill="black" />
          </marker>
        </defs>

        {edges.map((edge, i) => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;
          const nodeRadius = 20, shorten = nodeRadius + 2;
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
            <g key={node.id} onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id) }} onContextMenu={(e) => handleNodeRightClick(e, node.id)}>
              <circle cx={node.x} cy={node.y} r={20} fill={fillColor} stroke="black" strokeWidth={2} />
              <text x={node.x} y={node.y} textAnchor="middle" alignmentBaseline="middle" style={{ userSelect: "none", pointerEvents: "none" }}>{node.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  );
}
