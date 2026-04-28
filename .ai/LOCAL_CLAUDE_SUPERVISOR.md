# Local Claude Supervisor

Plain `claude` is not supervised.

`vclaude` or `.\scripts\claude-supervised.ps1` is supervised.

If Claude hits a usage limit, rate limit, quota, context limit, or blocking terminal error inside supervised mode, Codex starts automatically and continues from `.ai/NEXT_AGENT_PROMPT.md`.

If you use plain `claude`, no automatic Codex failover can happen because the wrapper is not observing the session.

For full automation, always start Claude through the supervised wrapper:

```powershell
cd D:\vantro-flow
.\scripts\claude-supervised.ps1
```

After installing the profile helper, open a new PowerShell terminal and use:

```powershell
vclaude
```

The supervisor writes:

- `.ai/local-claude-session.log`
- `.ai/codex-after-claude-limit.log`
- `.ai/FAILOVER_LOG.md`
- `.ai/RUNNING_AGENT.md`
- `.ai/NEXT_AGENT_PROMPT.md`
