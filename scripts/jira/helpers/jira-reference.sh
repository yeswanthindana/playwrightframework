#!/usr/bin/env bash

# Read-only Jira reference helper.
# It retrieves Jira configuration data and never creates or modifies Jira issues.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
test_env="${TEST_ENV:-qa}"
env_file="${JIRA_ENV_FILE:-$repo_root/config/environments/$test_env.env}"

if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
fi

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        printf 'Required command is unavailable: %s\n' "$1" >&2
        exit 1
    fi
}

usage() {
    cat <<'EOF'
Usage:
  ./scripts/jira/helpers/jira-reference.sh <command> [value]

Read-only commands:
  auth                  Verify credentials and show the current Jira member
  myself                Show current Jira account details
  fields                List Jira fields and their IDs
  test-fields           Show fields commonly used by the test integration
  editmeta ISSUE_KEY    Show editable fields and allowed values for an issue
  link-types            List issue-link type IDs and directions
  project [PROJECT_KEY] Show project information (default: EVR)
  boards [PROJECT_KEY]  List visible Scrum boards (default: EVR)
  sprints [BOARD_ID]    List a board's sprints (default: 35)
  issue ISSUE_KEY       Show key integration fields for an issue
  help                  Show this message

Configuration is loaded from config/environments/${TEST_ENV:-qa}.env by default.
Override it with JIRA_ENV_FILE=/absolute/path/to/file. Missing credentials are
requested interactively; the API token is entered invisibly.
EOF
}

require_value() {
    local label="$1"
    local value="${2:-}"
    if [[ -z "$value" ]]; then
        printf '%s is required.\n\n' "$label" >&2
        usage >&2
        exit 2
    fi
}

initialise_credentials() {
    require_command curl
    require_command jq

    JIRA_BASE_URL="${JIRA_BASE_URL:-https://aether.atlassian.net}"
    JIRA_BASE_URL="${JIRA_BASE_URL%/}"

    if [[ -z "${JIRA_EMAIL:-}" ]]; then
        read -r -p 'Jira email: ' JIRA_EMAIL
    fi
    if [[ -z "${JIRA_API_TOKEN:-}" ]]; then
        read -r -s -p 'Jira API token: ' JIRA_API_TOKEN
        printf '\n'
    fi

    if [[ -z "$JIRA_EMAIL" || -z "$JIRA_API_TOKEN" ]]; then
        printf 'Jira email and API token are required.\n' >&2
        exit 2
    fi
}

jira_get() {
    local resource="$1"
    curl --fail-with-body --silent --show-error \
        --request GET \
        --url "$JIRA_BASE_URL$resource" \
        --user "$JIRA_EMAIL:$JIRA_API_TOKEN" \
        --header 'Accept: application/json'
}

command_name="${1:-help}"
command_value="${2:-}"

if [[ "$command_name" == "help" || "$command_name" == "--help" || "$command_name" == "-h" ]]; then
    usage
    exit 0
fi

initialise_credentials

case "$command_name" in
    auth|myself)
        jira_get '/rest/api/3/myself' |
            jq '{accountId, displayName, emailAddress, active, timeZone, locale}'
        ;;
    fields)
        jira_get '/rest/api/3/field' |
            jq 'sort_by(.name) | map({id, name, schema})'
        ;;
    test-fields)
        jira_get '/rest/api/3/field' |
            jq 'map(select(.name | test("Test Steps|Expected Result|Test Data|Execution Status|Executed By|Environment|Sprint"; "i"))) | sort_by(.name) | map({id, name, schema})'
        ;;
    editmeta)
        require_value 'ISSUE_KEY' "$command_value"
        jira_get "/rest/api/3/issue/$command_value/editmeta" |
            jq '{fields: (.fields | to_entries | map({id: .key, name: .value.name, required: .value.required, schema: .value.schema, allowedValues: .value.allowedValues}))}'
        ;;
    link-types)
        jira_get '/rest/api/3/issueLinkType' |
            jq '.issueLinkTypes | map({id, name, inward, outward})'
        ;;
    project)
        project_key="${command_value:-EVR}"
        jira_get "/rest/api/3/project/$project_key" |
            jq '{id, key, name, projectTypeKey, simplified, lead}'
        ;;
    boards)
        project_key="${command_value:-EVR}"
        jira_get "/rest/agile/1.0/board?projectKeyOrId=$project_key&type=scrum&maxResults=100" |
            jq '{boards: [.values[] | {id, name, type, location}]}'
        ;;
    sprints)
        board_id="${command_value:-35}"
        jira_get "/rest/agile/1.0/board/$board_id/sprint?state=active,future,closed&maxResults=100" |
            jq --arg boardId "$board_id" '{boardId: $boardId, sprints: [.values[] | {id, name, state, goal, startDate, endDate, completeDate}]}'
        ;;
    issue)
        require_value 'ISSUE_KEY' "$command_value"
        jira_get "/rest/api/3/issue/$command_value?fields=summary,issuetype,project,priority,status,labels,environment,customfield_10281,customfield_10282,customfield_10283,customfield_10284,customfield_10285,customfield_10020,issuelinks" |
            jq '{key, id, fields}'
        ;;
    *)
        printf 'Unknown command: %s\n\n' "$command_name" >&2
        usage >&2
        exit 2
        ;;
esac
