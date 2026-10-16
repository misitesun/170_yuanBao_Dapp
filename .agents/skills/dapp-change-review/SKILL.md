---
name: dapp-change-review
description: Review a React H5 DApp change against project contracts without mutating files, Git state, dependencies, or external systems.
---

# DApp change review

Use this skill for a read-only review of a current diff, a proposed implementation plan, or a focused module change.

## Review boundaries

- Do not edit files, stage changes, install packages, commit, push, or call external write APIs.
- Review only the requested diff and the minimum surrounding code and documentation needed to establish its contract.
- Do not turn a review into an unsolicited refactor plan. Report concrete defects with evidence and priority.

## Required checks

1. Read `AGENTS.md`, `docs/ai-collaboration.md`, and the target module README.
2. Inspect the change scope, affected tests, public consumers, and relevant compatibility entries.
3. For PHP integrations, compare request and response handling with the supplied API Markdown contract and `docs/php-api-contracts.md`. Trace each mutation result to its consumer: flag parsing of an unused success body, and flag any shared `try/catch` that can relabel post-success refresh failure as mutation failure. Do not weaken parsing when the response supplies required contract, navigation, follow-up or download data.
4. For contract changes, inspect whether user-context reads correctly forward `account` and whether public reads remain account-free.
5. Check for direct use of restricted boundaries, unchecked casts, non-null assertions, stale-request races, missing refresh behavior, duplicate-write risk after misleading failure feedback, and unrequested scope expansion.
6. Separate blocking correctness issues from optional follow-ups. If no issue is found, say so and list the checks performed.

- 审查钱包登录/HTTP 地址头时，按 `docs/php-api-contracts.md` 的“登录地址一致性与取消”核对同轮签名/body/header 地址快照、真实换号/断开时 AbortController 取消、generation 隔离迟到结果、首次连接/同址事件不误取消及旧 Bearer 隔离；普通请求保持项目已确认的地址策略，不能从缓存推断当前身份。

## Finding format

Each finding should name the affected file or contract, explain the runtime consequence, state the evidence, and give the smallest safe remediation. Do not report speculative risks without a path from the actual diff to the failure.

## Submission interaction contract

For business mutations, wallet authorization or contract writes, read `docs/submit-interactions.md` before implementation or review. Preserve button/page copy, disable pending actions, reuse the ContractLoading water-droplet overlay, and show outcomes only through Toast with HTTP deduplication. Unlock inputs after failure; preserve server-signed raw values and the original order on retries instead of repeating a deduction. Verify pending/success/failure cleanup and keep mutation and refresh errors separate.
