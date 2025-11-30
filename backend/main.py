from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ノードとエッジ
class Node(BaseModel):
    id: int
    x: float
    y: float
    label: str

class Edge(BaseModel):
    from_: int = Field(alias="from")
    to: int
    weight: Optional[float] = None
    class Config:
        allow_population_by_field_name = True

# グラフデータ
class GraphData(BaseModel):
    user_id: str
    nodes: List[Node]
    edges: List[Edge]
    weightedMode: bool
    class Config:
        allow_population_by_field_name = True

# 仮データベース
database = {}

@app.post("/api/save")
def save_graph(data: GraphData):
    stored = data.dict(by_alias=True)
    print("SAVE RECEIVED:", data)   #log表示
    stored = data.dict()
    print("STORED DICT:", stored)
    graph_id = str(uuid.uuid4())   # 一意のIDを生成
    database[graph_id] = data.dict()
    return {"message": "Saved", "graph_id": graph_id}

@app.get("/api/load/{graph_id}")
def load_graph(graph_id: str):
    if graph_id not in database:
        return {"error": "Not found"}
    return database[graph_id]
