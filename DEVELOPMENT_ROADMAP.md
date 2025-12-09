# AI 医疗诊断系统 - 后续开发计划

**文档版本**: v1.0
**最后更新**: 2025-12-09
**负责人**: Development Team
**规划周期**: 2025 Q1 - Q4

---

## 📋 文档概述

本文档详细规划 AI 医疗诊断系统的后续开发任务，包括功能增强、性能优化、技术债务清理和长期架构演进。所有任务按优先级和依赖关系组织，并明确技术实现方案和验收标准。

---

## 🎯 开发目标

### 短期目标 (Q1 2025)
1. **完善核心功能**：提升用户体验，修复已知问题
2. **性能优化**：减少加载时间，提升并发处理能力
3. **移动端支持**：实现响应式设计，支持平板和手机访问
4. **测试覆盖**：单元测试覆盖率达到 70%

### 中期目标 (Q2-Q3 2025)
1. **智能化增强**：多模态输入、智能问诊、诊断解释性
2. **协作功能**：多用户评论、病例分享、专家会诊
3. **数据分析**：诊断质量分析、用户行为分析、系统监控
4. **国际化**：支持中英文切换，本地化界面

### 长期目标 (Q4 2025+)
1. **平台化**：开放 API、插件系统、多租户支持
2. **私有化部署**：支持本地 LLM 部署，降低 API 依赖
3. **AI 能力升级**：自定义智能体、知识库集成、持续学习
4. **商业化探索**：企业版、SaaS 服务、定制化开发

---

## 🗓️ 迭代规划

### Sprint 1-2 (2 周) - 用户体验优化
**时间**: 2025-01-06 ~ 2025-01-19
**目标**: 修复已知 UI 问题，提升交互流畅度

### Sprint 3-4 (2 周) - 性能优化
**时间**: 2025-01-20 ~ 2025-02-02
**目标**: 前后端性能优化，减少加载时间

### Sprint 5-6 (2 周) - 移动端支持
**时间**: 2025-02-03 ~ 2025-02-16
**目标**: 响应式设计，适配移动设备

### Sprint 7-8 (2 周) - 测试与质量保障
**时间**: 2025-02-17 ~ 2025-03-02
**目标**: 编写测试用例，提升代码质量

---

## 📊 任务优先级矩阵

| 优先级 | 标准 | 示例 |
|--------|------|------|
| **P0 (紧急)** | 阻塞核心功能、严重 Bug | 登录失败、诊断无法运行 |
| **P1 (高)** | 重要功能缺失、性能问题 | 移动端适配、慢查询优化 |
| **P2 (中)** | 用户体验提升、增强功能 | 引导提示、快捷键支持 |
| **P3 (低)** | 锦上添花功能 | 主题切换、动画效果 |

---

## 🚀 Phase 1: 用户体验优化 (Sprint 1-2)

### 1.1 首次登录引导 (P1)
**用户故事**: 作为新用户，我希望在首次登录时看到功能引导，快速了解系统使用方法。

**功能描述**:
- 欢迎弹窗：介绍系统核心功能
- 交互式引导：逐步高亮关键功能（创建病例→运行诊断→查看结果→导出报告）
- 可跳过和重新观看
- 引导完成后标记用户状态（`localStorage`）

**技术实现**:
```typescript
// 使用 react-joyride 库实现引导
import Joyride from 'react-joyride';

const steps = [
  { target: '.create-case-btn', content: '点击这里创建新病例' },
  { target: '.diagnosis-btn', content: '选择 AI 模型并开始诊断' },
  { target: '.diagnosis-result', content: '查看详细的诊断报告' },
  { target: '.export-btn', content: '导出为 PDF 或 Word 文档' }
];
```

**验收标准**:
- [ ] 新注册用户首次登录自动显示引导
- [ ] 引导支持跳过，下次登录不再显示
- [ ] 用户可在设置中重新观看引导
- [ ] 引导不干扰正常操作（可点击遮罩关闭）

**预计工时**: 2 人日

---

### 1.2 诊断结果对比功能 (P1)
**用户故事**: 作为医学研究人员，我希望对比同一病例在不同模型或不同时间的诊断结果。

**功能描述**:
- 在诊断历史页面勾选 2 条记录
- 点击"对比"按钮，打开对比视图
- 并排显示两次诊断结果（左右分栏）
- 高亮差异部分（文本 diff 算法）
- 支持切换对比对象

**技术实现**:
```typescript
// 使用 react-diff-viewer 实现文本对比
import ReactDiffViewer from 'react-diff-viewer';

<ReactDiffViewer
  oldValue={diagnosis1.result}
  newValue={diagnosis2.result}
  splitView={true}
  showDiffOnly={false}
  leftTitle={`${diagnosis1.model_name} - ${diagnosis1.timestamp}`}
  rightTitle={`${diagnosis2.model_name} - ${diagnosis2.timestamp}`}
/>
```

**数据结构**:
```typescript
interface ComparisonView {
  diagnosis1: DiagnosisHistory;
  diagnosis2: DiagnosisHistory;
  differences: DiffResult[];
}
```

**验收标准**:
- [ ] 支持选择 2 条诊断记录进行对比
- [ ] 并排显示两次诊断的完整内容
- [ ] 高亮显示文本差异（增加/删除/修改）
- [ ] 支持导出对比结果（PDF）

**预计工时**: 3 人日

---

### 1.3 智能搜索增强 (P2)
**用户故事**: 作为用户，我希望快速找到特定病例，支持模糊搜索和高级筛选。

**功能描述**:
- 全局搜索快捷键（Ctrl/Cmd + K）
- 支持搜索内容：患者姓名、主诉、诊断结果
- 实时搜索建议（下拉显示匹配结果）
- 高级筛选：按年龄范围、性别、创建时间筛选
- 搜索历史记忆（最近 5 次）

**技术实现**:
```typescript
// 使用 Fuse.js 实现模糊搜索
import Fuse from 'fuse.js';

const fuse = new Fuse(cases, {
  keys: ['patient_name', 'chief_complaint', 'diagnoses.result'],
  threshold: 0.3, // 模糊匹配阈值
  includeScore: true
});

const results = fuse.search(searchQuery);
```

**后端 API 增强**:
```python
# 添加全文搜索支持
@router.get("/api/cases/search")
async def search_cases(
    q: str,  # 搜索关键词
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    gender: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MedicalCase)

    # 关键词搜索（使用 LIKE）
    if q:
        query = query.filter(
            or_(
                MedicalCase.patient_name.contains(q),
                MedicalCase.chief_complaint.contains(q)
            )
        )

    # 年龄筛选
    if age_min:
        query = query.filter(MedicalCase.age >= age_min)
    if age_max:
        query = query.filter(MedicalCase.age <= age_max)

    # ... 其他筛选条件

    return query.all()
```

**验收标准**:
- [ ] Ctrl/Cmd + K 打开全局搜索
- [ ] 实时显示搜索建议（输入 3 个字符后）
- [ ] 支持模糊匹配（容错拼写）
- [ ] 高级筛选器正常工作
- [ ] 搜索历史可查看和重用

**预计工时**: 4 人日

---

### 1.4 批量操作优化 (P2)
**用户故事**: 作为管理员，我希望批量管理病例，提升操作效率。

**功能描述**:
- 病例列表支持多选（复选框）
- 批量操作工具栏：删除、导出、标签
- 批量删除二次确认（显示数量）
- 批量导出进度提示
- 操作成功后显示统计（成功/失败数量）

**技术实现**:
```typescript
// 状态管理
const [selectedCases, setSelectedCases] = useState<Set<number>>(new Set());

// 全选/取消全选
const handleSelectAll = () => {
  if (selectedCases.size === cases.length) {
    setSelectedCases(new Set());
  } else {
    setSelectedCases(new Set(cases.map(c => c.id)));
  }
};

// 批量删除
const handleBatchDelete = async () => {
  const result = await api.batchDeleteCases(Array.from(selectedCases));
  toast.success(`成功删除 ${result.success} 个病例`);
};
```

**后端 API**:
```python
@router.post("/api/cases/batch-delete")
async def batch_delete_cases(
    case_ids: List[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deleted_count = 0
    failed_ids = []

    for case_id in case_ids:
        try:
            case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
            if case:
                db.delete(case)
                deleted_count += 1
        except Exception as e:
            failed_ids.append(case_id)

    db.commit()

    return {
        "success": deleted_count,
        "failed": len(failed_ids),
        "failed_ids": failed_ids
    }
```

**验收标准**:
- [ ] 病例列表显示复选框
- [ ] 全选/取消全选功能正常
- [ ] 批量删除显示确认弹窗
- [ ] 批量操作显示进度和结果
- [ ] 操作失败提供错误详情

**预计工时**: 3 人日

---

### 1.5 快捷键支持 (P2)
**用户故事**: 作为高频用户，我希望使用键盘快捷键提升操作效率。

**快捷键规划**:
| 快捷键 | 功能 | 适用页面 |
|--------|------|---------|
| `Ctrl/Cmd + K` | 全局搜索 | 所有页面 |
| `Ctrl/Cmd + N` | 创建新病例 | 病例列表 |
| `Ctrl/Cmd + S` | 保存 | 编辑页面 |
| `Ctrl/Cmd + Enter` | 提交表单 | 表单页面 |
| `Esc` | 关闭弹窗/取消操作 | 所有弹窗 |
| `?` | 显示快捷键帮助 | 所有页面 |

**技术实现**:
```typescript
// 使用 react-hotkeys-hook
import { useHotkeys } from 'react-hotkeys-hook';

// 全局搜索
useHotkeys('ctrl+k, cmd+k', (e) => {
  e.preventDefault();
  setSearchOpen(true);
});

// 创建病例
useHotkeys('ctrl+n, cmd+n', () => {
  navigate('/cases/create');
}, { enableOnFormTags: false });

// 显示帮助
useHotkeys('shift+?', () => {
  setHelpModalOpen(true);
});
```

**快捷键帮助界面**:
- 按 `?` 显示所有可用快捷键
- 按页面分组显示
- 支持搜索快捷键
- 可自定义快捷键（未来功能）

**验收标准**:
- [ ] 所有快捷键正常工作
- [ ] 快捷键不与浏览器默认快捷键冲突
- [ ] 表单输入时禁用非表单快捷键
- [ ] 快捷键帮助界面清晰易懂
- [ ] 快捷键提示显示在相关按钮旁

**预计工时**: 2 人日

---

## ⚡ Phase 2: 性能优化 (Sprint 3-4)

### 2.1 前端性能优化 (P1)

#### 2.1.1 组件懒加载
**问题**: 首屏加载时间过长，加载了不必要的代码

**解决方案**:
```typescript
// 路由级别懒加载
import { lazy, Suspense } from 'react';

const CaseDetail = lazy(() => import('./components/CaseDetail'));
const DiagnosisHistory = lazy(() => import('./components/DiagnosisHistory'));

// 路由配置
<Route
  path="/case/:id"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <CaseDetail />
    </Suspense>
  }
/>
```

**优化目标**:
- 首屏 JavaScript 体积减少 40%
- 首屏加载时间 < 1 秒

---

#### 2.1.2 图片优化
**问题**: 用户头像、智能体图标加载慢

**解决方案**:
- 使用 WebP 格式（降低 30% 体积）
- 实现图片懒加载（IntersectionObserver）
- 添加占位符（BlurHash）

```typescript
import { LazyLoadImage } from 'react-lazy-load-image-component';

<LazyLoadImage
  src={imageUrl}
  alt="Patient image"
  effect="blur"
  placeholderSrc={placeholderUrl}
/>
```

---

#### 2.1.3 列表虚拟化
**问题**: 病例列表过多时滚动卡顿

**解决方案**:
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={cases.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <CaseCard case={cases[index]} />
    </div>
  )}
</FixedSizeList>
```

**适用场景**: 病例数量 > 100 时启用

---

#### 2.1.4 Bundle 分析与优化
**工具**: `vite-bundle-visualizer`

**优化项**:
- 移除未使用的依赖（检查 `node_modules`）
- Tree Shaking 优化（确保正确导入）
- 第三方库按需导入（如 lodash → lodash-es）

```bash
# 分析 bundle 大小
npm run build
npx vite-bundle-visualizer

# 优化示例：按需导入
# 之前
import _ from 'lodash';
_.debounce(fn, 300);

# 之后
import debounce from 'lodash-es/debounce';
debounce(fn, 300);
```

**验收标准**:
- [ ] 首屏 JS 体积 < 500KB (gzip 后)
- [ ] TTI (Time to Interactive) < 2 秒
- [ ] Lighthouse 性能分数 > 90

**预计工时**: 4 人日

---

### 2.2 后端性能优化 (P1)

#### 2.2.1 数据库查询优化
**问题**: 病例列表查询慢，诊断历史加载慢

**优化方案**:

1. **添加索引**:
```python
# 在 models/case.py 中添加索引
class MedicalCase(Base):
    __tablename__ = "medical_cases"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(50), index=True)  # 添加索引
    created_at = Column(DateTime, default=datetime.utcnow, index=True)  # 添加索引
```

2. **N+1 查询优化**:
```python
# 使用 joinedload 预加载关联数据
from sqlalchemy.orm import joinedload

cases = db.query(MedicalCase)\
    .options(joinedload(MedicalCase.diagnoses))\
    .all()
```

3. **分页查询优化**:
```python
# 使用 offset/limit 而非 Python 切片
def get_cases_paginated(db: Session, page: int = 1, page_size: int = 9):
    offset = (page - 1) * page_size

    cases = db.query(MedicalCase)\
        .order_by(MedicalCase.created_at.desc())\
        .offset(offset)\
        .limit(page_size)\
        .all()

    total = db.query(MedicalCase).count()

    return {
        "items": cases,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
```

**验收标准**:
- [ ] 病例列表查询 < 100ms (100 条记录)
- [ ] 病例详情查询 < 50ms
- [ ] 诊断历史查询 < 150ms (包含关联数据)

---

#### 2.2.2 Redis 缓存
**问题**: 频繁查询相同数据，数据库压力大

**缓存策略**:
```python
import redis
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_result(expire_seconds=300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 生成缓存 key
            cache_key = f"{func.__name__}:{hash(str(args))}"

            # 尝试从缓存读取
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)

            # 缓存未命中，执行函数
            result = await func(*args, **kwargs)

            # 写入缓存
            redis_client.setex(
                cache_key,
                expire_seconds,
                json.dumps(result)
            )

            return result
        return wrapper
    return decorator

# 应用缓存
@cache_result(expire_seconds=600)
@router.get("/api/cases")
async def get_cases(db: Session = Depends(get_db)):
    return db.query(MedicalCase).all()
```

**缓存失效策略**:
- 病例创建/更新/删除时清除相关缓存
- 诊断完成后清除诊断历史缓存
- 设置合理的过期时间（5-10分钟）

**验收标准**:
- [ ] 缓存命中率 > 60%
- [ ] 缓存查询 < 10ms
- [ ] 数据一致性保证（及时失效）

---

#### 2.2.3 异步任务队列
**问题**: AI 诊断、批量导出等耗时操作阻塞 API 响应

**解决方案**: 使用 Celery + Redis

```python
# celery_app.py
from celery import Celery

celery_app = Celery(
    'medical_diagnosis',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1'
)

# 诊断任务
@celery_app.task
def run_diagnosis_task(case_id: int, model_name: str):
    # 执行诊断
    result = run_multi_agent_diagnosis(case_report, model_name)

    # 保存结果到数据库
    save_diagnosis_result(case_id, result)

    return {"status": "completed", "case_id": case_id}

# API 路由
@router.post("/api/cases/{case_id}/run-diagnosis")
async def run_diagnosis(case_id: int, model: str = "gpt-4"):
    # 提交异步任务
    task = run_diagnosis_task.delay(case_id, model)

    return {
        "task_id": task.id,
        "status": "pending",
        "message": "诊断任务已提交"
    }

# 查询任务状态
@router.get("/api/tasks/{task_id}")
async def get_task_status(task_id: str):
    task = celery_app.AsyncResult(task_id)

    return {
        "task_id": task_id,
        "status": task.status,
        "result": task.result if task.ready() else None
    }
```

**前端轮询**:
```typescript
const pollTaskStatus = async (taskId: string) => {
  const interval = setInterval(async () => {
    const status = await api.getTaskStatus(taskId);

    if (status.status === 'SUCCESS') {
      clearInterval(interval);
      // 更新 UI，显示结果
      loadDiagnosisResult(status.result);
    } else if (status.status === 'FAILURE') {
      clearInterval(interval);
      // 显示错误
      showError(status.result);
    }
  }, 2000); // 每 2 秒轮询一次
};
```

**验收标准**:
- [ ] API 响应时间 < 200ms（返回任务 ID）
- [ ] 任务状态可查询
- [ ] 任务失败可重试
- [ ] 并发处理能力提升 10 倍

**预计工时**: 5 人日

---

### 2.3 数据库迁移 (P2)
**问题**: SQLite 在生产环境性能受限

**迁移方案**: SQLite → PostgreSQL

```bash
# 1. 安装 PostgreSQL 驱动
pip install psycopg2-binary

# 2. 修改数据库连接
# database.py
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/medical_diagnosis"
)

# 3. 数据迁移
# 导出 SQLite 数据
sqlite3 medical_diagnostics.db .dump > dump.sql

# 导入 PostgreSQL
psql -U user -d medical_diagnosis -f dump.sql
```

**验收标准**:
- [ ] 所有数据完整迁移
- [ ] 应用代码无需修改（ORM 抽象）
- [ ] 并发性能提升 5 倍
- [ ] 支持全文搜索（PostgreSQL FTS）

**预计工时**: 3 人日

---

## 📱 Phase 3: 移动端支持 (Sprint 5-6)

### 3.1 响应式设计 (P1)
**目标**: 适配平板（768px）和手机（375px）

**断点设计**:
```css
/* Tailwind 断点 */
- sm: 640px  (手机横屏)
- md: 768px  (平板)
- lg: 1024px (桌面)
- xl: 1280px (大屏)
```

**关键页面适配**:

#### 登录/注册页
```tsx
// 移动端：全屏表单
<div className="min-h-screen px-4 md:px-8">
  <div className="w-full max-w-md mx-auto">
    {/* 表单内容 */}
  </div>
</div>
```

#### 病例列表
```tsx
// 桌面：3 列网格
// 平板：2 列网格
// 手机：1 列列表
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {cases.map(case => <CaseCard key={case.id} case={case} />)}
</div>
```

#### 病例详情
```tsx
// 桌面：左右分栏
// 移动：垂直堆叠，标签页切换
<div className="flex flex-col lg:flex-row gap-6">
  {/* 病例内容 */}
  <div className="flex-1">...</div>

  {/* 诊断操作 */}
  <div className="w-full lg:w-96">...</div>
</div>
```

**导航优化**:
- 移动端：汉堡菜单（侧边栏抽屉）
- 平板/桌面：顶部导航栏

**验收标准**:
- [ ] 所有页面在 375px 宽度正常显示
- [ ] 触摸操作友好（按钮至少 44x44px）
- [ ] 文字可读（最小 14px）
- [ ] 横屏模式正常使用

**预计工时**: 6 人日

---

### 3.2 移动端专属功能 (P2)

#### 语音输入
**场景**: 移动端手动输入病史不便

```typescript
// 使用 Web Speech API
const SpeechInput: React.FC = () => {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'zh-CN';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // 将文本填入表单
      setValue('medical_history', transcript);
    };

    recognition.start();
    setIsListening(true);
  };

  return (
    <button onClick={startListening}>
      <Mic className={isListening ? 'text-red-500' : ''} />
    </button>
  );
};
```

#### 拍照上传
**场景**: 移动端上传病历图片

```tsx
<input
  type="file"
  accept="image/*"
  capture="environment"  // 直接打开相机
  onChange={handleImageUpload}
/>
```

**预计工时**: 4 人日

---

## 🧪 Phase 4: 测试与质量保障 (Sprint 7-8)

### 4.1 单元测试 (P1)
**目标**: 覆盖率 > 70%

#### 后端测试
```python
# test_api_cases.py
import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_create_case():
    response = client.post("/api/cases", json={
        "patient_name": "测试患者",
        "age": 35,
        "gender": "Male",
        "chief_complaint": "头痛3天",
        "medical_history": "无特殊病史"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["patient_name"] == "测试患者"

def test_get_cases_pagination():
    response = client.get("/api/cases?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
```

#### 前端测试
```typescript
// CaseList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseList } from './CaseList';

test('renders case list', async () => {
  render(<CaseList />);

  await waitFor(() => {
    expect(screen.getByText('病例列表')).toBeInTheDocument();
  });
});

test('search functionality', async () => {
  const user = userEvent.setup();
  render(<CaseList />);

  const searchInput = screen.getByPlaceholderText('搜索病例');
  await user.type(searchInput, '张三');

  await waitFor(() => {
    expect(screen.getByText('张三')).toBeInTheDocument();
  });
});
```

**测试框架**:
- 后端: pytest + pytest-cov
- 前端: Vitest + React Testing Library

**验收标准**:
- [ ] 后端核心 API 测试覆盖率 > 80%
- [ ] 前端核心组件测试覆盖率 > 70%
- [ ] CI/CD 集成，自动运行测试

**预计工时**: 8 人日

---

### 4.2 集成测试 (P2)
**目标**: 端到端流程测试

```typescript
// e2e/diagnosis-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete diagnosis flow', async ({ page }) => {
  // 1. 登录
  await page.goto('http://localhost:5173/login');
  await page.fill('input[name="username"]', 'doctor');
  await page.fill('input[name="password"]', 'doctor123');
  await page.click('button[type="submit"]');

  // 2. 创建病例
  await page.click('text=新增病例');
  await page.fill('input[name="patient_name"]', 'E2E测试患者');
  await page.fill('input[name="age"]', '45');
  await page.click('text=保存');

  // 3. 运行诊断
  await page.click('text=开始诊断');
  await page.waitForSelector('text=诊断完成', { timeout: 120000 });

  // 4. 验证结果
  await expect(page.locator('.diagnosis-result')).toBeVisible();

  // 5. 导出报告
  await page.click('text=导出');
  await page.click('text=PDF');

  // 验证下载
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toContain('.pdf');
});
```

**预计工时**: 4 人日

---

## 🚀 Phase 5: 智能化增强 (Q2 2025)

### 5.1 多模态输入 (P1)
**功能**: 上传医学影像（X光、CT、MRI）辅助诊断

**技术方案**:
- 使用 GPT-4V 或 Claude 3 的视觉能力
- OCR 识别检查报告中的文字
- 影像存储（本地文件系统或对象存储）

```python
# 处理影像输入
@router.post("/api/cases/{case_id}/upload-image")
async def upload_medical_image(
    case_id: int,
    image: UploadFile = File(...),
    image_type: str = Form(...)  # "xray", "ct", "mri"
):
    # 保存图片
    file_path = f"uploads/{case_id}/{image.filename}"
    with open(file_path, "wb") as f:
        f.write(await image.read())

    # 调用视觉模型分析
    analysis = await analyze_medical_image(file_path, image_type)

    return {
        "image_url": file_path,
        "analysis": analysis
    }
```

**预计工时**: 10 人日

---

### 5.2 智能问诊 (P1)
**功能**: AI 主动询问补充信息，提升诊断准确性

**流程设计**:
1. 用户提交病例基本信息
2. AI 分析后提出 3-5 个问题
3. 用户回答问题
4. AI 综合所有信息给出诊断

**实现示例**:
```python
def generate_follow_up_questions(medical_report: str) -> List[str]:
    prompt = f"""
    Based on the following medical report, generate 3-5 important questions
    that would help in making a more accurate diagnosis:

    {medical_report}

    Questions should be:
    - Specific and relevant
    - Easy for patients to understand
    - Focused on critical missing information
    """

    response = llm.invoke(prompt)
    questions = parse_questions(response)
    return questions
```

**前端交互**:
- 问答式界面（对话气泡）
- 支持多轮对话
- 可跳过问诊，直接诊断

**预计工时**: 12 人日

---

### 5.3 知识库集成 (P2)
**功能**: 链接权威医学文献和临床指南

**数据源**:
- PubMed 医学论文
- UpToDate 临床指南
- 医学教科书摘要

**实现方案**:
```python
# RAG (Retrieval-Augmented Generation)
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

# 构建向量数据库
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(
    documents=medical_knowledge_docs,
    embedding=embeddings
)

# 诊断时检索相关知识
def diagnose_with_knowledge(medical_report: str):
    # 检索相关文献
    relevant_docs = vectorstore.similarity_search(medical_report, k=5)

    # 构建增强的 Prompt
    prompt = f"""
    Medical Report: {medical_report}

    Relevant Medical Knowledge:
    {format_docs(relevant_docs)}

    Based on the report and medical knowledge, provide diagnosis...
    """

    return llm.invoke(prompt)
```

**预计工时**: 15 人日

---

## 🤝 Phase 6: 协作功能 (Q3 2025)

### 6.1 多用户评论 (P1)
**功能**: 医生可对诊断结果添加评论和批注

```typescript
interface Comment {
  id: number;
  diagnosis_id: number;
  user_id: number;
  content: string;
  created_at: string;
  replies: Comment[];
}

// 评论组件
<CommentSection diagnosisId={diagnosis.id}>
  <CommentList comments={comments} />
  <CommentInput onSubmit={handleAddComment} />
</CommentSection>
```

**预计工时**: 6 人日

---

### 6.2 病例分享 (P2)
**功能**: 生成分享链接，供其他用户查看

```python
@router.post("/api/cases/{case_id}/share")
async def create_share_link(
    case_id: int,
    expire_hours: int = 24,
    current_user: User = Depends(get_current_user)
):
    # 生成唯一 token
    share_token = secrets.token_urlsafe(32)

    # 存储分享记录
    share_record = ShareLink(
        case_id=case_id,
        token=share_token,
        created_by=current_user.id,
        expires_at=datetime.now() + timedelta(hours=expire_hours)
    )
    db.add(share_record)
    db.commit()

    return {
        "share_url": f"https://app.com/shared/{share_token}",
        "expires_at": share_record.expires_at
    }
```

**预计工时**: 5 人日

---

## 🌍 Phase 7: 国际化 (Q3 2025)

### 7.1 中英文切换 (P1)
**技术方案**: react-i18next

```typescript
// i18n 配置
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: require('./locales/en.json') },
      zh: { translation: require('./locales/zh.json') }
    },
    lng: 'zh',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

// 使用
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();

<button onClick={() => i18n.changeLanguage('en')}>
  {t('common.login')}
</button>
```

**翻译文件**:
```json
// locales/zh.json
{
  "common": {
    "login": "登录",
    "register": "注册",
    "logout": "退出"
  },
  "case": {
    "patient_name": "患者姓名",
    "age": "年龄",
    "gender": "性别"
  }
}

// locales/en.json
{
  "common": {
    "login": "Login",
    "register": "Register",
    "logout": "Logout"
  },
  "case": {
    "patient_name": "Patient Name",
    "age": "Age",
    "gender": "Gender"
  }
}
```

**预计工时**: 8 人日

---

## 📈 Phase 8: 数据分析 (Q4 2025)

### 8.1 管理员仪表盘 (P2)
**功能**: 系统使用情况可视化

**指标**:
- 用户活跃度（DAU/MAU）
- 病例创建趋势
- 诊断使用量（按模型统计）
- API 调用量和成本
- 系统性能指标

**技术方案**: Chart.js / Recharts

```typescript
<DashboardCard title="用户活跃度">
  <LineChart data={userActivityData}>
    <XAxis dataKey="date" />
    <YAxis />
    <Line type="monotone" dataKey="activeUsers" stroke="#2563eb" />
  </LineChart>
</DashboardCard>
```

**预计工时**: 10 人日

---

## 🔧 技术债务清理

### 待优化项 (P2)

1. **代码重构**
   - 提取重复代码为公共组件/函数
   - 统一错误处理逻辑
   - 优化组件层级（减少 prop drilling）

2. **类型安全**
   - 前端完善 TypeScript 类型定义
   - 后端添加 Pydantic 数据验证

3. **日志系统**
   - 结构化日志（JSON 格式）
   - 日志分级（DEBUG/INFO/WARNING/ERROR）
   - 集中式日志收集（ELK Stack）

4. **文档完善**
   - API 文档补充示例
   - 组件 Storybook
   - 部署文档

**预计工时**: 15 人日

---

## 📊 进度跟踪

### 工时统计

| Phase | 任务数 | 总工时 | 人员需求 | 完成时间 |
|-------|--------|--------|---------|---------|
| Phase 1 (UX) | 5 | 14 人日 | 2 人 | 2 周 |
| Phase 2 (性能) | 6 | 17 人日 | 2 人 | 2 周 |
| Phase 3 (移动端) | 2 | 10 人日 | 2 人 | 2 周 |
| Phase 4 (测试) | 2 | 12 人日 | 2 人 | 2 周 |
| Phase 5 (智能化) | 3 | 37 人日 | 3 人 | 4 周 |
| Phase 6 (协作) | 2 | 11 人日 | 2 人 | 2 周 |
| Phase 7 (国际化) | 1 | 8 人日 | 1 人 | 1 周 |
| Phase 8 (分析) | 1 | 10 人日 | 2 人 | 2 周 |
| 技术债务 | - | 15 人日 | 1 人 | 持续 |

**总计**: 约 134 人日，预计 6-8 个月完成（2-3 人团队）

---

## 🎯 里程碑

### M1: 用户体验优化 (2025-02-02)
- ✅ 首次登录引导
- ✅ 诊断结果对比
- ✅ 智能搜索
- ✅ 批量操作
- ✅ 快捷键支持

### M2: 性能优化完成 (2025-03-02)
- ✅ 前端加载时间 < 1 秒
- ✅ API 响应时间 < 200ms
- ✅ 数据库迁移至 PostgreSQL
- ✅ Redis 缓存集成
- ✅ Celery 异步任务

### M3: 移动端就绪 (2025-04-01)
- ✅ 响应式设计完成
- ✅ 移动端测试通过
- ✅ 语音输入支持
- ✅ 拍照上传功能

### M4: 智能化增强 (2025-06-01)
- ✅ 多模态输入
- ✅ 智能问诊
- ✅ 知识库集成

### M5: 协作与国际化 (2025-08-01)
- ✅ 多用户评论
- ✅ 病例分享
- ✅ 中英文切换

### M6: 数据分析与平台化 (2025-10-01)
- ✅ 管理员仪表盘
- ✅ API 开放
- ✅ 多租户支持

---

## 🚨 风险管理

### 高风险项

1. **LLM API 稳定性**
   - 风险：API 调用失败率高
   - 缓解：重试机制 + 多提供商支持 + 降级策略

2. **性能优化效果不达标**
   - 风险：优化后仍无法满足性能要求
   - 缓解：分阶段验证，及时调整方案

3. **移动端兼容性问题**
   - 风险：不同设备表现不一致
   - 缓解：真机测试 + BrowserStack 云测试

### 中风险项

1. **技术选型调整**
   - 风险：引入新技术（Redis、Celery）增加复杂度
   - 缓解：充分调研 + POC 验证 + 文档完善

2. **团队学习成本**
   - 风险：新技术学习时间长
   - 缓解：技术分享会 + 配对编程 + 代码审查

---

## 📝 附录

### 开发规范

#### 代码提交规范
```
<type>(<scope>): <subject>

<body>

<footer>
```

**type**: feat | fix | docs | style | refactor | test | chore
**scope**: 影响范围（auth, case, diagnosis）
**subject**: 简短描述

**示例**:
```
feat(diagnosis): add comparison feature for diagnosis history

- Users can now select 2 diagnoses to compare
- Side-by-side diff view with highlighted differences
- Export comparison result as PDF

Closes #123
```

#### 分支策略
- `main`: 生产环境代码
- `develop`: 开发主分支
- `feature/*`: 功能分支
- `bugfix/*`: Bug 修复分支
- `release/*`: 发布分支

#### Code Review 清单
- [ ] 代码符合规范（ESLint/Pylint 通过）
- [ ] 功能完整实现
- [ ] 单元测试通过
- [ ] 性能测试通过（如适用）
- [ ] 文档已更新
- [ ] 无安全漏洞
- [ ] 无明显技术债务

---

### 参考资料

- **性能优化**: https://web.dev/performance/
- **React 最佳实践**: https://react.dev/learn/
- **FastAPI 性能优化**: https://fastapi.tiangolo.com/advanced/
- **PostgreSQL 调优**: https://wiki.postgresql.org/wiki/Performance_Optimization
- **移动端设计**: https://material.io/design

---

**文档状态**: ✅ 已审核
**下次审查**: 每月 1 日
**负责人**: 开发团队
**反馈渠道**: GitHub Issues / 团队例会
