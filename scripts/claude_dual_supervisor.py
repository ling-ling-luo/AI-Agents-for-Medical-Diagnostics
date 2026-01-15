#!/usr/bin/env python3
"""
Claude Dual Session Supervisor - 双 Claude Code 会话协作系统

架构：
- Worker: 执行具体任务的 Claude Code 实例
- Supervisor: 负责决策、审查、指导的 Claude Code 实例

工作流：
1. Supervisor 分析任务，制定计划
2. Worker 执行具体实现
3. Supervisor 审查 Worker 的输出
4. 循环直到任务完成
"""

import subprocess
import time
import json
import sys
import os
import re
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime


class Role(Enum):
    WORKER = "worker"
    SUPERVISOR = "supervisor"


@dataclass
class SessionConfig:
    """会话配置"""
    worker_session: str = "claude-worker"
    supervisor_session: str = "claude-supervisor"
    default_wait: float = 10.0
    max_wait: float = 120.0
    poll_interval: float = 2.0


@dataclass
class Message:
    """消息记录"""
    role: Role
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    response: Optional[str] = None


@dataclass
class TaskState:
    """任务状态"""
    task_id: str
    description: str
    status: str = "pending"  # pending, in_progress, review, completed, failed
    messages: List[Message] = field(default_factory=list)
    decision_log: List[Dict] = field(default_factory=list)


class ClaudeDualSupervisor:
    """双 Claude Code 会话管理器"""

    def __init__(self, config: Optional[SessionConfig] = None):
        self.config = config or SessionConfig()
        self.tasks: Dict[str, TaskState] = {}
        self._task_counter = 0

    #===========================================================================
    # 基础会话操作
    #===========================================================================

    def _session_exists(self, session: str) -> bool:
        """检查会话是否存在"""
        result = subprocess.run(
            ["tmux", "has-session", "-t", session],
            capture_output=True
        )
        return result.returncode == 0

    def _send_keys(self, session: str, text: str, press_enter: bool = True) -> None:
        """发送按键到会话"""
        # 使用 -l 参数确保消息作为字面量发送（处理特殊字符）
        subprocess.run(["tmux", "send-keys", "-t", session, "-l", text], check=True)

        # 发送 Enter 键执行命令
        if press_enter:
            time.sleep(0.1)  # 短暂延迟确保消息完整输入
            subprocess.run(["tmux", "send-keys", "-t", session, "Enter"], check=True)

    def _capture_pane(self, session: str, lines: int = 100) -> str:
        """捕获会话输出"""
        result = subprocess.run(
            ["tmux", "capture-pane", "-t", session, "-p", "-S", f"-{lines}"],
            capture_output=True,
            text=True
        )
        return result.stdout

    def _clear_input(self, session: str) -> None:
        """清除输入 (Ctrl+C)"""
        subprocess.run(["tmux", "send-keys", "-t", session, "C-c"])
        time.sleep(0.5)

    def _get_session_name(self, role: Role) -> str:
        """获取会话名称"""
        if role == Role.WORKER:
            return self.config.worker_session
        return self.config.supervisor_session

    #===========================================================================
    # 会话管理
    #===========================================================================

    def start_session(self, role: Role, workdir: Optional[str] = None) -> bool:
        """启动会话"""
        session = self._get_session_name(role)
        if self._session_exists(session):
            print(f"Session {session} already exists")
            return True

        workdir = workdir or os.getcwd()
        subprocess.run(
            ["tmux", "new-session", "-d", "-s", session, "-c", workdir],
            check=True
        )
        time.sleep(1)

        # 启动 Claude Code
        self._send_keys(session, "claude")
        time.sleep(3)

        print(f"Started {role.value} session: {session}")
        return True

    def start_both(self, workdir: Optional[str] = None) -> bool:
        """启动双会话"""
        self.start_session(Role.WORKER, workdir)
        self.start_session(Role.SUPERVISOR, workdir)
        return True

    def stop_session(self, role: Role) -> None:
        """停止会话"""
        session = self._get_session_name(role)
        if self._session_exists(session):
            subprocess.run(["tmux", "kill-session", "-t", session])
            print(f"Stopped {role.value} session")

    def stop_all(self) -> None:
        """停止所有会话"""
        self.stop_session(Role.WORKER)
        self.stop_session(Role.SUPERVISOR)

    def get_status(self) -> Dict:
        """获取会话状态"""
        return {
            "worker": {
                "session": self.config.worker_session,
                "running": self._session_exists(self.config.worker_session),
                "recent_output": self._capture_pane(self.config.worker_session, 20)
                    if self._session_exists(self.config.worker_session) else None
            },
            "supervisor": {
                "session": self.config.supervisor_session,
                "running": self._session_exists(self.config.supervisor_session),
                "recent_output": self._capture_pane(self.config.supervisor_session, 20)
                    if self._session_exists(self.config.supervisor_session) else None
            }
        }

    #===========================================================================
    # 消息发送与接收
    #===========================================================================

    def send_message(self, role: Role, message: str) -> None:
        """发送消息到指定角色"""
        session = self._get_session_name(role)
        if not self._session_exists(session):
            raise RuntimeError(f"Session {session} not running")
        self._send_keys(session, message)

    def read_output(self, role: Role, lines: int = 100) -> str:
        """读取指定角色的输出"""
        session = self._get_session_name(role)
        if not self._session_exists(session):
            raise RuntimeError(f"Session {session} not running")
        return self._capture_pane(session, lines)

    def wait_for_response(
        self,
        role: Role,
        timeout: Optional[float] = None,
        completion_markers: Optional[List[str]] = None
    ) -> Tuple[str, bool]:
        """等待响应完成

        Returns:
            (output, is_complete)
        """
        timeout = timeout or self.config.max_wait
        completion_markers = completion_markers or [
            ">",  # Claude Code 提示符
            "╭",  # 新的输入框
            "│ >",
        ]

        session = self._get_session_name(role)
        start_time = time.time()
        last_output = ""
        stable_count = 0

        while time.time() - start_time < timeout:
            current_output = self._capture_pane(session, 200)

            # 检查输出是否稳定
            if current_output == last_output:
                stable_count += 1
                if stable_count >= 3:  # 连续3次无变化
                    return current_output, True
            else:
                stable_count = 0

            last_output = current_output
            time.sleep(self.config.poll_interval)

        return self._capture_pane(session, 200), False

    #===========================================================================
    # 协作工作流
    #===========================================================================

    def create_task(self, description: str) -> str:
        """创建新任务"""
        self._task_counter += 1
        task_id = f"task_{self._task_counter}"
        self.tasks[task_id] = TaskState(
            task_id=task_id,
            description=description
        )
        return task_id

    def supervisor_plan(self, task_id: str) -> str:
        """让 Supervisor 制定计划"""
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")

        prompt = f"""作为技术架构师和项目经理，请为以下任务制定详细计划：

任务描述：{task.description}

请提供：
1. 任务分解（子任务列表）
2. 每个子任务的具体步骤
3. 预期的输出/交付物
4. 需要注意的风险点
5. 给 Worker 的明确指令

请用结构化的格式输出。"""

        self.send_message(Role.SUPERVISOR, prompt)
        task.status = "planning"
        task.messages.append(Message(role=Role.SUPERVISOR, content=prompt))

        output, _ = self.wait_for_response(Role.SUPERVISOR)
        return output

    def worker_execute(self, task_id: str, instruction: str) -> str:
        """让 Worker 执行任务"""
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")

        self.send_message(Role.WORKER, instruction)
        task.status = "in_progress"
        task.messages.append(Message(role=Role.WORKER, content=instruction))

        output, _ = self.wait_for_response(Role.WORKER)
        return output

    def supervisor_review(self, task_id: str, worker_output: str) -> Dict:
        """让 Supervisor 审查 Worker 的工作"""
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")

        prompt = f"""作为代码审查者，请审查 Worker 完成的工作：

原始任务：{task.description}

Worker 输出：
```
{worker_output[:3000]}
```

请评估：
1. 完成度 (0-100%)
2. 代码质量 (1-10)
3. 是否符合要求
4. 发现的问题
5. 改进建议
6. 决定：APPROVE（批准）/ REVISE（需修改）/ REJECT（拒绝）

请用 JSON 格式输出评估结果。"""

        self.send_message(Role.SUPERVISOR, prompt)
        task.status = "review"
        task.messages.append(Message(role=Role.SUPERVISOR, content=prompt))

        output, _ = self.wait_for_response(Role.SUPERVISOR)

        # 记录决策
        task.decision_log.append({
            "timestamp": datetime.now().isoformat(),
            "type": "review",
            "output": output[:1000]
        })

        return {"raw_output": output}

    def supervisor_decide(self, question: str, context: str = "") -> str:
        """让 Supervisor 做决策"""
        prompt = f"""作为技术决策者，请对以下问题做出决策：

问题：{question}

上下文：
{context}

请提供：
1. 推荐方案
2. 决策理由
3. 替代方案
4. 潜在风险
5. 给 Worker 的明确指令"""

        self.send_message(Role.SUPERVISOR, prompt)
        output, _ = self.wait_for_response(Role.SUPERVISOR)
        return output

    #===========================================================================
    # 完整工作流
    #===========================================================================

    def run_supervised_task(
        self,
        description: str,
        max_iterations: int = 3
    ) -> Dict:
        """运行完整的监督式任务流程

        1. Supervisor 制定计划
        2. Worker 执行
        3. Supervisor 审查
        4. 循环直到批准或达到最大迭代
        """
        task_id = self.create_task(description)
        task = self.tasks[task_id]

        result = {
            "task_id": task_id,
            "description": description,
            "iterations": [],
            "final_status": "unknown"
        }

        # 1. Supervisor 制定计划
        print(f"[Supervisor] Planning task: {description}")
        plan_output = self.supervisor_plan(task_id)
        result["plan"] = plan_output

        # 2. 迭代执行和审查
        for i in range(max_iterations):
            iteration = {"number": i + 1}

            # Worker 执行
            print(f"[Worker] Executing iteration {i + 1}")
            if i == 0:
                worker_instruction = f"请根据以下计划执行任务：\n\n{plan_output}"
            else:
                worker_instruction = f"请根据上次审查反馈修改代码"

            worker_output = self.worker_execute(task_id, worker_instruction)
            iteration["worker_output"] = worker_output[:500]

            # Supervisor 审查
            print(f"[Supervisor] Reviewing iteration {i + 1}")
            review = self.supervisor_review(task_id, worker_output)
            iteration["review"] = review

            result["iterations"].append(iteration)

            # 检查是否批准
            if "APPROVE" in review.get("raw_output", "").upper():
                task.status = "completed"
                result["final_status"] = "approved"
                break
            elif "REJECT" in review.get("raw_output", "").upper():
                task.status = "failed"
                result["final_status"] = "rejected"
                break

        if task.status not in ["completed", "failed"]:
            result["final_status"] = "max_iterations_reached"

        return result


#===============================================================================
# CLI
#===============================================================================

def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Claude Dual Session Supervisor - 双 Claude Code 会话协作系统"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # start
    start_parser = subparsers.add_parser("start", help="Start sessions")
    start_parser.add_argument("role", choices=["worker", "supervisor", "both"],
                              help="Which session(s) to start")
    start_parser.add_argument("--dir", "-d", help="Working directory")

    # stop
    stop_parser = subparsers.add_parser("stop", help="Stop sessions")
    stop_parser.add_argument("role", choices=["worker", "supervisor", "all"],
                             help="Which session(s) to stop")

    # status
    subparsers.add_parser("status", help="Show session status")

    # send
    send_parser = subparsers.add_parser("send", help="Send message")
    send_parser.add_argument("role", choices=["worker", "supervisor"])
    send_parser.add_argument("message", help="Message to send")

    # read
    read_parser = subparsers.add_parser("read", help="Read output")
    read_parser.add_argument("role", choices=["worker", "supervisor"])
    read_parser.add_argument("--lines", "-l", type=int, default=100)

    # decide
    decide_parser = subparsers.add_parser("decide", help="Have Supervisor make a decision")
    decide_parser.add_argument("question", help="Question for Supervisor")
    decide_parser.add_argument("--context", "-c", default="", help="Additional context")

    # run
    run_parser = subparsers.add_parser("run", help="Run supervised task")
    run_parser.add_argument("description", help="Task description")
    run_parser.add_argument("--max-iter", "-m", type=int, default=3)

    args = parser.parse_args()

    supervisor = ClaudeDualSupervisor()

    if args.command == "start":
        if args.role == "both":
            supervisor.start_both(args.dir)
        else:
            supervisor.start_session(Role[args.role.upper()], args.dir)

    elif args.command == "stop":
        if args.role == "all":
            supervisor.stop_all()
        else:
            supervisor.stop_session(Role[args.role.upper()])

    elif args.command == "status":
        status = supervisor.get_status()
        print(json.dumps(status, indent=2, ensure_ascii=False, default=str))

    elif args.command == "send":
        supervisor.send_message(Role[args.role.upper()], args.message)
        print(f"Sent to {args.role}")

    elif args.command == "read":
        output = supervisor.read_output(Role[args.role.upper()], args.lines)
        print(output)

    elif args.command == "decide":
        output = supervisor.supervisor_decide(args.question, args.context)
        print(output)

    elif args.command == "run":
        result = supervisor.run_supervised_task(args.description, args.max_iter)
        print(json.dumps(result, indent=2, ensure_ascii=False, default=str))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
