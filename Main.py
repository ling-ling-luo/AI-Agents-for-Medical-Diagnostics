# 导入所需的模块
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
from Utils.Agents import Cardiologist, Psychologist, Pulmonologist, MultidisciplinaryTeam
import json, os
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# 从 dotenv 文件中加载 API 密钥和网关配置
load_dotenv(dotenv_path='apikey.env')


def run_multi_agent_diagnosis(medical_report: str, model_name: str = None) -> str:
    """运行三个专科智能体 + 多学科团队智能体，返回**结构化的 markdown 结果**。

    Args:
        medical_report: 病历报告文本
        model_name: 使用的AI模型名称（可选，如果为None则使用环境变量）

    你可以在自己的项目中直接 import 使用，例如：

        from Main import run_multi_agent_diagnosis
        result_md = run_multi_agent_diagnosis(medical_report, model_name="claude-sonnet-4.5")

    返回值是一个包含以下结构的 markdown 字符串：

    # Multidisciplinary Diagnosis

    ## Final Diagnosis (Summary)
    - ...

    ## Specialist Reports
    ### Cardiologist
    ...
    """
    agents = {
        "Cardiologist": Cardiologist(medical_report, model_name=model_name),
        "Psychologist": Psychologist(medical_report, model_name=model_name),
        "Pulmonologist": Pulmonologist(medical_report, model_name=model_name),
    }

    # 定义一个函数，用于运行单个智能体并获取返回结果
    def get_response(agent_name, agent):
        response = agent.run()
        return agent_name, response

    # 并发运行各个专科智能体，并收集它们的响应
    responses = {}
    with ThreadPoolExecutor() as executor:
        futures = {
            executor.submit(get_response, name, agent): name
            for name, agent in agents.items()
        }

        for future in as_completed(futures):
            agent_name, response = future.result()
            responses[agent_name] = response

    team_agent = MultidisciplinaryTeam(
        cardiologist_report=responses.get("Cardiologist"),
        psychologist_report=responses.get("Psychologist"),
        pulmonologist_report=responses.get("Pulmonologist"),
        model_name=model_name,
    )

    # 运行多学科团队智能体，生成最终诊断总结
    final_diagnosis = team_agent.run()

    # 防御性处理：如果最终诊断为空或类型不正确，则给出说明性文本
    if not isinstance(final_diagnosis, str) or not final_diagnosis.strip():
        final_section = "No final diagnosis could be generated due to upstream model errors."
    else:
        final_section = final_diagnosis.strip()

    cardiologist_md = (responses.get("Cardiologist") or "No cardiologist report (upstream error).").strip()
    psychologist_md = (responses.get("Psychologist") or "No psychologist report (upstream error).").strip()
    pulmonologist_md = (responses.get("Pulmonologist") or "No pulmonologist report (upstream error).").strip()

    full_md = f"""# Multidisciplinary Diagnosis

## Final Diagnosis (Summary)

{final_section}

## Specialist Reports

### Cardiologist

{cardiologist_md}

### Psychologist

{psychologist_md}

### Pulmonologist

{pulmonologist_md}
"""

    return full_md


# 仅当直接运行此脚本时执行示例诊断，避免在 import 时执行
if __name__ == "__main__":
    # 构建医疗报告文件的绝对路径，以确保跨平台兼容
    base_dir = os.path.dirname(__file__)
    report_path = os.path.join(
        base_dir,
        "Medical Reports",
        "Medical Rerort - Michael Johnson - Panic Attack Disorder.txt",
    )

    # 读取医疗报告内容
    with open(report_path, "r", encoding="utf-8") as file:
        medical_report = file.read()

    # 使用上面的通用函数跑当前项目内置案例
    final_diagnosis_text = run_multi_agent_diagnosis(medical_report)
    txt_output_path = "results/final_diagnosis.txt"

    # 确保结果输出目录存在
    os.makedirs(os.path.dirname(txt_output_path), exist_ok=True)

    # 将最终诊断结果写入文本文件
    with open(txt_output_path, "w") as txt_file:
        txt_file.write(final_diagnosis_text)

    print(f"最终诊断结果已保存到 {txt_output_path}")

