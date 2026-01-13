"""数据分析工具函数：数据聚合和统计计算"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract, case as sql_case
from typing import Optional, Dict, List, Any
from datetime import datetime, date, timedelta
from collections import defaultdict

from api.models.case import MedicalCase, DiagnosisHistory
from api.models.user import User


def _apply_date_filter(query, date_column, start_date: Optional[date], end_date: Optional[date]):
    """应用日期范围过滤（通用工具函数）"""
    if start_date:
        query = query.filter(date_column >= start_date)
    if end_date:
        # 包含结束日期当天的所有数据
        query = query.filter(date_column < (end_date + timedelta(days=1)))
    return query


def _apply_case_access_filter(query, user: User):
    """
    根据用户权限过滤病例数据
    - 超级管理员和admin角色：查看所有数据
    - 医生角色：查看所有数据
    - 普通用户：仅查看自己创建的数据
    """
    # 超级管理员可以看所有数据
    if user.is_superuser:
        return query

    # 检查用户角色
    user_roles = [role.name for role in user.roles if role.is_active]

    # admin和doctor角色可以看所有数据
    if "admin" in user_roles or "doctor" in user_roles:
        return query

    # 普通用户只能看自己创建的数据
    return query.filter(MedicalCase.created_by == user.id)


def calculate_overview(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user: User = None
) -> Dict[str, Any]:
    """
    计算概览数据

    Returns:
        {
            "total_cases": int,  # 总病例数
            "total_diagnoses": int,  # 总诊断数
            "avg_execution_time_ms": float,  # 平均执行时间（毫秒）
            "completion_rate": float,  # 诊断完成率（0-100）
            "active_users": int,  # 活跃用户数
            "date_range": {"start": str, "end": str}  # 实际数据日期范围
        }
    """
    # 病例查询
    case_query = db.query(MedicalCase)
    case_query = _apply_date_filter(case_query, MedicalCase.created_at, start_date, end_date)
    if user:
        case_query = _apply_case_access_filter(case_query, user)

    total_cases = case_query.count()

    # 获取有权访问的病例ID列表（用于诊断历史过滤）
    accessible_case_ids = [c.id for c in case_query.with_entities(MedicalCase.id).all()]

    # 诊断查询（只统计用户有权访问的病例的诊断）
    diagnosis_query = db.query(DiagnosisHistory).filter(
        DiagnosisHistory.case_id.in_(accessible_case_ids) if accessible_case_ids else False
    )
    diagnosis_query = _apply_date_filter(diagnosis_query, DiagnosisHistory.run_timestamp, start_date, end_date)

    total_diagnoses = diagnosis_query.count()

    # 平均执行时间
    avg_exec_time = diagnosis_query.with_entities(
        func.avg(DiagnosisHistory.execution_time_ms)
    ).scalar()
    avg_execution_time_ms = round(float(avg_exec_time), 2) if avg_exec_time else 0.0

    # 诊断完成率：有诊断的病例数 / 总病例数
    cases_with_diagnosis = db.query(MedicalCase.id).filter(
        MedicalCase.id.in_(accessible_case_ids) if accessible_case_ids else False
    ).join(DiagnosisHistory).distinct().count()

    completion_rate = round((cases_with_diagnosis / total_cases * 100), 2) if total_cases > 0 else 0.0

    # 活跃用户数（创建过病例的用户）
    active_users = db.query(MedicalCase.created_by).filter(
        MedicalCase.created_by.isnot(None),
        MedicalCase.id.in_(accessible_case_ids) if accessible_case_ids else False
    ).distinct().count()

    # 实际数据日期范围
    date_range_query = case_query.with_entities(
        func.min(MedicalCase.created_at),
        func.max(MedicalCase.created_at)
    ).first()

    date_range = {
        "start": date_range_query[0].date().isoformat() if date_range_query[0] else None,
        "end": date_range_query[1].date().isoformat() if date_range_query[1] else None
    }

    return {
        "total_cases": total_cases,
        "total_diagnoses": total_diagnoses,
        "avg_execution_time_ms": avg_execution_time_ms,
        "completion_rate": completion_rate,
        "active_users": active_users,
        "date_range": date_range
    }


def calculate_case_demographics(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    creator_id: Optional[int] = None,
    user: User = None
) -> Dict[str, Any]:
    """
    计算病例人口统计数据

    Returns:
        {
            "age_distribution": [{"age_group": str, "count": int}, ...],
            "gender_distribution": [{"gender": str, "count": int}, ...],
            "age_gender_matrix": [[age_group, gender, count], ...]
        }
    """
    # 基础查询
    query = db.query(MedicalCase)
    query = _apply_date_filter(query, MedicalCase.created_at, start_date, end_date)

    if creator_id:
        query = query.filter(MedicalCase.created_by == creator_id)

    if user:
        query = _apply_case_access_filter(query, user)

    # 获取所有符合条件的病例
    cases = query.all()

    # 年龄分布（按年龄段分组：0-10, 11-20, ..., 90+）
    age_counts = defaultdict(int)
    for case in cases:
        if case.age is None:
            age_group = "未知"
        elif case.age < 10:
            age_group = "0-10"
        elif case.age < 20:
            age_group = "11-20"
        elif case.age < 30:
            age_group = "21-30"
        elif case.age < 40:
            age_group = "31-40"
        elif case.age < 50:
            age_group = "41-50"
        elif case.age < 60:
            age_group = "51-60"
        elif case.age < 70:
            age_group = "61-70"
        elif case.age < 80:
            age_group = "71-80"
        elif case.age < 90:
            age_group = "81-90"
        else:
            age_group = "90+"
        age_counts[age_group] += 1

    age_distribution = [{"age_group": ag, "count": cnt} for ag, cnt in age_counts.items()]

    # 性别标准化映射（将各种形式统一为英文小写）
    def normalize_gender(g: str) -> str:
        if not g:
            return "unknown"
        g_lower = g.lower().strip()
        if g_lower in ("male", "男", "m", "男性"):
            return "male"
        elif g_lower in ("female", "女", "f", "女性"):
            return "female"
        elif g_lower in ("unknown", "未知", ""):
            return "unknown"
        else:
            return "other"

    # 性别分布
    gender_counts = defaultdict(int)
    for case in cases:
        gender = normalize_gender(case.gender)
        gender_counts[gender] += 1

    gender_distribution = [{"gender": g, "count": cnt} for g, cnt in gender_counts.items()]

    # 年龄-性别矩阵（热力图数据）
    age_gender_counts = defaultdict(int)
    for case in cases:
        if case.age is None:
            age_group = "未知"
        elif case.age < 10:
            age_group = "0-10"
        elif case.age < 20:
            age_group = "11-20"
        elif case.age < 30:
            age_group = "21-30"
        elif case.age < 40:
            age_group = "31-40"
        elif case.age < 50:
            age_group = "41-50"
        elif case.age < 60:
            age_group = "51-60"
        elif case.age < 70:
            age_group = "61-70"
        elif case.age < 80:
            age_group = "71-80"
        elif case.age < 90:
            age_group = "81-90"
        else:
            age_group = "90+"
        gender = normalize_gender(case.gender)
        age_gender_counts[(age_group, gender)] += 1

    age_gender_data = [[ag, g, cnt] for (ag, g), cnt in age_gender_counts.items()]

    return {
        "age_distribution": age_distribution,
        "gender_distribution": gender_distribution,
        "age_gender_matrix": age_gender_data
    }


def calculate_time_series(
    db: Session,
    entity_type: str,  # "case" 或 "diagnosis"
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    granularity: str = "day",  # "day", "week", "month"
    user: User = None
) -> Dict[str, Any]:
    """
    计算时间序列数据（趋势分析）

    Returns:
        {
            "series": [{"date": str, "count": int}, ...],
            "granularity": str
        }
    """
    if entity_type == "case":
        query = db.query(MedicalCase)
        date_column = MedicalCase.created_at

        query = _apply_date_filter(query, date_column, start_date, end_date)
        if user:
            query = _apply_case_access_filter(query, user)

    elif entity_type == "diagnosis":
        # 先获取用户可访问的病例ID
        case_query = db.query(MedicalCase)
        if user:
            case_query = _apply_case_access_filter(case_query, user)
        accessible_case_ids = [c.id for c in case_query.with_entities(MedicalCase.id).all()]

        query = db.query(DiagnosisHistory).filter(
            DiagnosisHistory.case_id.in_(accessible_case_ids) if accessible_case_ids else False
        )
        date_column = DiagnosisHistory.run_timestamp

        query = _apply_date_filter(query, date_column, start_date, end_date)
    else:
        raise ValueError("entity_type 必须是 'case' 或 'diagnosis'")

    # 根据粒度聚合
    if granularity == "day":
        time_series = query.with_entities(
            func.date(date_column).label("period"),
            func.count().label("count")
        ).group_by("period").order_by("period").all()

    elif granularity == "week":
        # 按周聚合（ISO周）
        time_series = query.with_entities(
            func.strftime('%Y-W%W', date_column).label("period"),
            func.count().label("count")
        ).group_by("period").order_by("period").all()

    elif granularity == "month":
        # 按月聚合
        time_series = query.with_entities(
            func.strftime('%Y-%m', date_column).label("period"),
            func.count().label("count")
        ).group_by("period").order_by("period").all()
    else:
        raise ValueError("granularity 必须是 'day', 'week' 或 'month'")

    series_data = [{"date": str(period), "count": count} for period, count in time_series]

    return {
        "series": series_data,
        "granularity": granularity
    }


def calculate_model_performance(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    model_name: Optional[str] = None,
    user: User = None
) -> Dict[str, Any]:
    """
    计算模型性能数据

    Returns:
        {
            "execution_time_stats": {
                "min": float,
                "max": float,
                "avg": float,
                "median": float
            },
            "total_diagnoses": int
        }
    """
    # 先获取用户可访问的病例ID
    case_query = db.query(MedicalCase)
    if user:
        case_query = _apply_case_access_filter(case_query, user)
    accessible_case_ids = [c.id for c in case_query.with_entities(MedicalCase.id).all()]

    query = db.query(DiagnosisHistory).filter(
        DiagnosisHistory.case_id.in_(accessible_case_ids) if accessible_case_ids else False
    )
    query = _apply_date_filter(query, DiagnosisHistory.run_timestamp, start_date, end_date)

    if model_name:
        query = query.filter(DiagnosisHistory.model_name == model_name)

    # 执行时间统计
    stats = query.with_entities(
        func.min(DiagnosisHistory.execution_time_ms).label("min"),
        func.max(DiagnosisHistory.execution_time_ms).label("max"),
        func.avg(DiagnosisHistory.execution_time_ms).label("avg")
    ).first()

    # 中位数（SQLite不支持PERCENTILE，需要手动计算）
    execution_times = [d.execution_time_ms for d in query.all() if d.execution_time_ms is not None]
    execution_times.sort()
    median = execution_times[len(execution_times) // 2] if execution_times else 0

    total_diagnoses = query.count()

    return {
        "execution_time_stats": {
            "min": float(stats.min) if stats.min else 0.0,
            "max": float(stats.max) if stats.max else 0.0,
            "avg": round(float(stats.avg), 2) if stats.avg else 0.0,
            "median": float(median)
        },
        "total_diagnoses": total_diagnoses
    }


def calculate_model_comparison(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user: User = None
) -> Dict[str, Any]:
    """
    计算模型对比数据

    Returns:
        {
            "models": [
                {
                    "model_name": str,
                    "usage_count": int,
                    "avg_execution_time_ms": float
                },
                ...
            ]
        }
    """
    # 先获取用户可访问的病例ID
    case_query = db.query(MedicalCase)
    if user:
        case_query = _apply_case_access_filter(case_query, user)
    accessible_case_ids = [c.id for c in case_query.with_entities(MedicalCase.id).all()]

    query = db.query(DiagnosisHistory).filter(
        DiagnosisHistory.case_id.in_(accessible_case_ids) if accessible_case_ids else False
    )
    query = _apply_date_filter(query, DiagnosisHistory.run_timestamp, start_date, end_date)

    # 按模型分组统计
    model_stats = query.with_entities(
        DiagnosisHistory.model_name,
        func.count(DiagnosisHistory.id).label("usage_count"),
        func.avg(DiagnosisHistory.execution_time_ms).label("avg_execution_time_ms")
    ).group_by(DiagnosisHistory.model_name).all()

    models_data = [
        {
            "model_name": model_name,
            "usage_count": usage_count,
            "avg_execution_time_ms": round(float(avg_time), 2) if avg_time else 0.0
        }
        for model_name, usage_count, avg_time in model_stats
    ]

    # 按使用次数降序排序
    models_data.sort(key=lambda x: x["usage_count"], reverse=True)

    return {
        "models": models_data
    }


def calculate_user_activity(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user: User = None
) -> Dict[str, Any]:
    """
    计算用户活动统计

    Returns:
        {
            "top_creators": [
                {
                    "user_id": int,
                    "username": str,
                    "full_name": str,
                    "case_count": int,
                    "diagnosis_count": int
                },
                ...
            ]
        }
    """
    # 基础查询
    case_query = db.query(MedicalCase)
    case_query = _apply_date_filter(case_query, MedicalCase.created_at, start_date, end_date)
    if user:
        case_query = _apply_case_access_filter(case_query, user)

    # 按创建者统计病例数
    case_counts = case_query.filter(
        MedicalCase.created_by.isnot(None)
    ).with_entities(
        MedicalCase.created_by,
        func.count(MedicalCase.id).label("case_count")
    ).group_by(MedicalCase.created_by).all()

    case_count_dict = {creator_id: count for creator_id, count in case_counts}

    # 获取用户可访问的病例ID
    accessible_case_ids = [c.id for c in case_query.with_entities(MedicalCase.id).all()]

    # 按创建者统计诊断数（通过病例关联）
    diagnosis_counts = db.query(
        MedicalCase.created_by,
        func.count(DiagnosisHistory.id).label("diagnosis_count")
    ).join(
        DiagnosisHistory, MedicalCase.id == DiagnosisHistory.case_id
    ).filter(
        MedicalCase.created_by.isnot(None),
        MedicalCase.id.in_(accessible_case_ids) if accessible_case_ids else False
    ).group_by(MedicalCase.created_by).all()

    diagnosis_count_dict = {creator_id: count for creator_id, count in diagnosis_counts}

    # 合并数据并获取用户信息
    user_ids = set(case_count_dict.keys()) | set(diagnosis_count_dict.keys())
    users = db.query(User).filter(User.id.in_(user_ids)).all()

    top_creators = []
    for u in users:
        top_creators.append({
            "user_id": u.id,
            "username": u.username,
            "full_name": u.full_name or u.username,
            "case_count": case_count_dict.get(u.id, 0),
            "diagnosis_count": diagnosis_count_dict.get(u.id, 0)
        })

    # 按病例数降序排序
    top_creators.sort(key=lambda x: x["case_count"], reverse=True)

    return {
        "top_creators": top_creators
    }
