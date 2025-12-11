"""
测试用户权限功能

验证：
1. admin 和 doctor 可以看到所有病例
2. viewer 只能看到自己创建的病例
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

def get_cases(token):
    """获取病例列表"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/cases", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ 获取病例失败: {response.text}")
        return []

def create_case(token, patient_id, patient_name):
    """创建病例"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {
        "patient_id": patient_id,
        "patient_name": patient_name,
        "age": 30,
        "gender": "male",
        "chief_complaint": "测试主诉",
        "language": "zh"
    }
    response = requests.post(f"{BASE_URL}/api/cases", json=data, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ 创建病例失败: {response.text}")
        return None

def test_case_access(viewer_token, doctor_token, viewer_case_id, doctor_case_id):
    """测试跨用户访问病例"""
    print("\n⏳ 测试跨用户访问...")

    # Viewer 尝试访问 Doctor 的病例
    headers = {"Authorization": f"Bearer {viewer_token}"}
    response = requests.get(f"{BASE_URL}/api/cases/{doctor_case_id}", headers=headers)
    if response.status_code == 403:
        print("✅ Viewer 无法访问 Doctor 的病例 (403)")
    else:
        print(f"❌ Viewer 可以访问 Doctor 的病例 ({response.status_code})")

    # Doctor 尝试访问 Viewer 的病例
    headers = {"Authorization": f"Bearer {doctor_token}"}
    response = requests.get(f"{BASE_URL}/api/cases/{viewer_case_id}", headers=headers)
    if response.status_code == 200:
        print("✅ Doctor 可以访问 Viewer 的病例")
    else:
        print(f"❌ Doctor 无法访问 Viewer 的病例 ({response.status_code})")

def main():
    print("=" * 70)
    print("测试用户权限系统（新版本）")
    print("=" * 70)

    # 登录三个账号
    print("\n⏳ 正在登录测试账号...")
    admin_token = login("admin", "admin123")
    doctor_token = login("doctor", "doctor123")
    viewer_token = login("viewer", "viewer123")

    if not all([admin_token, doctor_token, viewer_token]):
        print("\n❌ 登录失败，请确保测试账号已创建")
        return

    print("✅ 所有账号登录成功")

    # Viewer 创建一个病例
    print("\n⏳ Viewer 创建病例...")
    viewer_case = create_case(viewer_token, "TEST-VIEWER-002", "Viewer的患者2")
    viewer_case_id = None
    if viewer_case:
        viewer_case_id = viewer_case['id']
        print(f"✅ Viewer 创建了病例: {viewer_case_id}")
    else:
        print("❌ Viewer 创建病例失败")

    # Doctor 创建一个病例
    print("\n⏳ Doctor 创建病例...")
    doctor_case = create_case(doctor_token, "TEST-DOCTOR-002", "Doctor的患者2")
    doctor_case_id = None
    if doctor_case:
        doctor_case_id = doctor_case['id']
        print(f"✅ Doctor 创建了病例: {doctor_case_id}")

    # 查看各个用户能看到的病例
    print("\n" + "=" * 70)
    print("验证病例列表权限")
    print("=" * 70)

    print("\n1. Admin 看到的病例列表:")
    admin_cases = get_cases(admin_token)
    print(f"   病例数量: {len(admin_cases)}")
    for case in admin_cases[:3]:
        print(f"   - {case['patient_name']} ({case['patient_id']})")

    print("\n2. Doctor 看到的病例列表:")
    doctor_cases = get_cases(doctor_token)
    print(f"   病例数量: {len(doctor_cases)}")
    for case in doctor_cases[:3]:
        print(f"   - {case['patient_name']} ({case['patient_id']})")

    print("\n3. Viewer 看到的病例列表:")
    viewer_cases = get_cases(viewer_token)
    print(f"   病例数量: {len(viewer_cases)}")
    for case in viewer_cases:
        print(f"   - {case['patient_name']} ({case['patient_id']})")

    # 测试跨用户访问
    if viewer_case_id and doctor_case_id:
        test_case_access(viewer_token, doctor_token, viewer_case_id, doctor_case_id)

    # 验证结果
    print("\n" + "=" * 70)
    print("验证结果")
    print("=" * 70)

    if len(admin_cases) >= 2 and len(doctor_cases) >= 2:
        print("✅ Admin 和 Doctor 可以看到所有病例")
    else:
        print("❌ Admin 或 Doctor 无法看到所有病例")

    if len(viewer_cases) >= 1:
        viewer_only_own = all(
            case['patient_id'].startswith('TEST-VIEWER') for case in viewer_cases
        )
        if viewer_only_own:
            print("✅ Viewer 只能看到自己创建的病例")
        else:
            print("❌ Viewer 可以看到其他人的病例")
    else:
        print("⚠️  Viewer 没有病例")

    print("\n测试完成！")

if __name__ == "__main__":
    main()
