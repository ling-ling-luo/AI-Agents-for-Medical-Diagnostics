# AI-Agents-for-Medical-Diagnostics

<img width="900" alt="image" src="https://github.com/user-attachments/assets/b7c87bf6-dfff-42fe-b8d1-9be9e6c7ce86">

这是一个使用 Python 构建的项目，用于创建专业化的、基于大语言模型（LLM）的 **AI 医疗智能体**，以分析复杂的医疗病例。
系统会综合不同专科医生视角下的分析结果，给出更全面的评估和潜在治疗方向，展示了 AI 在多学科协作医学中的应用潜力。

⚠️ **免责声明（Disclaimer）**：本项目仅用于研究与教学目的。
**严禁用于任何实际临床诊断或治疗决策场景。**

---

## ✨ 最新更新内容（What’s New）

- 新增 **MIT License** 授权协议
- 修复若干已知问题，并更新 `requirements.txt` 依赖
- 新增 `.gitignore` 配置，避免无关文件提交到仓库
- 将核心大语言模型升级为 **GPT-5**

---

## 🚀 工作原理（How It Works）

在当前版本中，系统使用 **三个基于 GPT-5 的 AI 专科智能体**，分别对应不同的医学领域。
一份医疗报告会被同时传入这三个智能体中，它们会 **并行（多线程）** 进行分析并返回各自的结论。
之后，系统会将这些结论进行整合，总结出 **三个可能的健康问题**，并给出相应的理由。

### AI 专科智能体（AI Agents）

**1. 心脏科智能体（Cardiologist Agent）**
- *关注点（Focus）*：识别心律失常、结构性心脏病等潜在心脏问题。
- *建议（Recommendations）*：给出进一步心血管检查、监测及管理策略的建议。

**2. 心理学智能体（Psychologist Agent）**
- *关注点（Focus）*：识别如惊恐障碍、焦虑等心理/精神方面的问题。
- *建议（Recommendations）*：给出心理治疗、压力管理或用药调整等建议。

**3. 呼吸科智能体（Pulmonologist Agent）**
- *关注点（Focus）*：评估可能的呼吸系统原因（如哮喘、呼吸功能异常等）。
- *建议（Recommendations）*：给出肺功能检查、呼吸训练以及相关治疗建议。

---

## 📂 仓库结构（Repository Structure）

- `Medical Reports/` → 用于存放示例医疗报告（合成/匿名化病例）
- `Results/` → 存放各智能体及最终诊断生成的结果文件

---

## ⚡ 快速上手（Quickstart）

1. **克隆仓库：**
   ```bash
   git clone https://github.com/ahmadvh/AI-Agents-for-Medical-Diagnostics.git
   cd AI-Agents-for-Medical-Diagnostics
   ```
2. **创建虚拟环境并安装依赖：**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows 下为： venv\Scripts\activate
    pip install -r requirements.txt
    ```
3. **配置 API 凭证：**
    - 在项目根目录创建文件：`apikey.env`
    - 写入你的 OpenAI（或其它 LLM 服务商）的密钥，例如：
    ```bash
    OPENAI_API_KEY=your_api_key_here
    ```
4. **运行系统：**
    ```bash
    python Main.py
    ```
---

## 🔮 后续计划（Future Enhancements）

未来版本计划加入的改进包括：

- **扩展更多专科智能体（Specialist Expansion）**：例如神经科、内分泌科、免疫科等领域。
- **支持本地 LLM（Local LLM Support）**：通过 Ollama、vLLM 或 llama.cpp 集成如 **Llama 4** 等本地模型，并提供函数调用式能力及安全的代码执行机制。
- **视觉诊断能力（Vision Capabilities）**：让智能体能够分析**影像学检查结果（如放射影像）**以及其他医学图像，实现多模态决策。
- **实时数据工具（Live Data Tools）**：集成基于 LLM 的**实时检索**能力，并支持对结构化**医学数据集**进行查询。
- **高级报告解析（Advanced Parsing）**：在复杂医疗报告解析方面提供更结构化的输出（例如符合 JSON Schema 的结构）。
- **自动化测试（Automated Testing）**：增加评估管线和简单的 CI 冒烟测试（使用 mock LLM 调用），提升可复现性。
---

## 📜 许可证（License）

本仓库基于 **MIT License** 开源。

在遵守 [LICENSE](LICENSE) 文件中条款的前提下，你可以自由地使用、复制、修改、合并、发布、分发、再许可以及销售本软件的副本。

本软件以 **“按原样”（as is）** 的形式提供，不附带任何形式的明示或暗示担保。
