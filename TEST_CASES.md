# 新增病例功能测试用例

## 测试目的
验证新增病例功能是否支持中英文输入，并能正确生成标准格式的病例报告。

## 测试用例

### 1. 英文病例 (English Case)

**基本信息：**
- 病历号：TEST-EN-001
- 患者姓名：John Smith
- 年龄：45
- 性别：男 (Male)
- 报告语言：英文 (English)

**主诉：**
```
The patient reports experiencing severe chest pain radiating to the left arm for the past 2 hours, accompanied by shortness of breath and sweating.
```

**个人病史：**
```
Hypertension diagnosed 5 years ago, managed with medication. No history of heart disease.
```

**家族史：**
```
Father died of myocardial infarction at age 55. Mother has type 2 diabetes.
```

**生活方式：**
```
Smoker (20 pack-years), moderate alcohol consumption, sedentary lifestyle.
```

**用药情况：**
```
Amlodipine 5mg daily, Aspirin 100mg daily.
```

**实验室检查：**
```
Troponin I: Elevated (0.8 ng/mL, normal <0.04)
ECG: ST-segment elevation in leads II, III, aVF
```

**体格检查：**
```
Cardiovascular: S1, S2 normal, no murmurs. Respiratory: Clear breath sounds bilaterally.
```

**生命体征：**
```
BP 150/95 mmHg, HR 105 bpm, RR 22/min, Temp 37.2°C, SpO2 95% on room air
```

---

### 2. 中文病例 (Chinese Case)

**基本信息：**
- 病历号：TEST-ZH-001
- 患者姓名：李明
- 年龄：58
- 性别：女 (Female)
- 报告语言：中文 (Chinese)

**主诉：**
```
患者诉反复咳嗽、咳痰伴气促3个月，近1周加重，痰中偶带血丝。
```

**个人病史：**
```
有慢性支气管炎病史10年，近年来症状加重。既往无肺结核病史，无糖尿病史。
```

**家族史：**
```
母亲患有支气管哮喘，父亲因肺癌去世。
```

**生活方式：**
```
长期被动吸烟，不饮酒，轻体力劳动。
```

**用药情况：**
```
氨茶碱缓释片 0.1g 每日2次，沙丁胺醇吸入剂按需使用。
```

**实验室检查：**
```
胸部CT：右上肺见不规则块影，大小约3.5×2.8cm，边界不清，周围见毛刺征
血常规：WBC 9.8×10^9/L，中性粒细胞比例78%
肿瘤标志物：CEA 45 ng/mL（正常<5），CYFRA21-1 12 ng/mL（正常<3.3）
```

**体格检查：**
```
呼吸音粗糙，右上肺呼吸音减弱，未闻及明显干湿性啰音。
```

**生命体征：**
```
血压 135/85 mmHg，心率 88次/分，呼吸频率 20次/分，体温 36.8°C，血氧饱和度 93%
```

---

### 3. 双语病例 (Bilingual Case)

**基本信息：**
- 病历号：TEST-BOTH-001
- 患者姓名：王晓芳 (Wang Xiaofang)
- 年龄：32
- 性别：女 (Female)
- 报告语言：双语 (Bilingual)

**主诉：**
```
反复心悸、胸闷2年，伴头晕、出汗，每次发作持续10-30分钟。
Recurrent palpitations and chest tightness for 2 years, accompanied by dizziness and sweating, each episode lasting 10-30 minutes.
```

**个人病史：**
```
焦虑症病史3年，间断服用抗焦虑药物。无其他重大疾病史。
History of anxiety disorder for 3 years, intermittent use of anti-anxiety medications. No other major medical history.
```

**家族史：**
```
母亲有高血压，姐姐患有甲状腺功能亢进症。
Mother has hypertension, sister has hyperthyroidism.
```

**用药情况：**
```
阿普唑仑0.4mg 睡前服用，丙米嗪25mg 每日1次。
Alprazolam 0.4mg at bedtime, Imipramine 25mg once daily.
```

**实验室检查：**
```
甲状腺功能：TSH 2.5 mIU/L（正常），FT3、FT4正常
心电图：窦性心律，偶发室性早搏
动态心电图：偶发室性早搏，未见明显心律失常
Thyroid function: TSH 2.5 mIU/L (normal), FT3, FT4 normal
ECG: Sinus rhythm, occasional premature ventricular contractions
Holter monitoring: Occasional PVCs, no significant arrhythmias
```

**生命体征：**
```
BP 118/76 mmHg, HR 82 bpm, BMI 22.3
```

---

## 预期结果

1. **英文病例**应生成标准英文医疗报告格式
2. **中文病例**应生成标准中文医疗报告格式
3. **双语病例**应生成中英文对照的医疗报告格式
4. 所有病例都应能成功保存到数据库
5. AI 诊断功能应能正常处理中英文病例

## 测试步骤

1. 访问前端页面：http://localhost:5173
2. 点击"新增病例"按钮
3. 按照上述用例填写表单
4. 选择对应的报告语言
5. 提交表单
6. 验证病例是否创建成功
7. 进入病例详情页
8. 点击"开始诊断"按钮
9. 验证 AI 诊断是否正常工作

## 注意事项

- 确保后端服务（http://localhost:8000）正在运行
- 确保前端服务（http://localhost:5173）正在运行
- 病历号必须唯一，不能重复
- 中文病例可以测试 AI 模型对中文的支持程度
