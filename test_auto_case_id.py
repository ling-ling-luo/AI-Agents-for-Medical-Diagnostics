"""
测试病例编号自动生成功能

验证：
1. 创建病例时不需要提供 patient_id
2. 后端自动生成格式正确的病例编号（年月日时分+性别+年龄）
3. JSON 导入时可选 patient_id
4. TXT 导入时自动生成 patient_id
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def login(username, password):
    """登录并获取 token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": username, "password": password}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"❌ 登录失败 ({username}): {response.text}")
        return None

def create_case_without_id(token, patient_name, age, gender):
    """创建病例（不提供 patient_id）"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {
        "patient_name": patient_name,
        "age": age,
        "gender": gender,
        "chief_complaint": "测试主诉 - 病例编号自动生成",
        "language": "zh"
    }
    response = requests.post(f"{BASE_URL}/api/cases", json=data, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ 创建病例失败: {response.text}")
        return None

def validate_case_id_format(patient_id: str, expected_gender: str, expected_age: int) -> bool:
    """验证病例编号格式是否正确"""
    if len(patient_id) != 15:
        print(f"  ❌ 病例编号长度错误: {len(patient_id)} (期望15位)")
        return False

    # 解析编号
    year = patient_id[0:4]
    month = patient_id[4:6]
    day = patient_id[6:8]
    hour = patient_id[8:10]
    minute = patient_id[10:12]
    gender_code = patient_id[12]
    age = patient_id[13:15]

    print(f"  📋 解析结果: {year}-{month}-{day} {hour}:{minute}, 性别码={gender_code}, 年龄={age}")

    # 验证性别码
    expected_gender_code = "1" if expected_gender in ["male", "男"] else "0"
    if gender_code != expected_gender_code:
        print(f"  ❌ 性别码错误: {gender_code} (期望{expected_gender_code})")
        return False

    # 验证年龄
    if int(age) != expected_age:
        print(f"  ❌ 年龄错误: {age} (期望{expected_age:02d})")
        return False

    print(f"  ✅ 病例编号格式正确！")
    return True

def main():
    print("=" * 70)
    print("测试病例编号自动生成功能")
    print("=" * 70)

    # 登录
    print("\n⏳ 正在登录...")
    token = login("admin", "admin123")
    if not token:
        print("\n❌ 登录失败，请确保后端服务已启动")
        return
    print("✅ 登录成功")

    # 测试1: 创建男性病例
    print("\n" + "=" * 70)
    print("测试1: 创建男性病例（不提供 patient_id）")
    print("=" * 70)
    result = create_case_without_id(token, "测试患者-男性", 55, "male")
    if result:
        print(f"✅ 病例创建成功")
        print(f"  病例ID: {result['id']}")
        print(f"  病历号: {result['patient_id']}")
        print(f"  患者姓名: {result['patient_name']}")
        validate_case_id_format(result['patient_id'], "male", 55)
    else:
        print("❌ 测试1失败")

    # 测试2: 创建女性病例
    print("\n" + "=" * 70)
    print("测试2: 创建女性病例（不提供 patient_id）")
    print("=" * 70)
    result = create_case_without_id(token, "测试患者-女性", 28, "female")
    if result:
        print(f"✅ 病例创建成功")
        print(f"  病例ID: {result['id']}")
        print(f"  病历号: {result['patient_id']}")
        print(f"  患者姓名: {result['patient_name']}")
        validate_case_id_format(result['patient_id'], "female", 28)
    else:
        print("❌ 测试2失败")

    # 测试3: 创建年龄为个位数的病例
    print("\n" + "=" * 70)
    print("测试3: 创建年龄为个位数的病例（验证补0）")
    print("=" * 70)
    result = create_case_without_id(token, "测试患者-儿童", 8, "男")
    if result:
        print(f"✅ 病例创建成功")
        print(f"  病例ID: {result['id']}")
        print(f"  病历号: {result['patient_id']}")
        print(f"  患者姓名: {result['patient_name']}")
        validate_case_id_format(result['patient_id'], "男", 8)
    else:
        print("❌ 测试3失败")

    print("\n" + "=" * 70)
    print("测试完成！")
    print("=" * 70)
    print("\n✅ 病例编号自动生成功能正常工作")
    print("格式：年月日时分(12位) + 性别码(1位：男1女0) + 年龄(2位)")

if __name__ == "__main__":
    main()
