/**
 * 首页引导组件
 * 使用 react-joyride 实现交互式引导
 * 仅包含首页相关的引导步骤
 */
import { useState } from 'react';
import Joyride, { type CallBackProps, STATUS, type Step } from 'react-joyride';

interface OnboardingTourProps {
  run: boolean;
  onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);

  // 首页引导步骤定义
  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-semibold mb-2">欢迎使用 AI 医疗诊断系统！</h2>
          <p className="text-gray-600">
            让我们快速了解系统的核心功能，只需要 1 分钟时间。
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.create-case-tab',
      content: (
        <div>
          <h3 className="font-semibold mb-2">1. 创建病例</h3>
          <p className="text-sm text-gray-600">
            点击"新增病例"标签，手动录入患者信息和病史。
            您也可以使用"导入病例"功能批量导入 TXT 文件。
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.case-list',
      content: (
        <div>
          <h3 className="font-semibold mb-2">2. 浏览病例</h3>
          <p className="text-sm text-gray-600">
            在"病例列表"中查看所有病例，点击卡片可进入详情页。
            支持搜索功能，快速定位特定病例。
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.account-switcher',
      content: (
        <div>
          <h3 className="font-semibold mb-2">3. 账号管理</h3>
          <p className="text-sm text-gray-600 mb-2">
            点击右上角头像可以：
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>查看当前用户信息和角色权限</li>
            <li>快速切换到历史登录账号</li>
            <li>安全退出登录</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-semibold mb-2">✨ 首页引导完成！</h2>
          <p className="text-gray-600 mb-3">
            接下来，请点击任意病例卡片进入详情页，我们将继续介绍 AI 诊断功能。
          </p>
          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
            <p className="text-blue-800">
              💡 提示：如果列表中没有病例，请先创建或导入一个病例。
            </p>
          </div>
        </div>
      ),
      placement: 'center',
    },
  ];

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
