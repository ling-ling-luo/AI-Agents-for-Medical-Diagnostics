"""数据分析相关API路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, date

from api.db.database import get_db
from api.auth.permissions import PermissionChecker
from api.auth.dependencies import get_current_user
from api.models.user import User
from api.utils import analytics

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# 数据分析权限检查器
require_analytics_read = PermissionChecker("analytics", "read")
require_analytics_export = PermissionChecker("analytics", "export")


@router.get("/overview")
async def get_overview(
    start_date: Optional[date] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analytics_read)
):
    """
    获取数据分析概览

    返回总病例数、总诊断数、平均执行时间、诊断完成率等关键指标

    权限要求：analytics:read
    """
    try:
        overview_data = analytics.calculate_overview(
            db=db,
            start_date=start_date,
            end_date=end_date,
            user=current_user
        )
        return {
            "success": True,
            "data": overview_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取概览数据失败: {str(e)}")


@router.get("/cases/demographics")
async def get_case_demographics(
    start_date: Optional[date] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    creator_id: Optional[int] = Query(None, description="创建者用户ID（筛选条件）"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analytics_read)
):
    """
    获取病例人口统计数据

    返回年龄分布、性别分布、年龄-性别矩阵等数据

    权限要求：analytics:read
    """
    try:
        demographics_data = analytics.calculate_case_demographics(
            db=db,
            start_date=start_date,
            end_date=end_date,
            creator_id=creator_id,
            user=current_user
        )
        return {
            "success": True,
            "data": demographics_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取人口统计数据失败: {str(e)}")


@router.get("/cases/trends")
async def get_case_trends(
    start_date: Optional[date] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    granularity: str = Query("day", description="时间粒度: day/week/month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analytics_read)
):
    """
    获取病例趋势数据（时间序列）

    返回按日/周/月聚合的病例创建趋势

    权限要求：analytics:read
    """
    try:
        if granularity not in ["day", "week", "month"]:
            raise HTTPException(status_code=400, detail="granularity 必须是 'day', 'week' 或 'month'")

        trends_data = analytics.calculate_time_series(
            db=db,
            entity_type="case",
            start_date=start_date,
            end_date=end_date,
            granularity=granularity,
            user=current_user
        )
        return {
            "success": True,
            "data": trends_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取病例趋势数据失败: {str(e)}")


@router.get("/diagnoses/performance")
async def get_diagnosis_performance(
    start_date: Optional[date] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    model_name: Optional[str] = Query(None, description="模型名称（筛选条件）"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analytics_read)
):
    """
    获取诊断性能数据

    返回执行时间统计、模型对比数据等

    权限要求：analytics:read
    """
    try:
        performance_data = analytics.calculate_model_performance(
            db=db,
            start_date=start_date,
            end_date=end_date,
            model_name=model_name,
            user=current_user
        )
        return {
            "success": True,
            "data": performance_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取诊断性能数据失败: {str(e)}")


@router.get("/diagnoses/trends")
async def get_diagnosis_trends(
    start_date: Optional[date] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    granularity: str = Query("day", description="时间粒度: day/week/month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analytics_read)
):
    """
    获取诊断趋势数据（时间序列）

    返回按日/周/月聚合的诊断执行趋势

    权限要求：analytics:read
    """
    try:
        if granularity not in ["day", "week", "month"]:
            raise HTTPException(status_code=400, detail="granularity 必须是 'day', 'week' 或 'month'")

        trends_data = analytics.calculate_time_series(
            db=db,
            entity_type="diagnosis",
            start_date=start_date,
            end_date=end_date,
            granularity=granularity,
            user=current_user
        )
        return {
            "success": True,
            "data": trends_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取诊断趋势数据失败: {str(e)}")


@router.get("/models/comparison")
async def get_model_comparison(
    start_date: Optional[date] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analytics_read)
):
    """
    获取模型对比数据

    返回各模型的使用频率、平均执行时间等对比数据

    权限要求：analytics:read
    """
    try:
        comparison_data = analytics.calculate_model_comparison(
            db=db,
            start_date=start_date,
            end_date=end_date,
            user=current_user
        )
        return {
            "success": True,
            "data": comparison_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模型对比数据失败: {str(e)}")


@router.get("/users/activity")
async def get_user_activity(
    start_date: Optional[date] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analytics_read)
):
    """
    获取用户活动统计

    返回最活跃的创建者、各用户的病例数和诊断数等

    权限要求：analytics:read（通常限制管理员或医生角色）
    """
    try:
        activity_data = analytics.calculate_user_activity(
            db=db,
            start_date=start_date,
            end_date=end_date,
            user=current_user
        )
        return {
            "success": True,
            "data": activity_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取用户活动数据失败: {str(e)}")


@router.post("/export")
async def export_analytics_report(
    report_type: str = Query(..., description="报告类型: overview/demographics/trends/performance"),
    format: str = Query("pdf", description="导出格式: pdf/excel"),
    start_date: Optional[date] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analytics_export)
):
    """
    导出数据分析报告

    支持PDF和Excel格式导出

    权限要求：analytics:export
    """
    try:
        if format not in ["pdf", "excel"]:
            raise HTTPException(status_code=400, detail="format 必须是 'pdf' 或 'excel'")

        if report_type not in ["overview", "demographics", "trends", "performance"]:
            raise HTTPException(
                status_code=400,
                detail="report_type 必须是 'overview', 'demographics', 'trends' 或 'performance'"
            )

        # TODO: 实现导出功能（阶段5）
        raise HTTPException(status_code=501, detail="导出功能将在阶段5实现")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出报告失败: {str(e)}")
