### **修订记录 (Change Log)**

| 版本 (Version) | 日期 (Date) | 变更内容 (Change Description) | 作者 (Author) | 审批人 (Approved By) |
| :--- | :--- | :--- | :--- | :--- |
| 1.2 | 2025年8月15日 | v1.1版本已由郭宏斌评审通过。更新审批状态。 | Gemini | (待审批) |
| 1.1 | 2025年8月15日 | 根据QWEN AI的评审意见，新增`requirements-dev.txt`的说明，并增加了“环境设置”章节。 | Gemini | 郭宏斌 |
| 1.0 | 2025年8月15日 | 初版创建... | Gemini | 郭宏斌 |

---
**版本**: 1.2
**状态**: 已批准 (Approved)

# 贡献指南与编码规范

欢迎为TAP工具箱项目贡献代码！为保证项目代码的高质量和一致性，所有贡献者请遵循以下规范。

## 1. 环境设置 (Environment Setup)

为保证开发环境的纯净与一致性，本项目强制要求使用Python内置的`venv`模块创建虚拟环境。

请遵循以下步骤设置您的开发环境：

```bash
# 1. 在项目根目录创建虚拟环境
python3 -m venv .venv

# 2. 激活虚拟环境
#    - macOS / Linux:
source .venv/bin/activate
#    - Windows:
#      .venv\\Scripts\\activate

# 3. 安装核心依赖
pip install -r requirements.txt

# 4. 安装开发依赖 (包括测试、格式化工具等)
pip install -r requirements-dev.txt
```

**重要提示**:
*   请确保您的所有开发活动（运行代码、测试、调试）都在已激活的虚拟环境中进行。
*   `.gitignore`文件已配置为忽略`.venv`目录，请勿将其提交到版本库。


## 2. 代码风格 (Code Style)

*   **PEP 8**: 所有Python代码必须严格遵循 [PEP 8](https://www.python.org/dev/peps/pep-0008/) 风格指南。
*   **Black**: 我们使用 `black` 作为代码的自动格式化工具，以确保风格的绝对一致。所有代码在提交前都必须经过`black`格式化。

## 3. 代码质量 (Code Quality)

*   **Linter**: 我们使用 `ruff` 作为代码的Linter，用于检查潜在的错误和不规范的写法。
*   **类型提示 (Type Hinting)**: 所有新的函数和方法都必须包含完整的类型提示（遵循PEP 484）。不允许在没有类型提示的情况下定义函数。

## 4. 文档与注释 (Documentation & Comments)

*   **Docstrings**: 所有公开的模块、类、函数和方法都必须编写文档字符串（Docstring）。我们推荐使用Google风格的Docstring。
*   **代码注释**: 注释应简洁明了，只在必要时使用，用于解释“为什么”这样做，而不是“做了什么”。

## 5. 测试 (Testing)

*   **框架**: 我们使用 `pytest` 作为单元测试和集成测试的框架。
*   **覆盖率**: 所有新增的功能代码都必须有相应的单元测试来覆盖其核心逻辑。

## 5. 开发流程 (Workflow)

*   **设计先行**: 任何非简单的代码改动，都应遵循我们在`docs`中定义的“设计-审核-编码”流程。
*   **Pre-Commit (推荐)**: 推荐开发者在本地设置`pre-commit`钩子... (未来，我们可能会在项目中直接提供`.pre-commit-config.yaml`文件来简化这一过程)。