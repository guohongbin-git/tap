### **修订记录 (Change Log)**

| 版本 (Version) | 日期 (Date) | 变更内容 (Change Description) | 作者 (Author) | 审批人 (Approved By) |
| :--- | :--- | :--- | :--- | :--- |
| 1.2 | 2025年8月15日 | 根据用户反馈，在接口定义中增加了关于“分区连通性”的说明。 | Gemini | (待审批) |
| 1.1 | 2025年8月15日 | 根据用户评审意见进行修订，增加了对“就地修改”的说明、为随机分区器增加了随机种子支持，并明确了其非平衡的特性。 | Gemini | (待审批) |
| 1.0 | 2025年8月15日 | 初版创建。 | Gemini | (待审批) |

---
**版本**: 1.2
**状态**: 草案

# **分区器接口及算法设计文档 (DDR_04)**

## 1. 概述 (Overview)

本文档旨在详细设计“算法核心层”（Algorithm Core）的基础组件。这包括：
1.  一个标准化的分区器抽象基类（`TerritoryPartitioner`），用于定义所有领土划分算法的统一接口。
2.  一个作为基准和测试桩的简单分区算法（`RandomPartitioner`）。

此设计是实现算法“即插即用”能力的核心。

## 2. 设计目标 (Design Goals)

*   **统一接口**: 所有分区算法都应遵循相同的方法签名，接收相同的输入，返回相同的输出。
*   **可扩展性**: 框架应能轻松地集成新的、更复杂的算法，而无需改动上游或下游的模块。
*   **状态无关**: 分区器本身应该是无状态的，其分区结果仅依赖于输入的图和配置。
*   **可配置**: 算法应能通过一个统一的配置对象进行参数化。

## 3. 核心逻辑与函数签名

### 3.1. 抽象基类 (Abstract Base Class)

我们将使用Python的`abc`模块来定义一个抽象基类。

```python
# file: src/tap/partitioner.py
from abc import ABC, abstractmethod
import networkx as nx
from ..common.schemas import PartitionerConfig # 需要在schemas.py中定义

class TerritoryPartitioner(ABC):
    """
    所有领土划分算法的抽象基类。
    """

    @abstractmethod
    def partition(
        self,
        graph: nx.Graph,
        config: PartitionerConfig
    ) -> nx.Graph:
        """
        对输入的图执行分区。

        重要: 
        1. 此方法预期对输入的图对象进行“就地修改”(in-place modification)，
           直接在节点上添加 'partition_id' 属性，并返回同一个图对象的引用。
        2. 具体的算法实现可以选择性地保证分区的“连通性”（Contiguity）。
           例如，某些算法可以保证同一分区内的所有节点在图上是连通的，从而避免“飞地”。
           调用者不应假设所有算法都能满足此特性，而应由评估层进行检查。

        Args:
            graph: 一个带权重的NetworkX图对象。
            config: 包含分区所需参数的配置对象。

        Returns:
            一个更新后的NetworkX图对象，其中每个节点都增加了一个'partition_id'属性。
        """
        pass
```

### 3.2. 配置定义

```python
# file: src/common/schemas.py (需要添加)
from dataclasses import dataclass, field
from typing import Any, Optional

@dataclass
class PartitionerConfig:
    """
    分区算法的通用配置基类。
    所有具体的算法配置都应继承自此类。
    """
    num_partitions: int # 目标分区数量

@dataclass
class RandomPartitionerConfig(PartitionerConfig):
    """
    RandomPartitioner的特定配置。
    """
    seed: Optional[int] = None # 用于复现结果的随机种子

# 未来可以添加
# @dataclass
# class MetisPartitionerConfig(PartitionerConfig):
#     contiguous: bool = True
#     ufactor: int = 2 # 不平衡因子
#     ...
```

### 3.3. `RandomPartitioner` 实现

这是一个用于快速验证流程的简单算法。
**注意**: 此算法不保证任何形式的分区平衡性（例如，各分区的节点数或总权重可能差异很大），其主要目的是作为流程验证和复杂算法的性能基准。

```python
# file: src/tap/algorithms/random_partitioner.py
import networkx as nx
import random
from ..partitioner import TerritoryPartitioner
from ..common.schemas import RandomPartitionerConfig

class RandomPartitioner(TerritoryPartitioner):
    """
    一个简单的分区器，将节点随机分配到指定数量的分区中。
    """

    def partition(
        self,
        graph: nx.Graph,
        config: RandomPartitionerConfig
    ) -> nx.Graph:
        """
        执行随机分区。

        Args:
            graph: 输入的图。
            config: 随机分区器的配置。

        Returns:
            带有'partition_id'节点属性的图。
        """
        if config.seed is not None:
            random.seed(config.seed)

        nodes = list(graph.nodes())
        num_partitions = config.num_partitions

        for node in nodes:
            partition_id = random.randint(0, num_partitions - 1)
            graph.nodes[node]['partition_id'] = partition_id

        return graph
```

## 4. 目录结构

为了清晰地组织算法，建议采用以下目录结构：
```
src/
└── tap/
    ├── __init__.py
    ├── partitioner.py  # ABC定义
    └── algorithms/
        ├── __init__.py
        ├── random_partitioner.py
        └── (未来) metis_partitioner.py
        └── (未来) skater_partitioner.py
```

## 5. 依赖库 (Dependencies)

*   `networkx`
