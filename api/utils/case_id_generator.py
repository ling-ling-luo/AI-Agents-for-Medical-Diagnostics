"""
病例编号生成器

生成格式：年月日时分（12位数字） + 性别（1位：男1女0） + 年龄（2位）
示例：202512111530155  表示 2025年12月11日15:30 + 男(1) + 55岁
"""
from datetime import datetime


def generate_case_id(gender: str, age: int, timestamp: datetime = None) -> str:
    """
    生成病例编号

    Args:
        gender: 性别，可选值："male"/"female"/"男"/"女" 或其他
        age: 年龄
        timestamp: 时间戳（如果不提供则使用当前时间）

    Returns:
        病例编号字符串，格式：YYYYMMDDHHmm + 性别(1/0) + 年龄(2位)

    Examples:
        >>> generate_case_id("male", 55, datetime(2025, 12, 11, 15, 30))
        '202512111530155'
        >>> generate_case_id("female", 28, datetime(2025, 12, 11, 15, 30))
        '202512111530028'
    """
    if timestamp is None:
        timestamp = datetime.now()

    # 格式化时间：YYYYMMDDHHmm (12位)
    time_part = timestamp.strftime("%Y%m%d%H%M")

    # 性别代码：男1，女0，其他情况默认为9
    gender_code = "9"  # 默认值
    if gender:
        gender_lower = gender.lower()
        if gender_lower in ["male", "男", "m"]:
            gender_code = "1"
        elif gender_lower in ["female", "女", "f"]:
            gender_code = "0"

    # 年龄：补齐为2位数字
    age_part = str(age).zfill(2)

    # 组合：时间(12) + 性别(1) + 年龄(2) = 15位
    case_id = f"{time_part}{gender_code}{age_part}"

    return case_id


def parse_case_id(case_id: str) -> dict:
    """
    解析病例编号（用于调试和验证）

    Args:
        case_id: 病例编号

    Returns:
        包含解析结果的字典
    """
    if len(case_id) != 15:
        return {"error": "无效的病例编号长度"}

    try:
        year = case_id[0:4]
        month = case_id[4:6]
        day = case_id[6:8]
        hour = case_id[8:10]
        minute = case_id[10:12]
        gender_code = case_id[12]
        age = case_id[13:15]

        gender_map = {"1": "男", "0": "女", "9": "未知"}

        return {
            "timestamp": f"{year}-{month}-{day} {hour}:{minute}",
            "gender": gender_map.get(gender_code, "未知"),
            "age": int(age),
            "raw": case_id
        }
    except Exception as e:
        return {"error": f"解析失败: {str(e)}"}


if __name__ == "__main__":
    # 测试
    from datetime import datetime

    test_time = datetime(2025, 12, 11, 15, 30, 45)

    # 测试生成
    print("测试病例编号生成：")
    print(f"男性，55岁: {generate_case_id('male', 55, test_time)}")
    print(f"女性，28岁: {generate_case_id('female', 28, test_time)}")
    print(f"男，35岁: {generate_case_id('男', 35, test_time)}")
    print(f"女，8岁: {generate_case_id('女', 8, test_time)}")

    # 测试解析
    print("\n测试病例编号解析：")
    case_id = generate_case_id('male', 55, test_time)
    print(f"原始编号: {case_id}")
    print(f"解析结果: {parse_case_id(case_id)}")
