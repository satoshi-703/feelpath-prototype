"use client";
import { useState } from "react";

import DegreeCardSlider from "../components/ui/DegreeCardSlider";
import HelpModal from "../components/ui/HelpModal";
import InfoPanels from "../components/InfoPanels";
import GraphCanvas from "../components/GraphCanvas";
import {
  GraphNode,
  GraphEdge,
  findShortestPath,
  findLongestPath,
  calcMaxDegreeNodes as calcMaxDegreeNodesPure,
  calculateDegrees,
  calculateDegreeDistribution,
  computeClusteringCoefficients as computeClusteringCoefficientsPure,
  averageShortestPathFromMatrix,
  averageNeighborDegree,
} from "../lib/graph";

export default function Home() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
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
  // averageDegree, setAverageDegreeは未使用のため削除
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

  {/*ノードクリック処理*/ }
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

  {/*ノード右クリック処理（削除）*/ }
  const handleNodeRightClick = (e: React.MouseEvent, nodeId: number) => {
    e.preventDefault();
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.from !== nodeId && e.to !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
    if (startNodeId === nodeId) setStartNodeId(null);
    if (goalNodeId === nodeId) setGoalNodeId(null);
  };

  {/*ノードのドラッグ移動処理*/ }
  const handleNodeDrag = (nodeId: number, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x, y } : n));
  };


  {/*入次数/出次数最大ノードを計算*/ }
  const calcMaxDegreeNodes = () => {
    const { maxInNodeId, maxOutNodeId } = calcMaxDegreeNodesPure(nodes, edges);
    setMaxInNodeId(maxInNodeId);
    setMaxOutNodeId(maxOutNodeId);
  };

  {/*全ノードのクラスタ係数と平均値を計算*/ }
  const computeClusteringCoefficients = () => {
    const { coefficients, average } = computeClusteringCoefficientsPure(nodes, edges);
    setClusteringCoefficients(coefficients);
    setAverageClustering(average);
    setShowClustering(true);
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans relative overflow-hidden">
      {/* ハンバーガーメニュー（モバイルのみ） */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white hover:bg-gray-100 text-gray-800 p-2 rounded shadow-lg transition-all duration-300"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="メニューを開閉"
      >
        ☰
      </button>

      {/* ヘルプボタン 右上 */}
      <button
        className="fixed top-4 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-lg transition-all duration-300"
        onClick={() => setHelpOpen(true)}
      >
        ヘルプ
      </button>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* モバイルでメニューを開いたときの背景オーバーレイ */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 左メニュー：モバイルは左からスライドするドロワー、md以上は常時表示のサイドバー */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-4/5 max-w-xs md:max-w-none md:w-1/4 h-full md:h-auto
          bg-gray-100 p-4 pt-16 md:pt-4 space-y-6 overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
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
                  setNodeIdCounter(0);
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
                else { setShortestPath(findShortestPath(nodes, edges, startNodeId, goalNodeId)); setShortestPathVisible(true); }
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
                else { setLongestPath(findLongestPath(nodes, edges, startNodeId, goalNodeId)); setLongestPathVisible(true); }
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
                          setNodeDegrees(calculateDegrees(nodes, edges));
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
                          setDegreeDist(calculateDegreeDistribution(nodes, edges));
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
                          setAverageDistance(averageShortestPathFromMatrix(nodes, edges, weightedMode));
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
                            avgNeighborDegree: averageNeighborDegree(n.id, nodes, edges)
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
            ]}
          /></div>



        {/* 保存/読み込みカード */}
        <div className="bg-white rounded-xl p-5 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 animate-fade-in">保存 / 読み込み</h2>
          <div className="flex gap-2 mb-2">
            <button
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg shadow transition-all duration-300 hover:scale-105"
              onClick={() => {
                // graphIdが未設定なら新規IDを生成
                let id = graphId;
                if (!id) {
                  id = crypto.randomUUID();
                  setGraphId(id);
                }
                const data = { nodes, edges, weightedMode, user_id: "user1" };
                localStorage.setItem("graph-" + id, JSON.stringify(data));
                alert("保存完了! ID:" + id);
              }}
            >保存</button>
            <button
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg shadow transition-all duration-300 hover:scale-105"
              onClick={() => {
                if (!graphId) return alert("Graph ID を入力してください");
                const raw = localStorage.getItem("graph-" + graphId);
                if (!raw) return alert("データが見つかりません");
                try {
                  const data = JSON.parse(raw);
                  // バグ。from__ が来たらそれを使うしなければ from を使う
                  const fixedEdges = data.edges.map((e: any) => ({ from: e.from_ ?? e.from, to: e.to, weight: e.weight }));
                  setNodes(data.nodes); setEdges(fixedEdges); setWeightedMode(data.weightedMode);
                  alert("読み込み完了!");
                } catch {
                  alert("データの読み込みに失敗しました");
                }
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


      <InfoPanels
        nodes={nodes}
        edges={edges}
        weightedMode={weightedMode}
        showUndirectedMatrix={showUndirectedMatrix}
        onCloseUndirectedMatrix={() => setShowUndirectedMatrix(false)}
        showMatrix={showMatrix}
        onCloseMatrix={() => setShowMatrix(false)}
        showDistanceMatrix={showDistanceMatrix}
        onCloseDistanceMatrix={() => setShowDistanceMatrix(false)}
        showDegrees={showDegrees}
        onCloseDegrees={() => setShowDegrees(false)}
        nodeDegrees={nodeDegrees}
        showDegreeDist={showDegreeDist}
        onCloseDegreeDist={() => setShowDegreeDist(false)}
        degreeDist={degreeDist}
        showClustering={showClustering}
        onCloseClustering={() => setShowClustering(false)}
        clusteringCoefficients={clusteringCoefficients}
        averageClustering={averageClustering}
        showAverageDistance={showAverageDistance}
        onCloseAverageDistance={() => setShowAverageDistance(false)}
        averageDistance={averageDistance}
        showAvgNeighborDegree={showAvgNeighborDegree}
        onCloseAvgNeighborDegree={() => setShowAvgNeighborDegree(false)}
        avgNeighborDegreeList={avgNeighborDegreeList}
      />

      <GraphCanvas
        nodes={nodes}
        edges={edges}
        weightedMode={weightedMode}
        selectedNode={selectedNode}
        startNodeId={startNodeId}
        goalNodeId={goalNodeId}
        shortestPath={shortestPath}
        shortestPathVisible={shortestPathVisible}
        longestPath={longestPath}
        longestPathVisible={longestPathVisible}
        showMaxIn={showMaxIn}
        maxInNodeId={maxInNodeId}
        showMaxOut={showMaxOut}
        maxOutNodeId={maxOutNodeId}
        onCanvasClick={handleCanvasClick}
        onNodeClick={handleNodeClick}
        onNodeRightClick={handleNodeRightClick}
        onNodeDrag={handleNodeDrag}
      />
    </div>
  );
}
