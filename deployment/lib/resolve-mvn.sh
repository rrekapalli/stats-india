#!/bin/bash
# Resolve Maven executable (PATH, MVN env, or common install dirs).

resolve_mvn() {
    if [[ -n "${MVN:-}" && -x "$MVN" ]]; then
        echo "$MVN"
        return 0
    fi
    if command -v mvn >/dev/null 2>&1; then
        command -v mvn
        return 0
    fi
    local dir candidate
    for dir in "$HOME/.local/opt"/apache-maven-*/bin; do
        candidate="${dir}/mvn"
        if [[ -x "$candidate" ]]; then
            echo "$candidate"
            return 0
        fi
    done
    for candidate in /usr/share/maven/bin/mvn /opt/maven/bin/mvn; do
        if [[ -x "$candidate" ]]; then
            echo "$candidate"
            return 0
        fi
    done
    return 1
}
