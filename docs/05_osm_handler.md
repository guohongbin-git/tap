### **修订记录 (Change Log)**

| 版本 (Version) | 日期 (Date) | 变更内容 (Change Description) | 作者 (Author) | 审批人 (Approved By) |
| :--- | :--- | :--- | :--- | :--- |
| 1.2 | 2025年8月15日 | 根据要求，将“从本地PBF文件导入”提升为当前版本的核心功能，并完成了相应的设计。 | Gemini | (待审批) |
| 1.1 | 2025年8月15日 | 根据QWEN AI建议，细化了缓存键生成策略、错误处理和配置化。 | Gemini | 郭宏斌 |
| 1.0 | 2025年8月15日 | 初版创建... | Gemini | 郭宏斌 |

---
**版本**: 1.2
**状态**: 草案
**作者**: Gemini

---

# **OSM管理模块设计文档 (DDR_05)**

## 1. 概述 (Overview)

本文档旨在详细设计“OSM管理模块”（OSM Handler）。该模块是“通用核心模块”的一部分，其核心职责是集中处理所有与OpenStreetMap（OSM）数据的交互，为系统的其他部分提供一个统一、高效、且带有缓存功能的OSM数据服务接口。

## 2. 核心功能与设计

**2.1. 缓存机制 (Caching)**
*   **API缓存**: ... (内容同v1.1) ...
*   **PBF缓存**: 对于从PBF文件的提取操作，缓存逻辑同样适用。缓存键将由**PBF文件的路径、修改时间、以及提取参数的哈希**共同生成，以确保源文件或提取参数变化时缓存能自动失效。缓存的格式推荐使用`Feather`或`Parquet`以提升I/O效率。

**2.2. 错误处理 (Error Handling)**
*   所有对外部API的调用都将被包裹在一个`try...except`块中。
*   ...

**2.3. 配置化 (Configuration)**
*   缓存目录的路径 (`data/cache/osm/`) 将作为可配置项...

**2.4. 核心函数签名**

```python
# file: src/common/osm_handler.py
import geopandas as gpd
import networkx as nx
from shapely.geometry import Polygon
from typing import Optional

def get_boundary_from_api(
    query: str,
    tags: dict = {"admin_level": "2"}
) -> gpd.GeoDataFrame:
    """
    根据查询名称和标签，从OSM API获取行政边界。
    内置缓存逻辑。
    """
    pass

def get_road_network_from_api(
    polygon: Polygon,
    network_type: str = "drive"
) -> nx.MultiDiGraph:
    """
    获取指定多边形区域内的路网图。
    内置缓存逻辑。
    """
    pass

def extract_from_pbf(
    pbf_path: str,
    feature_type: str, # e.g., "boundaries", "roads", "pois"
    tags: Optional[dict] = None
) -> gpd.GeoDataFrame:
    """
    从本地.pbf文件中提取指定类型的地理要素。
    内置缓存逻辑。
    """
    pass
```

## 3. 依赖库 (Dependencies)

*   `osmnx`: 用于从API获取OSM数据。
*   `pyrosm`: 用于从本地`.pbf`文件解析数据。
*   `geopandas`: 用于处理地理数据。
