export type GraphNode = { id: number; x: number; y: number; label: string };
export type GraphEdge = { from: number; to: number; weight: number };

function buildIdToIndex(nodes: GraphNode[]): Record<number, number> {
  const idToIndex: Record<number, number> = {};
  nodes.forEach((node, idx) => { idToIndex[node.id] = idx; });
  return idToIndex;
}

/* 最短経路探索（ダイクストラ法） */
export function findShortestPath(nodes: GraphNode[], edges: GraphEdge[], startId: number, goalId: number): number[] {
  const dist: Record<number, number> = {};
  const prev: Record<number, number | null> = {};
  const unvisited = new Set(nodes.map(n => n.id));
  nodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; });
  dist[startId] = 0;

  while (unvisited.size > 0) {
    const current = [...unvisited].reduce((a, b) => (dist[a] < dist[b] ? a : b));
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

/* 最長経路探索（DFSを利用） */
export function findLongestPath(nodes: GraphNode[], edges: GraphEdge[], startId: number, goalId: number): number[] {
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

export function calcMaxDegreeNodes(nodes: GraphNode[], edges: GraphEdge[]): { maxInNodeId: number | null; maxOutNodeId: number | null } {
  const inDegree: Record<number, number> = {};
  const outDegree: Record<number, number> = {};
  nodes.forEach(n => { inDegree[n.id] = 0; outDegree[n.id] = 0; });
  edges.forEach(e => { outDegree[e.from]++; inDegree[e.to]++; });

  const maxIn = Math.max(...Object.values(inDegree));
  const maxOut = Math.max(...Object.values(outDegree));

  const maxInNodeId = nodes.find(n => inDegree[n.id] === maxIn)?.id ?? null;
  const maxOutNodeId = nodes.find(n => outDegree[n.id] === maxOut)?.id ?? null;

  return { maxInNodeId, maxOutNodeId };
}

/* 隣接行列生成 */
export function generateAdjacencyMatrix(nodes: GraphNode[], edges: GraphEdge[], weightedMode: boolean): number[][] {
  const n = nodes.length;
  const idToIndex = buildIdToIndex(nodes);
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  edges.forEach(edge => {
    const fromIdx = idToIndex[edge.from];
    const toIdx = idToIndex[edge.to];
    matrix[fromIdx][toIdx] = weightedMode ? edge.weight : 1;
  });

  return matrix;
}

/* 距離行列生成（ワーシャルフロイド法） */
export function generateDistanceMatrix(nodes: GraphNode[], edges: GraphEdge[], weightedMode: boolean): number[][] {
  const n = nodes.length;
  const idToIndex = buildIdToIndex(nodes);

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

/* 無向隣接行列生成 */
export function generateUndirectedAdjacencyMatrix(nodes: GraphNode[], edges: GraphEdge[]): number[][] {
  const n = nodes.length;
  const idToIndex = buildIdToIndex(nodes);
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  edges.forEach(edge => {
    const fromIdx = idToIndex[edge.from];
    const toIdx = idToIndex[edge.to];
    matrix[fromIdx][toIdx] = 1;
    matrix[toIdx][fromIdx] = 1; // 無向グラフなので逆も1
  });

  return matrix;
}

/* 各ノードの次数を計算 */
export function calculateDegrees(nodes: GraphNode[], edges: GraphEdge[]): { id: number; label: string; degree: number }[] {
  const matrix = generateUndirectedAdjacencyMatrix(nodes, edges);
  return matrix.map((row, idx) => ({
    id: nodes[idx].id,
    label: nodes[idx].label,
    degree: row.reduce((a, b) => a + b, 0),
  }));
}

/* 次数分布を計算 */
export function calculateDegreeDistribution(nodes: GraphNode[], edges: GraphEdge[]): Record<number, number> {
  const degrees = calculateDegrees(nodes, edges);
  const counts: Record<number, number> = {};

  degrees.forEach(d => {
    const k = d.degree;
    if (!(k in counts)) counts[k] = 0;
    counts[k] += 1;
  });

  return counts;
}

/* ノードの隣接ノードを取得（無向グラフ扱い） */
export function getNeighbors(nodeId: number, edges: GraphEdge[]): number[] {
  const neighbors = new Set<number>();
  edges.forEach(e => {
    if (e.from === nodeId) neighbors.add(e.to);
    if (e.to === nodeId) neighbors.add(e.from);
  });
  return Array.from(neighbors);
}

/* 隣接ノード同士でつながっている数を数える */
function countNeighborConnections(neighbors: number[], edges: GraphEdge[]): number {
  let count = 0;
  const set = new Set(neighbors);
  edges.forEach(e => {
    if (set.has(e.from) && set.has(e.to)) count++;
  });
  return count;
}

/* クラスタ係数（あるノード） */
export function clusteringCoefficient(nodeId: number, edges: GraphEdge[]): number {
  const neighbors = getNeighbors(nodeId, edges);
  const k = neighbors.length;

  if (k < 2) return 0;

  const E = countNeighborConnections(neighbors, edges);
  return E / (k * (k - 1));
}

/* 全ノードのクラスタ係数と平均値を計算 */
export function computeClusteringCoefficients(nodes: GraphNode[], edges: GraphEdge[]): { coefficients: Record<number, number>; average: number } {
  const coefficients: Record<number, number> = {};
  nodes.forEach(node => {
    coefficients[node.id] = clusteringCoefficient(node.id, edges);
  });

  const values = Object.values(coefficients);
  const average = values.reduce((a, b) => a + b, 0) / values.length;

  return { coefficients, average };
}

/* 距離行列から平均ノード間距離を計算 */
export function averageShortestPathFromMatrix(nodes: GraphNode[], edges: GraphEdge[], weightedMode: boolean): number {
  const dist = generateDistanceMatrix(nodes, edges, weightedMode);
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

/* ノードの次数を取得 */
export function getDegree(nodeId: number, nodes: GraphNode[], edges: GraphEdge[]): number {
  const matrix = generateUndirectedAdjacencyMatrix(nodes, edges);
  const idToIndex = buildIdToIndex(nodes);

  const idx = idToIndex[nodeId];
  if (idx === undefined) return 0;

  return matrix[idx].reduce((a, b) => a + b, 0);
}

/* 平均近傍次数を計算 */
export function averageNeighborDegree(nodeId: number, nodes: GraphNode[], edges: GraphEdge[]): number {
  const neighbors = getNeighbors(nodeId, edges);
  const k = neighbors.length;

  if (k === 0) return 0;

  let total = 0;
  neighbors.forEach(nid => {
    total += getDegree(nid, nodes, edges);
  });

  return total / k;
}
