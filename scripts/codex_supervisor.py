#!/usr/bin/env python3
"""
Codex Supervisor - 用于让 Codex 监督 Claude Code 工作的工具

功能:
1. 通过 tmux send-keys 向 Codex 发送命令
2. 读取 Codex 的回复
3. 支持作为 Claude Code skill 使用
"""

import subprocess
import time
import re
import json
import sys
from typing import Optional, Tuple
from dataclasses import dataclass


@dataclass
class CodexResponse:
    """Codex 响应数据类"""
    raw_output: str
    is_complete: bool
    has_error: bool
    message: str


class CodexSupervisor:
    """Codex 监督器类"""

    def __init__(self, session_name: str = "codex", default_wait: float = 5.0):
        self.session_name = session_name
        self.default_wait = default_wait
        self._check_session()

    def _check_session(self) -> bool:
        """检查 tmux session 是否存在"""
        result = subprocess.run(
            ["tmux", "has-session", "-t", self.session_name],
            capture_output=True
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"tmux session '{self.session_name}' not found. "
                f"Start codex first: tmux new-session -d -s {self.session_name} 'codex'"
            )
        return True

    def send_keys(self, text: str, press_enter: bool = True) -> None:
        """发送按键到 Codex session"""
        # 使用 -l 参数确保消息作为字面量发送（处理特殊字符）
        subprocess.run(["tmux", "send-keys", "-t", self.session_name, "-l", text], check=True)

        # 发送 Enter 键执行命令
        if press_enter:
            time.sleep(0.1)  # 短暂延迟确保消息完整输入
            subprocess.run(["tmux", "send-keys", "-t", self.session_name, "Enter"], check=True)

    def send_control(self, key: str) -> None:
        """发送控制键 (如 C-c, Escape)"""
        subprocess.run(
            ["tmux", "send-keys", "-t", self.session_name, key],
            check=True
        )

    def capture_output(self, lines: int = 100) -> str:
        """捕获 Codex 输出"""
        result = subprocess.run(
            ["tmux", "capture-pane", "-t", self.session_name, "-p", "-S", f"-{lines}"],
            capture_output=True,
            text=True
        )
        return result.stdout

    def wait_for_response(
        self,
        timeout: float = 30.0,
        poll_interval: float = 1.0,
        completion_markers: Optional[list] = None
    ) -> CodexResponse:
        """等待 Codex 完成响应

        Args:
            timeout: 最大等待时间（秒）
            poll_interval: 轮询间隔（秒）
            completion_markers: 完成标记列表（检测到这些标记认为响应完成）
        """
        if completion_markers is None:
            completion_markers = [
                "context left",  # Codex 空闲状态
                "? for shortcuts",
                "›",  # 新的提示符
            ]

        start_time = time.time()
        last_output = ""

        while time.time() - start_time < timeout:
            current_output = self.capture_output(200)

            # 检查是否有完成标记
            for marker in completion_markers:
                if marker in current_output and current_output != last_output:
                    # 输出已稳定且包含完成标记
                    time.sleep(0.5)  # 额外等待确保完成
                    final_output = self.capture_output(200)
                    return CodexResponse(
                        raw_output=final_output,
                        is_complete=True,
                        has_error=False,
                        message="Response completed"
                    )

            # 检查输出是否稳定（不再变化）
            if current_output == last_output and last_output:
                stable_count = getattr(self, '_stable_count', 0) + 1
                self._stable_count = stable_count
                if stable_count >= 3:  # 连续3次无变化
                    return CodexResponse(
                        raw_output=current_output,
                        is_complete=True,
                        has_error=False,
                        message="Output stabilized"
                    )
            else:
                self._stable_count = 0

            last_output = current_output
            time.sleep(poll_interval)

        return CodexResponse(
            raw_output=self.capture_output(200),
            is_complete=False,
            has_error=False,
            message=f"Timeout after {timeout}s"
        )

    def ask(
        self,
        prompt: str,
        wait_time: Optional[float] = None,
        auto_confirm: bool = False
    ) -> CodexResponse:
        """向 Codex 发送问题并等待回复

        Args:
            prompt: 要发送的提示/问题
            wait_time: 等待时间（None 则自动检测）
            auto_confirm: 是否自动确认 (发送 'y')
        """
        # 发送提示
        self.send_keys(prompt)

        # 等待响应
        if wait_time:
            time.sleep(wait_time)
            response = CodexResponse(
                raw_output=self.capture_output(200),
                is_complete=True,
                has_error=False,
                message="Fixed wait completed"
            )
        else:
            response = self.wait_for_response()

        # 自动确认
        if auto_confirm:
            time.sleep(0.5)
            self.send_keys("y", press_enter=False)
            time.sleep(1)
            response = CodexResponse(
                raw_output=self.capture_output(200),
                is_complete=response.is_complete,
                has_error=response.has_error,
                message=response.message + " (auto-confirmed)"
            )

        return response

    def cancel(self) -> None:
        """取消当前操作 (Ctrl+C)"""
        self.send_control("C-c")
        time.sleep(0.5)

    def escape(self) -> None:
        """发送 Escape 键"""
        self.send_control("Escape")
        time.sleep(0.3)

    def get_status(self) -> dict:
        """获取 Codex 当前状态"""
        output = self.capture_output(50)
        return {
            "session": self.session_name,
            "is_idle": "context left" in output or "? for shortcuts" in output,
            "recent_output": output[-500:] if len(output) > 500 else output
        }


def supervise_claude_code(
    supervisor: CodexSupervisor,
    task_description: str,
    claude_code_output: str
) -> str:
    """让 Codex 监督 Claude Code 的工作

    Args:
        supervisor: CodexSupervisor 实例
        task_description: 任务描述
        claude_code_output: Claude Code 的输出/工作内容

    Returns:
        Codex 的监督反馈
    """
    prompt = f"""请审查以下 Claude Code 的工作:

任务: {task_description}

Claude Code 输出:
```
{claude_code_output[:2000]}  # 限制长度
```

请提供:
1. 工作质量评估 (1-10分)
2. 发现的问题
3. 改进建议
"""
    response = supervisor.ask(prompt)
    return response.raw_output


def main():
    """CLI 入口"""
    import argparse

    parser = argparse.ArgumentParser(description="Codex Supervisor - 与 Codex 交互的工具")
    parser.add_argument("command", choices=["send", "read", "ask", "status", "cancel", "supervise"],
                        help="要执行的命令")
    parser.add_argument("--prompt", "-p", help="要发送的提示")
    parser.add_argument("--session", "-s", default="codex", help="tmux session 名称")
    parser.add_argument("--wait", "-w", type=float, help="等待时间（秒）")
    parser.add_argument("--lines", "-l", type=int, default=100, help="读取的行数")
    parser.add_argument("--task", "-t", help="任务描述（用于 supervise 命令）")
    parser.add_argument("--output", "-o", help="Claude Code 输出（用于 supervise 命令）")
    parser.add_argument("--json", action="store_true", help="以 JSON 格式输出")

    args = parser.parse_args()

    try:
        supervisor = CodexSupervisor(session_name=args.session)

        if args.command == "send":
            if not args.prompt:
                print("Error: --prompt required for send command", file=sys.stderr)
                sys.exit(1)
            supervisor.send_keys(args.prompt)
            print(f"Sent: {args.prompt}")

        elif args.command == "read":
            output = supervisor.capture_output(args.lines)
            print(output)

        elif args.command == "ask":
            if not args.prompt:
                print("Error: --prompt required for ask command", file=sys.stderr)
                sys.exit(1)
            response = supervisor.ask(args.prompt, wait_time=args.wait)
            if args.json:
                print(json.dumps({
                    "raw_output": response.raw_output,
                    "is_complete": response.is_complete,
                    "message": response.message
                }, indent=2, ensure_ascii=False))
            else:
                print(response.raw_output)

        elif args.command == "status":
            status = supervisor.get_status()
            if args.json:
                print(json.dumps(status, indent=2, ensure_ascii=False))
            else:
                print(f"Session: {status['session']}")
                print(f"Is Idle: {status['is_idle']}")
                print(f"\nRecent Output:\n{status['recent_output']}")

        elif args.command == "cancel":
            supervisor.cancel()
            print("Cancelled current operation")

        elif args.command == "supervise":
            if not args.task or not args.output:
                print("Error: --task and --output required for supervise command", file=sys.stderr)
                sys.exit(1)
            result = supervise_claude_code(supervisor, args.task, args.output)
            print(result)

    except RuntimeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
