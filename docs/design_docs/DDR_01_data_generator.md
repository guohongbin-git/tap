### **修订记录 (Change Log)**

| 版本 (Version) | 日期 (Date) | 变更内容 (Change Description) | 作者 (Author) | 审批人 (Approved By) |
| :--- | :--- | :--- | :--- | :--- |
| 2.0 | 2025年8月15日 | 根据QWEN AI建议，大幅细化了核心逻辑实现步骤，并增加了完整的YAML配置文件示例。 | Gemini | 郭宏斌 |
| 1.9 | 2025年8月15日 | **[修正]** 修复了因操作失误导致文档正文内容丢失的问题，从历史记录中恢复v1.8的完整内容。 | Gemini | 郭宏斌 |
| 1.8 | 2025年8月15日 | 根据Mermaid最佳实践，重构了架构图代码... | Gemini | 郭宏斌 |
| 1.7 | 2025年8月15日 | 填充了v1.3版本中占位的“LLM集成与智能分析”章节的完整内容。 | Gemini | 郭宏斌 |
| 1.6 | 2025年8月15日 | 修正了“模块架构定位”图表的Mermaid语法错误，并优化了其逻辑表达的准确性。 | Gemini | 郭宏斌 |
| 1.5 | 2025年8月15日 | 明确验证功能将由独立的`spatial_stats`模块提供，而非内置。 | Gemini | 郭宏斌 |
| 1.4 | 2025年8月15日 | 引入空间点过程的数学模型，更新配置以支持多种分布模式。 | Gemini | 郭宏斌 |
| 1.3 | 2025年8月15日 | 新增“LLM集成与智能分析”章节，定义了系统内置LLM的分析任务。 | Gemini | 郭宏斌 |
| 1.2 | 2025年8月15日 | 新增“从现有数据抽样”功能。 | Gemini | 郭宏斌 |
| 1.1 | 2025年8月15日 | 增加“模块架构定位”章节及图表。 | Gemini | 郭宏斌 |
| 1.0 | 2025年8月15日 | 初版创建。 | Gemini | 郭宏斌 |

---

**版本**: 2.0
**状态**: 已批准 (Approved)

---

### **1. 概述 (Overview)**
本文档旨在详细设计“地理数据生成器”（Synthetic Data Generator）模块。该模块是TAP工具箱的起点，负责程序化地生成结构化的、具有真实世界特征的地理业务数据，为后续所有算法的开发、测试和评估提供数据支持。

### **2. 模块架构定位 (Module's Position in Architecture)**
本模块是**“数据接入与建模层”**的核心组件之一。其运行由顶层的**“自动化调度与日志中心”**根据实验配置进行触发。其在系统中的位置如下图所示：
```mermaid
graph TD
    subgraph "TAP Toolbox (v3.0)"
        %% 1. 节点定义 (Node Definitions)
        A[自动化调度与日志中心]
        B1[真实数据加载器]
        B2(地理数据生成器<br/><b>[THIS MODULE]</b>)
        B_OUT[图构建器]
        C[标准化的图数据结构]
        D[算法核心层]
        E[分析评估层]
        F[可视化与交互层]
        G[空间统计分析模块]

        %% 2. 子图分组 (Subgraph Grouping)
        subgraph "数据接入与建模层"
            B1
            B2
            B_OUT
        end

        %% 3. 关系连接 (Connections)
        A -- 触发 --> B2
        A -- 触发 --> D
        B1 --> B_OUT
        B2 --> B_OUT
        B_OUT --> C
        C --> D
        D --> E
        E --> F
        B2 -- 调用 --> G
        E -- 调用 --> G
    end

    %% 4. 样式定义 (Styling)
    style B2 fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#cde,stroke:#333,stroke-width:2px
```

### **3. LLM集成与智能分析 (LLM Integration & Intelligent Analysis)**
为实现项目“自我解释、自我分析”的目标，系统将深度集成一个多模态大语言模型。该LLM不仅用于解释最终结果，更将在设计的各个阶段介入，提供智能分析。

**3.1. 触发机制**
当用户通过系统界面提出一项设计变更（例如，为本模块增加新功能），或提交一份新的实验运行配置时，将触发LLM的智能分析流程。

**3.2. LLM分析任务**
在正式执行或接受变更前，系统会自动执行以下操作：
1.  **上下文汇集**：系统将自动收集相关上下文，包括：
    *   用户的变更请求文本。
    *   当前模块的设计文档（如本文件）。
    *   相关的系统架构图。
2.  **调用LLM分析**：系统将以上下文作为输入，调用内置的LLM，并指令其针对本次变更，生成一份结构化的**“影响评估报告”**。该报告必须包含以下分析要点：
    *   **对模块配置的影响**：分析变更是否需要修改现有的配置数据结构。
    *   **对核心逻辑的影响**：分析变更需要修改哪些核心函数或算法流程。
    *   **对系统能力的增强**：阐述该变更为整个工具箱带来的新价值或新能力。
    *   **对下游模块的影响**：评估变更是否会影响其他模块，并判断其是否被良好地封装。
3.  **报告呈现**：LLM生成的“影响评估报告”将被格式化后，呈现给用户，作为其决策的重要参考。

此机制将贯穿于整个工具箱的生命周期，确保所有设计演进都经过了AI的协同分析，从而提升决策质量和开发效率。

### **4. 设计目标 (Design Goals)**
*   **参数化**：生成过程应完全由一个清晰、可读的配置文件驱动。
*   **模式多样**：支持**“从零生成”**（基于空间点过程模型）和**“从现有数据抽样”**两种核心模式。
*   **真实感**：生成的地理边界和客户分布应能模拟现实世界的模式。
*   **可复现**：在配置相同的情况下，生成的数据应保持一致。
*   **标准化输出**：输出的`GeoDataFrame`应有统一、明确的数据模式。

### **5. 模块配置 (Configuration)**
```python
# file: src/common/schemas.py
from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Union

@dataclass
class VoronoiConfig:
    num_units: int
    bounding_box: Tuple[float, float, float, float] = (0, 0, 100, 100)

@dataclass
class HomogeneousPoissonConfig:
    intensity: float

@dataclass
class InhomogeneousPoissonConfig:
    intensity_peaks: List[Tuple[float, float, float, float]] # (center_x, center_y, peak_value, std_dev)

@dataclass
class NeymanScottConfig:
    parent_intensity: float
    offspring_per_parent: int
    offspring_radius: float

@dataclass
class SamplingConfig:
    source_filepath: str
    method: str = "proportional"
    fraction: float = 0.5

@dataclass
class DataGeneratorConfig:
    voronoi_config: VoronoiConfig
    random_seed: int = 42
    distribution_config: Optional[Union[HomogeneousPoissonConfig, InhomogeneousPoissonConfig, NeymanScottConfig]] = None
    sampling_config: Optional[SamplingConfig] = None
```

### **6. 输出规格 (Output Schema)**
1.  **`base_units_gdf` (基础地理单元)**
    *   `unit_id` (int): 基础单元的唯一标识，从0开始。
    *   `geometry` (Polygon): 该单元的地理边界（Shapely Polygon对象）。

2.  **`customers_gdf` (客户数据)**
    *   `customer_id` (int): 客户的唯一标识，从0开始。
    *   `geometry` (Point): 客户的地理位置（Shapely Point对象）。
    *   `unit_id` (int): 该客户所属的基础单元ID。
    *   `sales_potential` (float): 模拟的销售潜力。
    *   `workload` (float): 模拟的工作量。

### **7. 核心逻辑与实现步骤 (Core Logic & Implementation)**

**7.1. 主函数**
```python
# file: src/data_processing/synthetic_generator.py
def generate_data(config: DataGeneratorConfig) -> Tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
    """主函数：根据配置生成数据"""
    # 1. 设置随机种子
    np.random.seed(config.random_seed)

    # 2. 生成基础地理单元
    base_units_gdf = _generate_voronoi_units(config.voronoi_config)

    # 3. 根据模式生成客户点
    if config.sampling_config:
        customers_gdf = _generate_points_from_sampling(config.sampling_config)
    elif config.distribution_config:
        customers_gdf = _generate_points_from_distribution(config.distribution_config, config.voronoi_config.bounding_box)
    else:
        raise ValueError("Either distribution_config or sampling_config must be provided.")

    # 4. 将客户点关联到基础单元上
    final_customers_gdf = _assign_units_to_points(customers_gdf, base_units_gdf)

    return base_units_gdf, final_customers_gdf
```

**7.2. 内部函数（伪代码）**
```python
def _generate_voronoi_units(config: VoronoiConfig) -> gpd.GeoDataFrame:
    # 在bounding_box内生成N个种子点
    # 使用scipy.spatial.Voronoi计算泰森多边形
    # 裁剪多边形到边界
    # 返回包含unit_id和geometry的GeoDataFrame
    pass

def _generate_points_from_distribution(config: Union[...], bounding_box) -> gpd.GeoDataFrame:
    # IF config is HomogeneousPoissonConfig:
    #   在bounding_box内生成泊松分布点
    # IF config is InhomogeneousPoissonConfig:
    #   根据强度峰值，在bounding_box内生成非齐次泊松分布点
    # IF config is NeymanScottConfig:
    #   生成父点，再围绕父点生成子点
    # 为每个点附加模拟的sales_potential和workload属性
    # 返回包含geometry和业务属性的GeoDataFrame
    pass

def _generate_points_from_sampling(config: SamplingConfig) -> gpd.GeoDataFrame:
    # 读取源文件
    # 根据抽样方法(proportional)和比例(fraction)进行抽样
    # 返回包含geometry和业务属性的GeoDataFrame
    pass

def _assign_units_to_points(customers: gpd.GeoDataFrame, units: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    # 使用geopandas.sjoin进行空间连接
    # 返回增加了unit_id列的customers GeoDataFrame
    pass
```

### **8. 配置示例 (Configuration Examples)**

以下是用于驱动生成器的YAML配置文件示例。

**示例1：从零生成（非齐次泊松分布）**
```yaml
# file: configs/generator_configs/example_poisson.yaml
voronoi_config:
  num_units: 500
  bounding_box: [0, 0, 100, 100]

distribution_config:
  # 使用非齐次泊松模型
  type: InhomogeneousPoisson
  # 定义两个强度高峰（城市）
  intensity_peaks:
    - [25, 25, 50, 10]  # [center_x, center_y, peak_value, std_dev]
    - [75, 75, 30, 15]

random_seed: 42
```

**示例2：从现有数据抽样**
```yaml
# file: configs/generator_configs/example_sampling.yaml
voronoi_config:
  num_units: 500
  bounding_box: [0, 0, 100, 100]

sampling_config:
  source_filepath: "data/real/real_customers.csv"
  method: "proportional"
  fraction: 0.3 # 抽取30%的数据

random_seed: 42
```

### **9. 依赖库 (Dependencies)**
*   `geopandas`, `pandas`, `numpy`, `scipy`, `scikit-learn`, `shapely`

### **10. 验证方法 (Validation)**
本模块自身的验证，将通过在Jupyter Notebook中调用并对输出进行可视化来完成。更进一步的**空间模式验证**，将通过调用**`spatial_stats`模块**来实现。
