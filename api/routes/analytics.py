"""数据分析相关API路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, date

from api.db.database import get_db
from api.auth.permissions import PermissionChecker
from api.auth.dependencies import get_current_user
from api.models.user import User
from api.utils import analytics
from api.utils.analytics_export import AnalyticsExporter

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
    report_types: str = Query(..., description="报告类型，逗号分隔: overview,demographics,trends,models,users"),
    format: str = Query("pdf", description="导出格式: pdf/excel"),
    start_date: Optional[date] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analytics_export)
):
    """
    导出数据分析报告（支持多个报告类型合并到一个文件）

    支持PDF和Excel格式导出

    权限要求：analytics:export
    """
    try:
        if format not in ["pdf", "excel"]:
            raise HTTPException(status_code=400, detail="format 必须是 'pdf' 或 'excel'")

        # 解析报告类型列表
        valid_types = {"overview", "demographics", "trends", "models", "users"}
        type_list = [t.strip() for t in report_types.split(",") if t.strip()]

        for t in type_list:
            if t not in valid_types:
                raise HTTPException(
                    status_code=400,
                    detail=f"无效的报告类型: {t}。有效类型: {', '.join(valid_types)}"
                )

        if not type_list:
            raise HTTPException(status_code=400, detail="至少需要选择一个报告类型")

        # 收集所需数据
        data = {}

        if "overview" in type_list:
            data["overview"] = analytics.calculate_overview(
                db=db, start_date=start_date, end_date=end_date, user=current_user
            )

        if "demographics" in type_list:
            data["demographics"] = analytics.calculate_case_demographics(
                db=db, start_date=start_date, end_date=end_date, user=current_user
            )

        if "trends" in type_list:
            data["trends"] = {
                "case_trends": analytics.calculate_time_series(
                    db=db, entity_type="case", start_date=start_date, end_date=end_date, user=current_user
                ),
                "diagnosis_trends": analytics.calculate_time_series(
                    db=db, entity_type="diagnosis", start_date=start_date, end_date=end_date, user=current_user
                ),
                "performance": analytics.calculate_model_performance(
                    db=db, start_date=start_date, end_date=end_date, user=current_user
                )
            }

        if "models" in type_list:
            data["models"] = analytics.calculate_model_comparison(
                db=db, start_date=start_date, end_date=end_date, user=current_user
            )

        if "users" in type_list:
            data["users"] = analytics.calculate_user_activity(
                db=db, start_date=start_date, end_date=end_date, user=current_user
            )

        # 生成报告
        exporter = AnalyticsExporter()
        filename = f"analytics_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        if format == "pdf":
            file_bytes = exporter.export_combined_pdf(type_list, data, start_date, end_date)
            filename += ".pdf"
            media_type = "application/pdf"
        else:
            file_bytes = exporter.export_combined_excel(type_list, data, start_date, end_date)
            filename += ".xlsx"
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        return Response(
            content=file_bytes,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出报告失败: {str(e)}")
