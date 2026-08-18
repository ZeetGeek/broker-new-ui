# Sources of truth

Project context is NOT in this file. It lives in `AGENTS.md`.

| File | Covers | When to read |
|---|---|---|
| `AGENTS.md` (root) | What the product is, the core loop, roles, domain terms, scope | Already loaded via the `@AGENTS.md` import in `CLAUDE.md` |
| `app/AGENTS.md` | SEO, indexing policy, metadata, semantic HTML | **Read before creating or editing anything under `app/`** |

`app/AGENTS.md` is a nested file, so it does not load at session start. Open it
yourself before working on routes — do not wait to stumble across it.

Rules of engagement:

- These files are the authority. If something here or in chat contradicts them,
  the AGENTS files win.
- Do not duplicate their content into other files. One source, many readers.
- If you learn something durable about this project, propose adding it to
  `AGENTS.md` rather than keeping it in the conversation.
- Anything marked "open question" in `AGENTS.md` is genuinely undecided — ask,
  do not pick an answer.
