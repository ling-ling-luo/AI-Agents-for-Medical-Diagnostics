#!/bin/bash
# claude_dual_session.sh - Claude Code Worker-Supervisor 协作系统
# 架构：当前窗口 = Worker（执行），tmux 后台 = Supervisor（指导）
# 用法: ./claude_dual_session.sh <command> [args]

# Supervisor 会话名称（Worker 就是当前窗口，不需要管理）
SUPERVISOR_SESSION="${CLAUDE_SUPERVISOR_SESSION:-claude-supervisor}"
WAIT_TIME="${CLAUDE_WAIT_TIME:-15}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

#===============================================================================
# Supervisor 会话管理
#===============================================================================

# 检查 Supervisor 会话是否存在
supervisor_exists() {
    tmux has-session -t "$SUPERVISOR_SESSION" 2>/dev/null
}

# 启动 Supervisor 会话
start_supervisor() {
    local workdir="${1:-$(pwd)}"
    if supervisor_exists; then
        echo -e "${YELLOW}Supervisor session already exists${NC}"
        return 0
    fi
    echo -e "${BLUE}Starting Supervisor session in background...${NC}"
    tmux new-session -d -s "$SUPERVISOR_SESSION" -c "$workdir"
    sleep 1
    # 启动 claude code
    tmux send-keys -t "$SUPERVISOR_SESSION" "claude" Enter
    sleep 3
    echo -e "${GREEN}Supervisor session started: $SUPERVISOR_SESSION${NC}"
    echo -e "${CYAN}You (current window) = Worker | tmux ($SUPERVISOR_SESSION) = Supervisor${NC}"
}

# 停止 Supervisor 会话
stop_supervisor() {
    if supervisor_exists; then
        tmux kill-session -t "$SUPERVISOR_SESSION"
        echo -e "${YELLOW}Supervisor session stopped${NC}"
    else
        echo -e "${RED}Supervisor session not found${NC}"
    fi
}

#===============================================================================
# 与 Supervisor 交互
#===============================================================================

# 发送消息到 Supervisor
send_to_supervisor() {
    local message="$1"

    if ! supervisor_exists; then
        echo -e "${RED}Supervisor not running. Start with: $0 start${NC}"
        return 1
    fi

    # 使用 -l 参数确保消息作为字面量发送
    tmux send-keys -t "$SUPERVISOR_SESSION" -l "$message"
    sleep 0.1
    tmux send-keys -t "$SUPERVISOR_SESSION" Enter
}

# 读取 Supervisor 输出
read_supervisor() {
    local lines="${1:-100}"

    if ! supervisor_exists; then
        echo -e "${RED}Supervisor not running${NC}"
        return 1
    fi

    tmux capture-pane -t "$SUPERVISOR_SESSION" -p -S "-$lines"
}

# 清除 Supervisor 输入
clear_supervisor() {
    tmux send-keys -t "$SUPERVISOR_SESSION" C-c
    sleep 0.5
}

# 请求 Supervisor 审查
ask_review() {
    local description="$1"
    local content="$2"

    local prompt="作为代码审查者，请审查以下内容：

任务/文件：$description

内容：
\`\`\`
$content
\`\`\`

请提供：
1. 质量评估 (1-10)
2. 问题列表
3. 改进建议
4. 决定：APPROVE / REVISE / REJECT"

    echo -e "${BLUE}[Supervisor] 请求审查...${NC}"
    send_to_supervisor "$prompt"
}

# 请求 Supervisor 做决策
ask_decision() {
    local question="$1"
    local context="${2:-}"

    local prompt="作为技术决策者，请回答：

问题：$question"

    if [ -n "$context" ]; then
        prompt="$prompt

上下文：
$context"
    fi

    prompt="$prompt

请提供：
1. 推荐方案
2. 理由
3. 需要注意的风险"

    echo -e "${BLUE}[Supervisor] 请求决策...${NC}"
    send_to_supervisor "$prompt"
}

# 请求 Supervisor 制定计划
ask_plan() {
    local task="$1"

    local prompt="作为技术架构师，请为以下任务制定实施计划：

任务：$task

请提供：
1. 任务分解（步骤列表）
2. 每步的具体操作
3. 预期输出
4. 风险点"

    echo -e "${BLUE}[Supervisor] 请求计划...${NC}"
    send_to_supervisor "$prompt"
}

# 向 Supervisor 报告进度
report_progress() {
    local status="$1"
    local details="${2:-}"

    local prompt="Worker 进度报告：

状态：$status"

    if [ -n "$details" ]; then
        prompt="$prompt

详情：
$details"
    fi

    prompt="$prompt

请确认收到并提供下一步指导。"

    echo -e "${CYAN}[Worker → Supervisor] 报告进度...${NC}"
    send_to_supervisor "$prompt"
}

#===============================================================================
# 便捷命令
#===============================================================================

# 发送并等待响应
ask_and_wait() {
    local message="$1"
    local wait_time="${2:-$WAIT_TIME}"

    send_to_supervisor "$message"
    echo -e "${YELLOW}等待 Supervisor 响应 (${wait_time}s)...${NC}"
    sleep "$wait_time"
    echo -e "${BLUE}=== Supervisor 响应 ===${NC}"
    read_supervisor 80
}

# 检查状态
check_status() {
    echo -e "${CYAN}=== Claude Code Worker-Supervisor 状态 ===${NC}"
    echo ""
    echo -e "${GREEN}[Worker]${NC} 当前窗口 (你正在使用的 Claude Code)"
    echo ""

    if supervisor_exists; then
        echo -e "${BLUE}[Supervisor]${NC} 运行中"
        echo "  Session: $SUPERVISOR_SESSION"
        echo "  查看: tmux attach -t $SUPERVISOR_SESSION"
        echo ""
        echo "  最近输出:"
        read_supervisor 15 | sed 's/^/    /'
    else
        echo -e "${RED}[Supervisor]${NC} 未运行"
        echo "  启动: $0 start"
    fi
}

#===============================================================================
# 主命令处理
#===============================================================================

show_help() {
    cat << 'EOF'
Claude Code Worker-Supervisor 协作系统
======================================

架构：
  - Worker（当前窗口）：执行具体任务
  - Supervisor（tmux 后台）：提供指导、审查、决策

Usage: $0 <command> [args]

会话管理:
  start [dir]              启动 Supervisor (后台 tmux)
  stop                     停止 Supervisor
  status                   查看状态
  attach                   连接到 Supervisor 窗口查看

与 Supervisor 交互:
  ask <message>            向 Supervisor 提问
  ask-wait <msg> [wait]    提问并等待响应
  review <desc> <content>  请求代码审查
  decide <question> [ctx]  请求决策
  plan <task>              请求制定计划
  report <status> [detail] 报告进度

底层命令:
  send <message>           发送消息到 Supervisor
  read [lines]             读取 Supervisor 输出
  clear                    清除 Supervisor 输入

示例:
  # 启动 Supervisor
  $0 start

  # 请求计划
  $0 plan "实现用户登录功能"

  # 请求审查
  $0 review "login.py" "$(cat login.py)"

  # 请求决策
  $0 decide "使用 JWT 还是 Session？" "需要支持移动端"

  # 提问并等待
  $0 ask-wait "这个实现方案可行吗？" 20
EOF
}

main() {
    local command="$1"
    shift

    case "$command" in
        # 会话管理
        start)
            start_supervisor "$1"
            ;;
        stop)
            stop_supervisor
            ;;
        status)
            check_status
            ;;
        attach)
            if supervisor_exists; then
                echo -e "${BLUE}连接到 Supervisor... (Ctrl+B D 退出)${NC}"
                tmux attach -t "$SUPERVISOR_SESSION"
            else
                echo -e "${RED}Supervisor 未运行${NC}"
            fi
            ;;

        # 与 Supervisor 交互
        ask)
            send_to_supervisor "$*"
            ;;
        ask-wait)
            ask_and_wait "$1" "${2:-$WAIT_TIME}"
            ;;
        review)
            ask_review "$1" "$2"
            ;;
        decide)
            ask_decision "$1" "$2"
            ;;
        plan)
            ask_plan "$*"
            ;;
        report)
            report_progress "$1" "$2"
            ;;

        # 底层命令
        send)
            send_to_supervisor "$*"
            echo -e "${GREEN}已发送到 Supervisor${NC}"
            ;;
        read)
            read_supervisor "${1:-100}"
            ;;
        clear)
            clear_supervisor
            echo -e "${GREEN}Supervisor 输入已清除${NC}"
            ;;

        # 帮助
        help|--help|-h|"")
            show_help
            ;;

        *)
            echo -e "${RED}未知命令: $command${NC}"
            echo "使用 '$0 help' 查看帮助"
            exit 1
            ;;
    esac
}

main "$@"
