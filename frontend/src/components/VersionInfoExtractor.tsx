import { useMemo, useState } from 'react';
import { downloadBlob } from '../utils/download';
import {
  Sparkles,
  ClipboardCopy,
  Download,
  CalendarDays,
  GitCommit,
  Package,
  BarChart3,
  BookOpenText,
  CheckCircle2,
} from 'lucide-react';

interface ExtractionResult {
  version: string;
  releaseDate: string;
  commitId: string;
  artifacts: string[];
  stats: {
    features: number;
    fixes: number;
    contributors: number;
  };
}

const initialResult: ExtractionResult = {
  version: '--',
  releaseDate: '--',
  commitId: '--',
  artifacts: [],
  stats: {
    features: 0,
    fixes: 0,
    contributors: 0,
  },
};

const sampleReleaseNote = `AI Diagnostics v2.4.0
Release Date: 2024-11-02
Commit: 8f2a4bd (main)

Highlights
- Added cardiology risk ladder
- Improved pulmonology triage pipeline

Fixes
- Patched duplicate patient export bug
- Fixed PDF exporter crash (#982)

Artifacts
- ai-diagnostics-v2.4.0-linux.tar.gz
- ai-diagnostics-v2.4.0-macos.zip
- ai-diagnostics-v2.4.0-win.exe

Statistics
Features: 6
Fixes: 9
Contributors: 14`;

const parseArtifacts = (text: string) => {
  const artifactRegex = /(\w[\w.-]+\.(?:zip|tar\.gz|tgz|exe|deb|rpm|apk))/gi;
  const matches = text.match(artifactRegex);
  if (!matches) return [];
  return Array.from(new Set(matches));
};

const parseStatsValue = (text: string, label: string) => {
  const regex = new RegExp(`${label}\\s*:?\\s*(\\d+)`, 'i');
  const match = text.match(regex);
  return match ? Number(match[1]) : 0;
};

const parseVersion = (text: string) => {
  const regex = /(v?\d+\.\d+(?:\.\d+)?(?:-rc\d+)?)/i;
  const match = text.match(regex);
  return match ? match[1] : '--';
};

const parseDate = (text: string) => {
  const regex = /(\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/;
  const match = text.match(regex);
  return match ? match[1] : '--';
};

const parseCommit = (text: string) => {
  const regex = /commit[:\s]+([a-f0-9]{6,40})/i;
  const match = text.match(regex);
  return match ? match[1] : '--';
};

export const VersionInfoExtractor = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ExtractionResult>(initialResult);
  const [status, setStatus] = useState('等待分析');
  const [isCopied, setIsCopied] = useState(false);

  const hasExtraction = useMemo(() => {
    return (
      result.version !== '--' ||
      result.releaseDate !== '--' ||
      result.commitId !== '--' ||
      result.artifacts.length > 0
    );
  }, [result]);

  const handleExtract = () => {
    const workingText = input.trim() || sampleReleaseNote;
    const artifacts = parseArtifacts(workingText);
    const extraction: ExtractionResult = {
      version: parseVersion(workingText),
      releaseDate: parseDate(workingText),
      commitId: parseCommit(workingText),
      artifacts: artifacts.slice(0, 4),
      stats: {
        features: parseStatsValue(workingText, 'features'),
        fixes: parseStatsValue(workingText, 'fixes'),
        contributors: parseStatsValue(workingText, 'contributors'),
      },
    };

    setResult(extraction);
    setStatus('提取完成');
    setIsCopied(false);
  };

  const handleCopy = async () => {
    const payload = JSON.stringify(result, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      setIsCopied(true);
      setStatus('已复制到剪贴板');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
      setStatus('无法复制，请手动选择文本');
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${result.version || 'version-info'}.json`);
    setStatus('已导出 JSON 文件');
  };

  return (
    <div className="version-page">
      <div className="version-header card">
        <div className="header-pill">
          <Sparkles className="icon" />
          多端兼容 · 智能提取
        </div>
        <h1>版本信息提取工具</h1>
        <p>粘贴版本发布说明，自动提取版本号、发布时间、Commit ID、产物包及关键统计信息。</p>
        <div className="status-chip">
          <CheckCircle2 className="icon" />
          {status}
        </div>
      </div>

      <div className="version-layout">
        <section className="version-section card">
          <div className="section-heading">
            <BookOpenText className="icon" />
            <div>
              <h2>输入发布说明</h2>
              <span>支持中英文混合描述，自动识别关键字段</span>
            </div>
          </div>
          <textarea
            className="version-textarea"
            placeholder="粘贴版本公告、变更日志或发布邮件..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={16}
          />
          <div className="input-actions">
            <button type="button" className="ghost-btn" onClick={() => setInput(sampleReleaseNote)}>
              使用示例文案
            </button>
            <button type="button" className="primary-btn" onClick={handleExtract}>
              <Sparkles className="icon" />
              提取版本信息
            </button>
          </div>
          <p className="helper-text">
            建议包含：版本号、发布日期、提交哈希、产物包列表以及统计信息。系统会自动补全缺失字段。
          </p>
        </section>

        <section className="version-section card result-section">
          <div className="section-heading">
            <BarChart3 className="icon" />
            <div>
              <h2>提取结果</h2>
              <span>{hasExtraction ? '已根据输入内容生成结构化结果' : '即将展示提取数据'}</span>
            </div>
          </div>

          <div className="result-grid">
            <article className="result-card accent">
              <div className="result-icon primary">
                <Sparkles className="icon" />
              </div>
              <p className="label">版本号</p>
              <h3>{result.version}</h3>
            </article>

            <article className="result-card">
              <div className="result-icon">
                <CalendarDays className="icon" />
              </div>
              <p className="label">发布时间</p>
              <h3>{result.releaseDate}</h3>
            </article>

            <article className="result-card">
              <div className="result-icon">
                <GitCommit className="icon" />
              </div>
              <p className="label">Commit ID</p>
              <h3>{result.commitId}</h3>
            </article>

            <article className="result-card span-2">
              <div className="result-icon">
                <Package className="icon" />
              </div>
              <p className="label">产物包</p>
              {result.artifacts.length > 0 ? (
                <ul>
                  {result.artifacts.map((artifact) => (
                    <li key={artifact}>{artifact}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty">未检测到产物包</p>
              )}
            </article>

            <article className="result-card span-2">
              <div className="result-icon">
                <BarChart3 className="icon" />
              </div>
              <p className="label">统计信息</p>
              <div className="stats-chip">
                <div>
                  <span>新增功能</span>
                  <strong>{result.stats.features}</strong>
                </div>
                <div>
                  <span>问题修复</span>
                  <strong>{result.stats.fixes}</strong>
                </div>
                <div>
                  <span>贡献者</span>
                  <strong>{result.stats.contributors}</strong>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>

      <div className="version-action card">
        <div>
          <h3>导出操作</h3>
          <p>将提取结果复制到剪贴板或导出为结构化 JSON 文件，方便与其他系统联动。</p>
        </div>
        <div className="action-buttons">
          <button type="button" className="ghost-btn" onClick={handleCopy}>
            <ClipboardCopy className="icon" />
            {isCopied ? '已复制' : '复制结果'}
          </button>
          <button type="button" className="primary-btn" onClick={handleExport}>
            <Download className="icon" />
            导出 JSON
          </button>
        </div>
      </div>
    </div>
  );
};
