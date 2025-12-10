/**
 * 病例详情页引导组件
 * 使用 react-joyride 实现交互式引导
 * 仅在病例详情页触发
 */
import { useState } from 'react';
import Joyride, { type CallBackProps, STATUS, type Step } from 'react-joyride';

interface CaseDetailTourProps {
  run: boolean;
  onComplete: () => void;
  hasDiagnosis: boolean; // 是否已有诊断结果
}

export const CaseDetailTour: React.FC<CaseDetailTourProps> = ({ run, onComplete, hasDiagnosis }) => {
  const [stepIndex, setStepIndex] = useState(0);

  // 根据是否有诊断结果，定义不同的步骤
  const stepsWithoutDiagnosis: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-semibold mb-2">病例详情页引导</h2>
          <p className="text-gray-600">
            这里是病例详情页，您可以查看病例信息并运行 AI 诊断。
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.case-info-section',
      content: (
        <div>
          <h3 className="font-semibold mb-2">1. 病例信息</h3>
          <p className="text-sm text-gray-600">
            这里显示患者的基本信息和病历详情，包括姓名、年龄、性别、主诉等。
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.model-selector',
      content: (
        <div>
          <h3 className="font-semibold mb-2">2. 选择 AI 模型</h3>
          <p className="text-sm text-gray-600">
            系统支持多种 AI 模型，您可以根据需要选择不同的模型进行诊断。
            不同模型可能产生不同的诊断结果。
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.run-diagnosis-button',
      content: (
        <div>
          <h3 className="font-semibold mb-2">3. 运行 AI 诊断</h3>
          <p className="text-sm text-gray-600 mb-3">
            点击"开始诊断"按钮，系统会调用三个专科智能体进行分析：
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mb-3">
            <li><strong>心脏科</strong>（Cardiologist）</li>
            <li><strong>心理学</strong>（Psychologist）</li>
            <li><strong>呼吸科</strong>（Pulmonologist）</li>
          </ul>
          <div className="bg-blue-50 p-3 rounded text-xs">
            <p className="text-blue-800">
              💡 提示：诊断过程约需 1-2 分钟，请耐心等待。
            </p>
          </div>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-semibold mb-2">🎉 引导完成！</h2>
          <p className="text-gray-600 mb-3">
            现在您可以开始运行 AI 诊断了。诊断完成后，系统会自动显示结果。
          </p>
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs">
            <p className="text-yellow-800 font-medium mb-1">⚠️ 重要提示</p>
            <p className="text-yellow-700">
              本系统仅用于研究和教学目的，所有诊断结果必须由专业医疗人员审核，
              严禁用于实际临床决策。
            </p>
          </div>
        </div>
      ),
      placement: 'center',
    },
  ];

  const stepsWithDiagnosis: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-semibold mb-2">病例详情页引导</h2>
          <p className="text-gray-600">
            这个病例已经有诊断结果了，让我们看看如何查看和导出诊断报告。
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.diagnosis-result-section',
      content: (
        <div>
          <h3 className="font-semibold mb-2">1. 查看综合诊断</h3>
          <p className="text-sm text-gray-600 mb-2">
            这里显示由多学科团队整合后的最终诊断意见，包括：
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>诊断结论</li>
            <li>治疗建议</li>
            <li>注意事项</li>
          </ul>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.specialist-reports-section',
      content: (
        <div>
          <h3 className="font-semibold mb-2">2. 查看专科报告</h3>
          <p className="text-sm text-gray-600 mb-2">
            点击任一专科卡片，可以查看该专科的详细分析报告。
            也可以点击"全览报告"按钮一次查看所有专科报告。
          </p>
          <div className="bg-blue-50 p-3 rounded text-xs mt-2">
            <p className="text-blue-800">
              💡 提示：点击智能体卡片可以查看其工作原理和提示词。
            </p>
          </div>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.export-button',
      content: (
        <div>
          <h3 className="font-semibold mb-2">3. 导出诊断报告</h3>
          <p className="text-sm text-gray-600 mb-3">
            点击"导出"按钮，支持多种格式：
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-medium">PDF</p>
              <p className="text-gray-600">专业排版</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-medium">Word</p>
              <p className="text-gray-600">可编辑</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-medium">Markdown</p>
              <p className="text-gray-600">纯文本</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-medium">JSON</p>
              <p className="text-gray-600">结构化</p>
            </div>
          </div>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-semibold mb-2">🎉 引导完成！</h2>
          <p className="text-gray-600 mb-3">
            现在您已经了解了病例详情页的所有功能！
          </p>
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs">
            <p className="text-yellow-800 font-medium mb-1">⚠️ 重要提示</p>
            <p className="text-yellow-700">
              本系统仅用于研究和教学目的，所有诊断结果必须由专业医疗人员审核，
              严禁用于实际临床决策。
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            您可以随时在账号菜单中重新观看此引导。
          </p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const steps = hasDiagnosis ? stepsWithDiagnosis : stepsWithoutDiagnosis;

  // 处理引导回调
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data;

    // 更新当前步骤索引
    if (type === 'step:after') {
      setStepIndex(index + 1);
    }

    // 引导完成或跳过
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#fff',
          backgroundColor: '#fff',
          primaryColor: '#2563eb',
          textColor: '#1f2937',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#2563eb',
          borderRadius: 6,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 8,
        },
        buttonSkip: {
          color: '#6b7280',
        },
      }}
      locale={{
        back: '上一步',
        close: '关闭',
        last: '完成',
        next: '下一步',
        open: '打开对话框',
        skip: '跳过引导',
      }}
      disableOverlayClose={false}
      spotlightClicks={false}
      disableScrolling={false}
    />
  );
};
