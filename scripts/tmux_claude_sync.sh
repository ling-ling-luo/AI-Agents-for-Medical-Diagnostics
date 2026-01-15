#!/bin/bash
# tmux_claude_sync.sh - Claude Code 会话间同步协作工具
#
# 功能：
#   - 智能检测 Claude Code 响应完成
#   - 双重检测机制：内容稳定 + 提示符识别
#   - 支持发送命令并等待完成
#
# 用法：
#   source /path/to/tmux_claude_sync.sh
#   send_and_wait "claude-supervisor" "请分析这段代码"
#
# 或直接运行：
#   ./tmux_claude_sync.sh <command> [args]

#===============================================================================
# 配置
#===============================================================================

# 默认参数
SYNC_IDLE_SECONDS="${SYNC_IDLE_SECONDS:-3}"      # 内容稳定时间（秒）
SYNC_MAX_WAIT="${SYNC_MAX_WAIT:-120}"            # 最大等待时间（秒）
SYNC_POLL_INTERVAL="${SYNC_POLL_INTERVAL:-1}"   # 轮询间隔（秒）
SYNC_DEFAULT_LINES="${SYNC_DEFAULT_LINES:-200}" # 默认捕获行数

# Claude Code 提示符模式（正则表达式）
CLAUDE_PROMPT_PATTERNS=(
    '❯\s*$'                    # Claude Code 主提示符 ❯
    '>\s*$'                    # 基本提示符 >
    'claude>\s*$'              # claude> 提示符
    '│\s*>\s*$'                # 边框内提示符
    '\?\s*$'                   # 问号提示
    '\[Y/n\]\s*$'              # 确认提示
    '\[y/N\]\s*$'              # 确认提示
    'Press Enter'             # 按回车提示
)

# 正在处理中的模式（检测到这些说明还没完成）
CLAUDE_BUSY_PATTERNS=(
    'Thinking'
    'Reading'
    'Writing'
    'Searching'
    'Running'
    'Editing'
    'Analyzing'
    'ctrl+c to interrupt'
    '[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]'
)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

#===============================================================================
# 核心函数
#===============================================================================

# 检查依赖
_check_deps() {
    if ! command -v tmux &>/dev/null; then
        echo -e "${RED}错误: 缺少依赖 tmux${NC}" >&2
        return 1
    fi
    return 0
}

# 获取 pane 的最新输出
# 参数：target_pane, lines(默认200)
get_pane_output() {
    local target="${1:?需要指定 target_pane}"
    local lines="${2:-$SYNC_DEFAULT_LINES}"

    if ! tmux has-session -t "${target%%:*}" 2>/dev/null; then
        echo -e "${RED}错误: 会话不存在${NC}" >&2
        return 1
    fi

    tmux capture-pane -t "$target" -p -S "-$lines" 2>/dev/null
}

# 计算内容哈希（用于检测变化，跨平台兼容）
_content_hash() {
    if command -v md5sum &>/dev/null; then
        echo "$1" | md5sum | cut -d' ' -f1
    elif command -v md5 &>/dev/null; then
        echo "$1" | md5
    else
        echo "$1" | cksum | cut -d' ' -f1
    fi
}

# 检查 pane 是否正在处理中
# 参数：output_text
# 返回：0=正在处理, 1=未在处理
_is_busy() {
    local output="$1"
    local last_lines
    last_lines=$(echo "$output" | tail -15)

    for pattern in "${CLAUDE_BUSY_PATTERNS[@]}"; do
        if echo "$last_lines" | grep -qE "$pattern"; then
            return 0
        fi
    done

    return 1
}

# 检查 pane 是否显示 Claude Code 提示符
# 参数：target_pane
# 返回：0=就绪, 1=未就绪
is_claude_ready() {
    local target="${1:?需要指定 target_pane}"
    local output

    output=$(get_pane_output "$target" 30) || return 1

    # 先检查是否正在处理中
    if _is_busy "$output"; then
        return 1
    fi

    # 获取最后几行进行检测
    local last_lines
    last_lines=$(echo "$output" | tail -10)

    for pattern in "${CLAUDE_PROMPT_PATTERNS[@]}"; do
        if echo "$last_lines" | grep -qE "$pattern"; then
            return 0
        fi
    done

    return 1
}

# 等待 tmux pane 输出完成
# 参数：target_pane, idle_seconds(默认3), max_wait(默认120)
# 返回：0=完成, 1=超时, 2=错误
wait_tmux_output() {
    local target="${1:?需要指定 target_pane}"
    local idle_seconds="${2:-$SYNC_IDLE_SECONDS}"
    local max_wait="${3:-$SYNC_MAX_WAIT}"

    local start_time=$(date +%s)
    local last_hash=""
    local stable_count=0
    local required_stable=$((idle_seconds / SYNC_POLL_INTERVAL))

    # 至少需要2次稳定检测
    [[ $required_stable -lt 2 ]] && required_stable=2

    echo -e "${GRAY}等待输出完成 (最长 ${max_wait}s, 稳定 ${idle_seconds}s)...${NC}" >&2

    while true; do
        local elapsed=$(($(date +%s) - start_time))

        # 检查超时
        if [[ $elapsed -ge $max_wait ]]; then
            echo -e "${YELLOW}达到最大等待时间 (${max_wait}s)${NC}" >&2
            return 1
        fi

        # 获取当前输出
        local current_output
        current_output=$(get_pane_output "$target") || return 2
        local current_hash=$(_content_hash "$current_output")

        # 先检查是否正在处理中
        if _is_busy "$current_output"; then
            stable_count=0
            echo -e "${GRAY}  处理中... (${elapsed}s)${NC}" >&2
            last_hash="$current_hash"
            sleep "$SYNC_POLL_INTERVAL"
            continue
        fi

        # 检查是否有提示符且不在处理中
        if is_claude_ready "$target"; then
            echo -e "${GREEN}检测到 Claude 提示符，输出完成 (${elapsed}s)${NC}" >&2
            return 0
        fi

        # 检查内容是否稳定
        if [[ "$current_hash" == "$last_hash" ]]; then
            ((stable_count++))
            echo -e "${GRAY}  内容稳定 ${stable_count}/${required_stable} (${elapsed}s)${NC}" >&2

            if [[ $stable_count -ge $required_stable ]]; then
                echo -e "${GREEN}内容已稳定 ${idle_seconds}s，输出完成${NC}" >&2
                return 0
            fi
        else
            stable_count=0
            echo -e "${GRAY}  内容变化中... (${elapsed}s)${NC}" >&2
        fi

        last_hash="$current_hash"
        sleep "$SYNC_POLL_INTERVAL"
    done
}

# 发送命令到指定 pane 并等待完成
# 参数：target_pane, command, idle_seconds(默认3), max_wait(默认120)
send_and_wait() {
    local target="${1:?需要指定 target_pane}"
    local command="${2:?需要指定 command}"
    local idle_seconds="${3:-$SYNC_IDLE_SECONDS}"
    local max_wait="${4:-$SYNC_MAX_WAIT}"

    if ! tmux has-session -t "${target%%:*}" 2>/dev/null; then
        echo -e "${RED}错误: 会话 ${target} 不存在${NC}" >&2
        return 1
    fi

    echo -e "${BLUE}发送到 ${target}: ${command:0:50}...${NC}" >&2

    # 发送命令（使用 -l 参数处理特殊字符）
    tmux send-keys -t "$target" -l "$command"
    sleep 0.1
    tmux send-keys -t "$target" Enter

    # 等待初始响应开始
    sleep 1

    # 等待输出完成
    wait_tmux_output "$target" "$idle_seconds" "$max_wait"
    local result=$?

    # 返回最终输出
    get_pane_output "$target"

    return $result
}

# 发送并获取响应（简化版本）
# 参数：target_pane, command, wait_seconds(可选，默认自动检测)
ask_sync() {
    local target="${1:?需要指定 target_pane}"
    local command="${2:?需要指定 command}"
    local wait_seconds="${3:-}"

    if [[ -n "$wait_seconds" ]]; then
        # 固定等待时间
        tmux send-keys -t "$target" -l "$command"
        sleep 0.1
        tmux send-keys -t "$target" Enter
        sleep "$wait_seconds"
        get_pane_output "$target"
    else
        # 智能等待
        send_and_wait "$target" "$command"
    fi
}

# 清除 pane 输入（发送 Ctrl+C）
clear_pane_input() {
    local target="${1:?需要指定 target_pane}"
    tmux send-keys -t "$target" C-c
    sleep 0.5
}

# 获取会话状态信息
get_session_status() {
    local target="${1:?需要指定 target_pane}"

    local exists="false"
    local ready="false"
    local output=""

    if tmux has-session -t "${target%%:*}" 2>/dev/null; then
        exists="true"
        output=$(get_pane_output "$target" 20)
        if is_claude_ready "$target"; then
            ready="true"
        fi
    fi

    # 检查 jq 是否可用
    if command -v jq &>/dev/null; then
        cat <<EOF
{
  "target": "$target",
  "exists": $exists,
  "ready": $ready,
  "recent_output": $(echo "$output" | tail -10 | jq -Rs .)
}
EOF
    else
        # 无 jq 时使用简单格式
        cat <<EOF
{
  "target": "$target",
  "exists": $exists,
  "ready": $ready,
  "recent_output": "$(echo "$output" | tail -10 | sed 's/"/\\"/g' | tr '\n' ' ')"
}
EOF
    fi
}

#===============================================================================
# Worker-Supervisor 专用函数
#===============================================================================

SUPERVISOR_SESSION="${SUPERVISOR_SESSION:-claude-supervisor}"

# 检查 Supervisor 是否运行
supervisor_running() {
    tmux has-session -t "$SUPERVISOR_SESSION" 2>/dev/null
}

# 向 Supervisor 请求并等待响应
ask_supervisor() {
    local prompt="${1:?需要指定 prompt}"
    local idle="${2:-$SYNC_IDLE_SECONDS}"
    local max_wait="${3:-$SYNC_MAX_WAIT}"

    if ! supervisor_running; then
        echo -e "${RED}Supervisor 未运行${NC}" >&2
        return 1
    fi

    send_and_wait "$SUPERVISOR_SESSION" "$prompt" "$idle" "$max_wait"
}

# 请求 Supervisor 审查
supervisor_review() {
    local description="${1:?需要指定描述}"
    local content="${2:?需要指定内容}"

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

    ask_supervisor "$prompt" 5 60
}

# 请求 Supervisor 决策
supervisor_decide() {
    local question="${1:?需要指定问题}"
    local context="${2:-}"

    local prompt="作为技术决策者，请回答：

问题：$question"

    if [[ -n "$context" ]]; then
        prompt="$prompt

上下文：
$context"
    fi

    prompt="$prompt

请提供：
1. 推荐方案
2. 理由
3. 需要注意的风险"

    ask_supervisor "$prompt" 5 45
}

# 请求 Supervisor 制定计划
supervisor_plan() {
    local task="${1:?需要指定任务}"

    local prompt="作为技术架构师，请为以下任务制定实施计划：

任务：$task

请提供：
1. 任务分解（步骤列表）
2. 每步的具体操作
3. 预期输出
4. 风险点"

    ask_supervisor "$prompt" 5 60
}

#===============================================================================
# CLI 命令处理
#===============================================================================

show_help() {
    cat << 'EOF'
tmux_claude_sync.sh - Claude Code 会话间同步协作工具

用法：
  source tmux_claude_sync.sh    # 加载为函数库
  ./tmux_claude_sync.sh <cmd>   # 直接运行命令

核心命令：
  wait <target> [idle] [max]    等待 pane 输出完成
  send <target> <cmd> [idle]    发送命令并等待完成
  ask <target> <cmd> [wait]     发送并获取响应
  output <target> [lines]       获取 pane 输出
  ready <target>                检查 Claude 是否就绪
  status <target>               获取会话状态（JSON）
  clear <target>                清除 pane 输入

Supervisor 命令（需要 claude-supervisor 会话）：
  supervisor-ask <prompt>       向 Supervisor 提问并等待
  supervisor-review <desc> <content>  请求代码审查
  supervisor-decide <question> [ctx]  请求决策
  supervisor-plan <task>        请求制定计划

参数说明：
  target      tmux 目标 (session 或 session:window.pane)
  idle        内容稳定时间（秒），默认 3
  max         最大等待时间（秒），默认 120
  lines       捕获行数，默认 200

环境变量：
  SYNC_IDLE_SECONDS     默认稳定时间 (3)
  SYNC_MAX_WAIT         默认最大等待 (120)
  SYNC_POLL_INTERVAL    轮询间隔 (1)
  SUPERVISOR_SESSION    Supervisor 会话名 (claude-supervisor)

示例：
  # 等待 Supervisor 响应完成
  ./tmux_claude_sync.sh wait claude-supervisor

  # 发送命令并等待
  ./tmux_claude_sync.sh send claude-supervisor "分析这个问题" 5 60

  # 检查是否就绪
  ./tmux_claude_sync.sh ready claude-supervisor && echo "就绪"

  # 请求 Supervisor 审查代码
  ./tmux_claude_sync.sh supervisor-review "auth.py" "$(cat auth.py)"

  # 作为函数库使用
  source tmux_claude_sync.sh
  output=$(ask_supervisor "如何实现这个功能？")
  echo "$output"
EOF
}

main() {
    local cmd="${1:-help}"
    shift 2>/dev/null || true

    # 帮助命令不需要检查依赖
    if [[ "$cmd" != "help" && "$cmd" != "--help" && "$cmd" != "-h" ]]; then
        _check_deps || return 1
    fi

    case "$cmd" in
        # 核心命令
        wait)
            wait_tmux_output "$@"
            ;;
        send)
            send_and_wait "$@"
            ;;
        ask)
            ask_sync "$@"
            ;;
        output|get)
            get_pane_output "$@"
            ;;
        ready)
            if is_claude_ready "$1"; then
                echo -e "${GREEN}Claude 就绪${NC}"
                return 0
            else
                echo -e "${YELLOW}Claude 未就绪${NC}"
                return 1
            fi
            ;;
        status)
            get_session_status "$@"
            ;;
        clear)
            clear_pane_input "$@"
            echo -e "${GREEN}输入已清除${NC}"
            ;;

        # Supervisor 命令
        supervisor-ask)
            ask_supervisor "$@"
            ;;
        supervisor-review)
            supervisor_review "$@"
            ;;
        supervisor-decide)
            supervisor_decide "$@"
            ;;
        supervisor-plan)
            supervisor_plan "$@"
            ;;

        # 帮助
        help|--help|-h)
            show_help
            ;;

        *)
            echo -e "${RED}未知命令: $cmd${NC}" >&2
            echo "使用 '$0 help' 查看帮助" >&2
            return 1
            ;;
    esac
}

# 如果直接运行脚本（不是 source）
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
