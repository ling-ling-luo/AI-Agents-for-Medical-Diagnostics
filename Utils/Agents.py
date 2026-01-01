import os
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

class Agent:
    def __init__(self, medical_report=None, role=None, extra_info=None, model_name=None, language="en"):
        self.medical_report = medical_report
        self.role = role
        self.extra_info = extra_info
        self.language = language  # 'en' 或 'zh'
        # 根据角色和额外信息初始化提示模板
        self.prompt_template = self.create_prompt_template()
        # 使用自定义网关 / 环境变量配置初始化大模型
        base_url = os.getenv("OPENAI_BASE_URL")
        # 如果传入了model_name参数，使用它；否则从环境变量读取
        if model_name is None:
            model_name = os.getenv("LLM_MODEL", "gemini-2.5-flash")
        self.model = ChatOpenAI(
            temperature=0,
            model=model_name,
            base_url=base_url,
        )

    def create_prompt_template(self):
        if self.role == "MultidisciplinaryTeam":
            if self.language == "zh":
                templates = f"""
                    扮演一个由医疗保健专业人员组成的多学科团队。
                    你将收到心脏科医生、心理学家和呼吸科医生对患者的医疗报告。
                    任务：审查心脏科医生、心理学家和呼吸科医生的患者医疗报告，分析它们并列出患者的 3 个可能的健康问题。
                    仅返回患者 3 个可能的健康问题的要点列表，并为每个问题提供原因。

                    心脏科医生报告：{self.extra_info.get('cardiologist_report', '')}
                    心理学家报告：{self.extra_info.get('psychologist_report', '')}
                    呼吸科医生报告：{self.extra_info.get('pulmonologist_report', '')}
                """
            else:
                templates = f"""
                    Act like a multidisciplinary team of healthcare professionals.
                    You will receive a medical report of a patient visited by a Cardiologist, Psychologist, and Pulmonologist.
                    Task: Review the patient's medical report from the Cardiologist, Psychologist, and Pulmonologist, analyze them and come up with a list of 3 possible health issues of the patient.
                    Just return a list of bullet points of 3 possible health issues of the patient and for each issue provide the reason.

                    Cardiologist Report: {self.extra_info.get('cardiologist_report', '')}
                    Psychologist Report: {self.extra_info.get('psychologist_report', '')}
                    Pulmonologist Report: {self.extra_info.get('pulmonologist_report', '')}
                """
        else:
            if self.language == "zh":
                templates_zh = {
                    "Cardiologist": """
                        扮演一名心脏科医生。你将收到患者的医疗报告。
                        任务：审查患者的心脏检查，包括 ECG、血液检测、Holter 监测结果和超声心动图。
                        重点：确定是否有任何可能解释患者症状的心脏问题的微妙迹象。排除任何潜在的心脏疾病，如心律失常或结构异常，这些可能在常规检测中被遗漏。
                        建议：提供关于需要进行的任何进一步心脏检测或监测的指导，以确保没有隐藏的心脏相关问题。如果识别出心脏问题，建议潜在的管理策略。
                        请仅返回患者症状的可能原因和建议的下一步措施。
                        医疗报告：{medical_report}
                    """,
                    "Psychologist": """
                        扮演一名心理学家。你将收到患者的报告。
                        任务：审查患者的报告并提供心理评估。
                        重点：识别可能影响患者福祉的任何潜在心理健康问题，如焦虑、抑郁或创伤。
                        建议：提供关于如何解决这些心理健康问题的指导，包括治疗、咨询或其他干预措施。
                        请仅返回可能的心理健康问题和建议的下一步措施。
                        患者报告：{medical_report}
                    """,
                    "Pulmonologist": """
                        扮演一名呼吸科医生。你将收到患者的报告。
                        任务：审查患者的报告并提供肺部评估。
                        重点：识别可能影响患者呼吸的任何潜在呼吸问题，如哮喘、COPD 或肺部感染。
                        建议：提供关于如何解决这些呼吸问题的指导，包括肺功能测试、影像学检查或其他干预措施。
                        请仅返回可能的呼吸问题和建议的下一步措施。
                        患者报告：{medical_report}
                    """
                }
                templates = templates_zh[self.role]
            else:
                templates_en = {
                    "Cardiologist": """
                        Act like a cardiologist. You will receive a medical report of a patient.
                        Task: Review the patient's cardiac workup, including ECG, blood tests, Holter monitor results, and echocardiogram.
                        Focus: Determine if there are any subtle signs of cardiac issues that could explain the patient's symptoms. Rule out any underlying heart conditions, such as arrhythmias or structural abnormalities, that might be missed on routine testing.
                        Recommendation: Provide guidance on any further cardiac testing or monitoring needed to ensure there are no hidden heart-related concerns. Suggest potential management strategies if a cardiac issue is identified.
                        Please only return the possible causes of the patient's symptoms and the recommended next steps.
                        Medical Report: {medical_report}
                    """,
                    "Psychologist": """
                        Act like a psychologist. You will receive a patient's report.
                        Task: Review the patient's report and provide a psychological assessment.
                        Focus: Identify any potential mental health issues, such as anxiety, depression, or trauma, that may be affecting the patient's well-being.
                        Recommendation: Offer guidance on how to address these mental health concerns, including therapy, counseling, or other interventions.
                        Please only return the possible mental health issues and the recommended next steps.
                        Patient's Report: {medical_report}
                    """,
                    "Pulmonologist": """
                        Act like a pulmonologist. You will receive a patient's report.
                        Task: Review the patient's report and provide a pulmonary assessment.
                        Focus: Identify any potential respiratory issues, such as asthma, COPD, or lung infections, that may be affecting the patient's breathing.
                        Recommendation: Offer guidance on how to address these respiratory concerns, including pulmonary function tests, imaging studies, or other interventions.
                        Please only return the possible respiratory issues and the recommended next steps.
                        Patient's Report: {medical_report}
                    """
                }
                templates = templates_en[self.role]
        return PromptTemplate.from_template(templates)
    
    def run(self):
        print(f"{self.role} 智能体开始运行...")
        prompt = self.prompt_template.format(medical_report=self.medical_report)
        try:
            response = self.model.invoke(prompt)
            result = response.content
            if not result or not result.strip():
                print(f"⚠️  {self.role} 返回了空结果")
                return None
            print(f"✓ {self.role} 成功返回结果（长度: {len(result)} 字符）")
            return result
        except Exception as e:
            print(f"❌ {self.role} 运行过程中发生错误: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return None

# 定义专科智能体类
class Cardiologist(Agent):
    def __init__(self, medical_report, model_name=None, language="en"):
        super().__init__(medical_report, "Cardiologist", model_name=model_name, language=language)

class Psychologist(Agent):
    def __init__(self, medical_report, model_name=None, language="en"):
        super().__init__(medical_report, "Psychologist", model_name=model_name, language=language)

class Pulmonologist(Agent):
    def __init__(self, medical_report, model_name=None, language="en"):
        super().__init__(medical_report, "Pulmonologist", model_name=model_name, language=language)

class MultidisciplinaryTeam(Agent):
    def __init__(self, cardiologist_report, psychologist_report, pulmonologist_report, model_name=None, language="en"):
        extra_info = {
            "cardiologist_report": cardiologist_report,
            "psychologist_report": psychologist_report,
            "pulmonologist_report": pulmonologist_report
        }
        super().__init__(role="MultidisciplinaryTeam", extra_info=extra_info, model_name=model_name, language=language)
