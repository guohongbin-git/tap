### **修订记录 (Change Log)**

| 版本 (Version) | 日期 (Date) | 变更内容 (Change Description) | 作者 (Author) | 审批人 (Approved By) |
| :--- | :--- | :--- | :--- | :--- |
| 1.2 | 2025年8月15日 | v1.1版本已由郭宏斌评审通过。更新审批状态。 | Gemini | (待审批) |
| 1.1 | 2025年8月15日 | 根据QWEN AI建议，细化了函数返回值的结构，并增加了“模块扩展性与未来规划”章节。 | Gemini | 郭宏斌 |
| 1.0 | 2025年8月15日 | 初版创建，定义了模块的核心职责和初始功能：雷普利K函数分析。 | Gemini | 郭宏斌 |

---
**版本**: 1.2
**状态**: 已批准 (Approved)

---

### **1. 概述 (Overview)**
本文档旨在设计“空间统计分析”（Spatial Statistics）模块。这是一个通用的、服务性的模块，负责提供所有高级的空间统计与分析功能，以支持其他模块（如数据生成、数据评估）进行更深度的分析。

### **2. 模块架构定位 (Module's Position in Architecture)**
本模块是一个独立的、横向的服务模块，它可以被系统的多个其他组件调用，为其提供空间分析能力。

### **3. 初始功能设计：雷普利K函数 (Initial Feature: Ripley's K-function)**

**3.1. 功能目标**
提供一个函数，能够接收一个地理点数据集，并分析其空间分布模式（聚集、随机或离散）。

**3.2. 函数签名**
```python
# file: src/spatial_stats/point_pattern_analysis.py
import geopandas as gpd
from typing import Dict, Any, List

def analyze_k_function(
    points_gdf: gpd.GeoDataFrame,
    area: float,
    steps: int = 10
) -> Dict[str, Any]:
    """
    对输入的点数据进行Ripley's K函数分析。

    Args:
        points_gdf: 包含点数据的GeoDataFrame。
        area: 研究区域的总面积。
        steps: K函数计算中，距离半径的步长数量。

    Returns:
        一个包含分析结果的字典，结构如下:
        {
            "r": List[float],  # K函数计算所用的距离半径列表
            "k_values": List[float],  # 观测到的K值列表
            "k_expected": List[float], # CSR模式下期望的K值列表 (理论上是 pi * r^2)
            "confidence_envelope": List[Tuple[float, float]], # 置信区间的上下限列表
            "pattern": str # 对整体模式的判断 (e.g., "Clustered", "Random", "Dispersed")
        }
    """
    pass
```

**3.3. 依赖库**
*   `pysal` (及其子模块 `pointpats`)
*   `geopandas`

### **4. 模块扩展性与未来规划 (Module Extensibility & Future Roadmap)**

本模块被设计为一个可扩展的空间统计工具库。所有函数都应是独立的、功能内聚的。

**4.1. 配置机制**
当前版本仅包含一个核心功能，暂不需要复杂的配置。未来当模块内功能增多时，将引入配置类（Schema）来管理不同分析函数的参数。

**4.2. 未来功能规划**
为增强本工具箱的分析能力，后续版本可考虑集成以下空间统计方法：
*   **G函数 / F函数**: 用于更细致地分析点间距离的分布。
*   **莫兰指数 (Moran's I)**: 用于衡量空间自相关性，判断高值或低值是否在空间上聚集。
*   **核密度估计 (Kernel Density Estimation)**: 用于创建平滑的热力图，更直观地展示空间密度。
