### **修订记录 (Change Log)**

| 版本 (Version) | 日期 (Date) | 变更内容 (Change Description) | 作者 (Author) | 审批人 (Approved By) |
| :--- | :--- | :--- | :--- | :--- |
| 1.1 | 2025年8月15日 | 根据用户评审意见进行修订，增加了性能目标、输入数据结构定义、权重计算策略、错误处理和图连通性说明。 | Gemini | (待审批) |
| 1.0 | 2025年8月15日 | 初版创建。 | Gemini | (待审批) |

---
**版本**: 1.1
**状态**: 草案

# **图构建器设计文档 (DDR_03)**

## 1. 概述 (Overview)

本文档旨在详细设计“图构建器”（Graph Builder）模块。该模块是**“数据接入与建模层”**和**“算法核心层”**之间的关键桥梁。其核心职责是将上游传入的、基于表格的地理空间数据（如基础地理单元、客户点位）转换为一个标准化的、带权重的图（Graph）对象，供下游的领土划分算法使用。

## 2. 设计目标 (Design Goals)

*   **标准化**: 输出的图对象应具有统一、明确的结构，方便所有算法模块调用。
*   **灵活性**: 应支持多种方式构建图的邻接关系（Contiguity）和权重（Weight）。
*   **可配置**: 图的构建过程应能通过配置文件进行调整，例如选择不同的邻接定义或权重计算方法。
*   **解耦**: 将图的构建逻辑与数据源和算法完全分离。
*   **性能**: 在处理大规模地理单元（例如，超过10,000个）时，图的构建过程应具备较高的效率。

## 3. 输入与输出 (Inputs & Outputs)

### 3.1. 输入数据结构

本模块接收两个核心的GeoDataFrame：

1.  **`base_units_gdf`**: 基础地理单元
    | 列名 (Column) | 数据类型 (Type) | 描述 (Description) |
    | :--- | :--- | :--- |
    | `unit_id` | `int` | 基础单元的唯一标识 |
    | `geometry` | `shapely.Polygon` | 该单元的地理边界 |

2.  **`customers_gdf`**: 客户点数据
    | 列名 (Column) | 数据类型 (Type) | 描述 (Description) |
    | :--- | :--- | :--- |
    | `customer_id` | `int` | 客户的唯一标识 |
    | `geometry` | `shapely.Point` | 客户的地理位置 |
    | `unit_id` | `int` | 该客户所属的基础单元ID |
    | `sales_potential`| `float` | 模拟的销售潜力 |
    | `workload` | `float` | 模拟的工作量 |

### 3.2. 输出数据结构

*   **`G` (nx.Graph)**: 一个`networkx`图对象。
    *   **节点 (Nodes)**: 每个节点代表一个`unit_id`。
    *   **节点属性 (Node Attributes)**:
        *   `geometry`: 原始的Shapely Polygon几何。
        *   `customers`: 该单元内的客户点数量 (integer)。
        *   `total_sales_potential`: 该单元内客户的销售潜力总和 (float)。
        *   `total_workload`: 该单元内客户的工作量总和 (float)。
    *   **边 (Edges)**: 连接相邻的地理单元。
    *   **边属性 (Edge Attributes)**:
        *   `weight`: 边的权重，可以代表邻接强度或距离 (float)。

### 3.3. 关于图连通性的说明

部分分区算法（如 `Metis`）要求输入的图是完全连通的。本模块的一个可选后处理步骤是检查图的连通性。如果图包含多个连通分量，应记录一条警告日志。将非连通的图传递给算法可能会导致错误或非预期的结果，具体的处理策略由算法本身或调度中心决定。

## 4. 核心逻辑与函数签名

### 4.1. 配置定义

```python
# file: src/common/schemas.py (需要添加)
from dataclasses import dataclass
from enum import Enum

class ContiguityMethod(Enum):
    ROOK = "rook"  # 共享边
    QUEEN = "queen" # 共享边或点

class WeightingMethod(Enum):
    UNIFORM = "uniform" # 所有边权重为1.0
    # SHARED_BORDER_LENGTH = "shared_border_length" # (未来实现) 基于共享边界长度
    # DISTANCE = "distance" # (未来实现) 基于质心距离

@dataclass
class GraphBuilderConfig:
    contiguity_method: ContiguityMethod = ContiguityMethod.QUEEN
    weighting_method: WeightingMethod = WeightingMethod.UNIFORM
```

### 4.2. 函数签名

```python
# file: src/tap/graph_builder.py
import geopandas as gpd
import networkx as nx
from .common.schemas import GraphBuilderConfig

def build_graph(
    base_units_gdf: gpd.GeoDataFrame,
    customers_gdf: gpd.GeoDataFrame,
    config: GraphBuilderConfig
) -> nx.Graph:
    """
    根据地理单元和客户数据构建一个用于领土划分的图。

    Args:
        base_units_gdf: 基础地理单元的GeoDataFrame。
        customers_gdf: 客户点的GeoDataFrame。
        config: 图构建的配置对象。

    Returns:
        一个NetworkX图对象。
    """
    pass
```

### 4.3. 实现步骤 (伪代码)

```python
def build_graph(...):
    # 1. 数据校验 (Validation)
    #    - 检查输入的GDF是否符合预期的Schema。
    #    - 检查 customers_gdf 中的 unit_id 是否都存在于 base_units_gdf 中。若否则记录警告或抛出错误。

    # 2. 聚合客户数据到基础单元
    #    - 按 'unit_id' 对 customers_gdf 进行分组 (groupby)。
    #    - 计算每个 unit_id 的客户数、销售潜力和工作量总和。
    #    - 将聚合后的数据合并 (merge) 到 base_units_gdf 中。

    # 3. 创建图对象并添加节点
    #    - G = nx.Graph()
    #    - 遍历合并后的 base_units_gdf 的每一行。
    #    - G.add_node(row.unit_id, **row.to_dict())

    # 4. 计算并添加边
    #    - 使用 libpysal.weights.Contiguity.from_dataframe 计算邻接关系。
    #    - 遍历邻接关系 (w.neighbors)。
    #    - 对于每一对相邻的节点 (u, v)，计算其权重。
    #      - if config.weighting_method == UNIFORM: weight = 1.0
    #      - # (未来) else if config.weighting_method == SHARED_BORDER_LENGTH: ...
    #    - G.add_edge(u, v, weight=weight)

    # 5. (可选) 检查连通性
    #    - if not nx.is_connected(G):
    #      - log.warning("构建的图不是完全连通的。")

    # 6. 返回图对象
    return G
```

### 4.4. 错误处理与验证

*   **输入验证**: `build_graph` 函数在执行开始时，必须对输入的 `base_units_gdf` 和 `customers_gdf` 进行严格的模式验证。
*   **ID匹配**: 必须验证 `customers_gdf` 中的所有 `unit_id` 均可在 `base_units_gdf` 中找到。对于无法匹配的客户记录，应记录警告日志并将其从后续计算中排除。
*   **空值处理**: 聚合后的节点属性（如`total_sales_potential`）应确保没有`NaN`值，对于没有客户的单元，应填充为0。

## 5. 依赖库 (Dependencies)

*   `networkx`
*   `geopandas`
*   `libpysal`: 此库已作为核心依赖包含在 `requirements.txt` 文件中。
