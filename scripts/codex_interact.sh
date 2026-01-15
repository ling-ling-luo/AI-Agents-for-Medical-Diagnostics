#!/bin/bash
# codex_interact.sh - 与 Codex 在 tmux 中交互的工具脚本
# 用法: ./codex_interact.sh <command> [args]

CODEX_SESSION="${CODEX_SESSION:-codex}"
WAIT_TIME="${CODEX_WAIT_TIME:-5}"  # 等待响应的默认时间（秒）

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 tmux session 是否存在
check_session() {
    if ! tmux has-session -t "$CODEX_SESSION" 2>/dev/null; then
        echo -e "${RED}Error: tmux session '$CODEX_SESSION' not found${NC}"
        echo "Start codex in tmux first: tmux new-session -d -s codex 'codex'"
        exit 1
    fi
}

# 发送命令到 Codex
send_command() {
    local cmd="$1"
    if [ -z "$cmd" ]; then
        echo -e "${RED}Error: No command provided${NC}"
        return 1
    fi

    echo -e "${YELLOW}Sending to Codex:${NC} $cmd"
    # 使用 -l 参数确保消息作为字面量发送
    tmux send-keys -t "$CODEX_SESSION" -l "$cmd"
    sleep 0.1  # 短暂延迟确保消息完整输入
    tmux send-keys -t "$CODEX_SESSION" Enter
    return 0
}

# 读取 Codex 的输出
read_output() {
    local lines="${1:-100}"  # 默认读取最近 100 行
    tmux capture-pane -t "$CODEX_SESSION" -p -S "-$lines"
}

# 等待并读取响应
wait_and_read() {
    local wait_time="${1:-$WAIT_TIME}"
    local lines="${2:-100}"

    echo -e "${YELLOW}Waiting ${wait_time}s for response...${NC}"
    sleep "$wait_time"
    read_output "$lines"
}

# 发送命令并等待响应
send_and_wait() {
    local cmd="$1"
    local wait_time="${2:-$WAIT_TIME}"
    local lines="${3:-100}"

    send_command "$cmd"
    wait_and_read "$wait_time" "$lines"
}

# 清除 Codex 当前输入（发送 Ctrl+C）
clear_input() {
    tmux send-keys -t "$CODEX_SESSION" C-c
    sleep 0.5
}

# 发送 Escape 键
send_escape() {
    tmux send-keys -t "$CODEX_SESSION" Escape
    sleep 0.5
}

# 发送 y 确认
send_yes() {
    tmux send-keys -t "$CODEX_SESSION" "y"
    sleep 0.5
}

# 主命令处理
main() {
    local command="$1"
    shift

    check_session

    case "$command" in
        send)
            # 发送命令: ./codex_interact.sh send "your prompt"
            send_command "$*"
            ;;
        read)
            # 读取输出: ./codex_interact.sh read [lines]
            read_output "${1:-100}"
            ;;
        ask)
            # 发送并等待: ./codex_interact.sh ask "your prompt" [wait_time] [lines]
            send_and_wait "$1" "${2:-$WAIT_TIME}" "${3:-100}"
            ;;
        clear)
            # 清除输入: ./codex_interact.sh clear
            clear_input
            echo -e "${GREEN}Input cleared${NC}"
            ;;
        escape)
            # 发送 Escape: ./codex_interact.sh escape
            send_escape
            echo -e "${GREEN}Escape sent${NC}"
            ;;
        yes)
            # 发送确认: ./codex_interact.sh yes
            send_yes
            echo -e "${GREEN}Confirmation sent${NC}"
            ;;
        status)
            # 检查状态: ./codex_interact.sh status
            echo -e "${GREEN}Session '$CODEX_SESSION' is running${NC}"
            echo "Recent output:"
            read_output 20
            ;;
        help|--help|-h)
            echo "Usage: $0 <command> [args]"
            echo ""
            echo "Commands:"
            echo "  send <prompt>              Send a prompt to Codex"
            echo "  read [lines]               Read recent output (default: 100 lines)"
            echo "  ask <prompt> [wait] [lines] Send prompt and wait for response"
            echo "  clear                      Clear current input (Ctrl+C)"
            echo "  escape                     Send Escape key"
            echo "  yes                        Send 'y' confirmation"
            echo "  status                     Check session status and recent output"
            echo ""
            echo "Environment variables:"
            echo "  CODEX_SESSION   tmux session name (default: codex)"
            echo "  CODEX_WAIT_TIME Default wait time in seconds (default: 5)"
            ;;
        *)
            echo -e "${RED}Unknown command: $command${NC}"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# 如果没有参数，显示帮助
if [ $# -eq 0 ]; then
    main help
else
    main "$@"
fi
