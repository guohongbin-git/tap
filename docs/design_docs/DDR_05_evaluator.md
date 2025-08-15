### **修订记录 (Change Log)**

| 版本 (Version) | 日期 (Date) | 变更内容 (Change Description) | 作者 (Author) | 审批人 (Approved By) |
| :--- | :--- | :--- | :--- | :--- |
| 1.1 | 2025年8月15日 | 根据用户评审意见进行修订，细化了报告结构、函数签名和伪代码实现，增加了更多设计细节和说明。 | Gemini | (待审批) |
| 1.0 | 2025年8月15日 | 初版创建，包含了对平衡性、紧凑性和连通性（飞地检测）的评估设计。 | Gemini | (待审批) |

---
**版本**: 1.1
**状态**: 草案

# **评估模块设计文档 (DDR_05)**

## 1. 概述 (Overview)

本文档旨在详细设计“分析评估层”（Analysis & Evaluation）的核心组件——评估模块。该模块负责对分区算法生成的方案进行多维度的、量化的评估。其输出的评估报告是衡量不同算法优劣、以及为LLM提供分析素材的关键依据。

## 2. 设计目标 (Design Goals)

*   **综合性**: 提供一套覆盖“平衡性”、“紧凑性”和“连通性”等核心维度的评估指标。
*   **标准化**: 输出的评估报告应为标准化的数据结构，便于程序解析和人类阅读。
*   **可扩展性**: 可以方便地增加新的评估指标。
*   **解耦**: 评估逻辑应与分区算法完全分离，仅依赖于分区后的图对象。

## 3. 核心逻辑与函数签名

### 3.1. 输入与输出

*   **输入**:
    *   `graph` (nx.Graph): 一个已完成分区的`networkx`图对象。每个节点必须包含 `partition_id` 属性，以及权重信息（如 `total_sales_potential`, `customers` 等）。

*   **输出**:
    *   `evaluation_report` (Dict[str, Any]): 一个包含多维度评估结果的字典。

### 3.2. 评估报告结构 (示例)

```json
{
  "summary": {
    "num_partitions": 10,
    "total_nodes": 500,
    "evaluation_duration_seconds": 1.25,
    "enclaves_detected": 3,
    "disconnected_partitions": ["A", "C"]
  },
  "balance_metrics": {
    "total_sales_potential": {
      "min": 5000.0,
      "max": 8500.0,
      "mean": 6750.0,
      "std_dev": 1200.0,
      "imbalance_ratio": 1.26 // (计算方式: max / mean)
    },
    "customers": { ... }
  },
  "compactness_metrics": {
    "polsby_popper": {
      "mean": 0.45,
      "values_per_partition": {
        "A": 0.52,
        "B": 0.38,
        ...
      }
    }
  },
  "contiguity_metrics": {
    "disconnected_partitions": {
        "A": { "num_subgraphs": 2 },
        "C": { "num_subgraphs": 3 }
    },
    "enclaves": [
      {
        "node_id": 123,
        "original_partition": "A",
        "surrounded_by": "B"
      },
      ...
    ]
  }
}
```

### 3.3. 函数签名

```python
# file: src/tap/evaluator.py
import networkx as nx
from typing import Dict, Any, List, Optional

def evaluate_partitions(
    graph: nx.Graph,
    metrics_to_include: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    对已分区的图进行全面的评估。

    Args:
        graph: 已完成分区的NetworkX图对象。
        metrics_to_include: 一个可选的指标列表 (e.g., ["balance", "compactness"])。
                            如果为None，则计算所有可用指标。

    Returns:
        一个包含详细评估指标的字典。
    """
    pass
```

### 3.4. 实现步骤 (伪代码)

```python
def evaluate_partitions(graph: nx.Graph, ...):
    # 记录开始时间
    start_time = time.time()
    report = {}

    # 1. 计算平衡性 (Balance)
    #    - 按 'partition_id' 对节点进行分组。
    #    - 对每个分区，计算其 'total_sales_potential', 'total_workload', 'customers' 等关键属性的总和。
    #    - 计算各分区总和值的 min, max, mean, std_dev, (max/mean) 等统计数据。
    #    - report['balance_metrics'] = ...

    # 2. 计算紧凑性 (Compactness)
    #    - 注意: 对于大规模或复杂的多边形，此步骤（尤其是unary_union）计算成本可能较高。
    #    - 对于每个分区:
    #      - a. 合并分区内所有节点的 'geometry' 形成一个大的多边形 (unary_union)。
    #         (注意: 对于有孔或非凸的多边形，需要shapely库正确处理其area和perimeter属性)。
    #      - b. 计算该多边形的 Polsby-Poper 分数: (4 * pi * area) / (perimeter^2)。
    #    - 计算所有分区紧凑性分数的均值。
    #    - report['compactness_metrics'] = ...

    # 3. 检查连通性 (Contiguity) - 飞地/孤点检测
    #    - report['contiguity_metrics'] = ...
    #    - 对于每个分区 (partition_id):
    #      - a. 提取该分区所有节点，构成一个子图 (subgraph)。
    #      - b. 检查该子图是否连通 (nx.is_connected)。
    #      - c. 如果不连通，记录该分区ID及其包含的独立子图数量。
    #      - d. (进阶-飞地检测) 对于每个节点，检查其所有邻居节点的 'partition_id'。
    #         如果一个节点的所有邻居都属于同一个、但不同于其自身的分区，则该节点可被识别为一个飞地。

    # 4. 生成总结 (Summary)
    #    - report['summary'] = ...
    #    - report['summary']['evaluation_duration_seconds'] = time.time() - start_time

    return report
```

## 4. 依赖库 (Dependencies)

*   `networkx`
*   `geopandas` / `shapely` (用于计算紧凑性)
*   `numpy`
