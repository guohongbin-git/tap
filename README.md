### **修订记录 (Change Log)**

| 版本 (Version) | 日期 (Date) | 变更内容 (Change Description) | 作者 (Author) | 审批人 (Approved By) |
| :--- | :--- | :--- | :--- | :--- |
| 1.2 | 2025年8月15日 | v1.1版本已由郭宏斌评审通过。更新审批状态。 | Gemini | (待审批) |
| 1.1 | 2025年8月15日 | 根据QWEN AI的评审意见进行全面重写，增加了项目介绍、安装、使用、贡献和文档链接等核心部分。 | Gemini | 郭宏斌 |
| 1.0 | 2025年8月15日 | 项目初始化时的占位符文件。 | Gemini | 郭宏斌 |

---
**版本**: 1.2
**状态**: 已批准 (Approved)

# **TAP工具箱 (Territory Alignment Problem Toolbox)**

**TAP工具箱**是一个具备自我解释能力的、可实现自动化研究的智能化领土划分框架。本项目旨在将复杂的空间分区算法（如Metis, SKATER）封装在一个高度模块化的系统中，并通过与多模态大语言模型（LLM）的深度集成，为算法研究、对比和教育提供一个可扩展的平台。

## 核心特性

*   **模块化与可扩展**: 采用分层解耦架构，轻松集成、对比和验证新的算法。
*   **自动化研究流程**: 通过YAML配置，自动化执行“数据生成-算法运行-结果评估”的完整实验。
*   **LLM智能内核**: 内置的LLM能够理解图文并茂的实验日志，对算法和结果进行深度解释和分析。
*   **强大的数据生成器**: 支持从零生成（基于空间点过程模型）或从现有数据抽样，以创造多样化的测试场景。

## 项目状态

**注意**: 本项目目前处于**Alpha测试阶段**。核心后端功能和前端交互界面已基本完成。

**最新进展 (2025年8月17日):**
*   **前端增强完成**: 已根据设计文档`DDR_09`，全面增强了前端功能，包括实现了动态参数配置、空间统计分析、交互式结果报告和LLM聊天机器人。

## 安装指南 (Installation)

1.  **克隆代码库**:
    ```bash
    git clone <repository_url>
    cd TAP
    ```

2.  **安装后端依赖**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **安装开发依赖 (针对贡献者)**:
    如果您希望对本项目进行贡献，请额外安装开发工具依赖。
    ```bash
    pip install -r requirements-dev.txt
    ```

## 运行后端服务 (Running the Backend Service)

(说明：此部分将在API开发完成后更新)

## 运行前端开发环境 (Running the Frontend Development Environment)

前端应用是一个使用React和Vite构建的单页应用。您需要Node.js环境来运行它。

1.  **进入前端目录**:
    ```bash
    cd frontend
    ```

2.  **安装前端依赖**:
    如果您是第一次运行，或者依赖项有更新，请运行此命令。
    ```bash
    npm install
    ```

3.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
    此命令会启动一个本地开发服务器（通常在 `http://localhost:5173`）。在浏览器中打开该地址，您就可以看到并与前端界面进行交互了。

## 构建前端生产版本 (Building the Frontend for Production)

当您准备好部署前端应用时，可以将其构建为生产优化版本。

1.  **进入前端目录**:
    ```bash
    cd frontend
    ```

2.  **执行构建命令**:
    ```bash
    npm run build
    ```
    构建完成后，生产优化文件将生成在 `frontend/dist` 目录下。这些文件可以直接部署到任何静态文件服务器上。

## 文档 (Documentation)

我们维护一套完整的设计和治理文档，以确保项目的透明度和可维护性。

*   [**项目愿景与范围**](docs/00_vision_and_scope.md): 了解项目的顶层目标和核心功能。
*   [**系统架构设计**](docs/01_architecture.md): 查看项目的分层架构和组件职责。
*   [**项目路线图**](docs/02_roadmap_and_progress.md): 追踪我们的开发计划和当前进度。

## 贡献 (Contributing)

我们欢迎任何形式的贡献！如果您对本项目感兴趣，无论是提交代码、报告问题还是改进文档，都请先阅读我们的[**贡献指南 (CONTRIBUTING.md)**](CONTRIBUTING.md)。
