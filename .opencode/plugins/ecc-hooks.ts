import type { PluginInput } from "@opencode-ai/plugin"

export const ECCHooksPlugin = async ({
  client,
  $,
  directory,
  worktree,
}: PluginInput) => {
  type HookProfile = "minimal" | "standard" | "strict"

  const editedFiles = new Set<string>()

  const log = (level: "debug" | "info" | "warn" | "error", message: string) =>
    client.app.log({ body: { service: "ecc", level, message } })

  const normalizeProfile = (value: string | undefined): HookProfile => {
    if (value === "minimal" || value === "strict") return value
    return "standard"
  }

  const currentProfile = normalizeProfile(process.env.ECC_HOOK_PROFILE)
  const disabledHooks = new Set(
    (process.env.ECC_DISABLED_HOOKS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  )

  const profileOrder: Record<HookProfile, number> = {
    minimal: 0,
    standard: 1,
    strict: 2,
  }

  const profileAllowed = (required: HookProfile | HookProfile[]): boolean => {
    if (Array.isArray(required)) {
      return required.some((entry) => profileOrder[currentProfile] >= profileOrder[entry])
    }
    return profileOrder[currentProfile] >= profileOrder[required]
  }

  const hookEnabled = (
    hookId: string,
    requiredProfile: HookProfile | HookProfile[] = "standard"
  ): boolean => {
    if (disabledHooks.has(hookId)) return false
    return profileAllowed(requiredProfile)
  }

  return {
    "file.edited": async (event: { path: string }) => {
      editedFiles.add(event.path)

      if (hookEnabled("post:edit:format", ["strict"]) && event.path.match(/\.(ts|tsx|js|jsx)$/)) {
        try {
          await $`prettier --write ${event.path} 2>/dev/null`
          log("info", `[ECC] Formatted: ${event.path}`)
        } catch {}
      }

      if (hookEnabled("post:edit:console-warn", ["standard", "strict"]) && event.path.match(/\.(ts|tsx|js|jsx)$/)) {
        try {
          const result = await $`grep -n "console\\.log" ${event.path} 2>/dev/null`.text()
          if (result.trim()) {
            const lines = result.trim().split("\n").length
            log("warn", `[ECC] console.log found in ${event.path} (${lines} occurrence${lines > 1 ? "s" : ""})`)
          }
        } catch {}
      }
    },

    "tool.execute.after": async (
      input: { tool: string; args?: { filePath?: string } },
      output: unknown
    ) => {
      if (
        hookEnabled("post:edit:typecheck", ["strict"]) &&
        input.tool === "edit" &&
        input.args?.filePath?.match(/\.tsx?$/)
      ) {
        try {
          await $`npx tsc --noEmit 2>&1`
          log("info", "[ECC] TypeScript check passed")
        } catch (error: unknown) {
          const err = error as { stdout?: string }
          log("warn", "[ECC] TypeScript errors detected:")
          if (err.stdout) {
            const errors = err.stdout.split("\n").slice(0, 5)
            errors.forEach((line: string) => log("warn", `  ${line}`))
          }
        }
      }
    },

    "tool.execute.before": async (
      input: { tool: string; args?: Record<string, unknown> }
    ) => {
      if (
        hookEnabled("pre:bash:git-push-reminder", "strict") &&
        input.tool === "bash" &&
        input.args?.toString().includes("git push")
      ) {
        log("info", "[ECC] Remember to review changes before pushing: git diff origin/main...HEAD")
      }

      if (
        hookEnabled("pre:write:doc-file-warning", ["standard", "strict"]) &&
        input.tool === "write" &&
        input.args?.filePath &&
        typeof input.args.filePath === "string"
      ) {
        const filePath = input.args.filePath
        if (
          filePath.match(/\.(md|txt)$/i) &&
          !filePath.includes("README") &&
          !filePath.includes("CHANGELOG") &&
          !filePath.includes("LICENSE") &&
          !filePath.includes("CONTRIBUTING")
        ) {
          log("warn", `[ECC] Creating ${filePath} - consider if this documentation is necessary`)
        }
      }
    },

    "session.created": async () => {
      if (!hookEnabled("session:start", ["minimal", "standard", "strict"])) return
      log("info", `[ECC] Session started - profile=${currentProfile}`)

      try {
        const hasClaudeMd = await $`test -f ${worktree}/CLAUDE.md && echo "yes"`.text()
        if (hasClaudeMd.trim() === "yes") {
          log("info", "[ECC] Found CLAUDE.md - loading project context")
        }
      } catch {}
    },

    "session.idle": async () => {
      if (!hookEnabled("stop:check-console-log", ["minimal", "standard", "strict"])) return
      if (editedFiles.size === 0) return

      log("info", "[ECC] Session idle - running console.log audit")

      let totalConsoleLogCount = 0
      const filesWithConsoleLogs: string[] = []

      for (const file of editedFiles) {
        if (!file.match(/\.(ts|tsx|js|jsx)$/)) continue

        try {
          const result = await $`grep -c "console\\.log" ${file} 2>/dev/null`.text()
          const count = parseInt(result.trim(), 10)
          if (count > 0) {
            totalConsoleLogCount += count
            filesWithConsoleLogs.push(file)
          }
        } catch {}
      }

      if (totalConsoleLogCount > 0) {
        log("warn", `[ECC] Audit: ${totalConsoleLogCount} console.log statement(s) in ${filesWithConsoleLogs.length} file(s)`)
        filesWithConsoleLogs.forEach((f) => log("warn", `  - ${f}`))
        log("warn", "[ECC] Remove console.log statements before committing")
      } else {
        log("info", "[ECC] Audit passed: No console.log statements found")
      }

      editedFiles.clear()
    },

    "session.deleted": async () => {
      if (!hookEnabled("session:end-marker", ["minimal", "standard", "strict"])) return
      log("info", "[ECC] Session ended - cleaning up")
      editedFiles.clear()
    },

    "shell.env": async () => {
      const env: Record<string, string> = {
        ECC_VERSION: "1.9.0",
        ECC_PLUGIN: "true",
        ECC_HOOK_PROFILE: currentProfile,
        ECC_DISABLED_HOOKS: process.env.ECC_DISABLED_HOOKS || "",
        PROJECT_ROOT: worktree || directory,
      }

      const lockfiles: Record<string, string> = {
        "bun.lockb": "bun",
        "pnpm-lock.yaml": "pnpm",
        "yarn.lock": "yarn",
        "package-lock.json": "npm",
      }
      for (const [lockfile, pm] of Object.entries(lockfiles)) {
        try {
          await $`test -f ${worktree}/${lockfile}`
          env.PACKAGE_MANAGER = pm
          break
        } catch {}
      }

      const langDetectors: Record<string, string> = {
        "tsconfig.json": "typescript",
        "go.mod": "go",
        "pyproject.toml": "python",
        "Cargo.toml": "rust",
      }
      const detected: string[] = []
      for (const [file, lang] of Object.entries(langDetectors)) {
        try {
          await $`test -f ${worktree}/${file}`
          detected.push(lang)
        } catch {}
      }
      if (detected.length > 0) {
        env.DETECTED_LANGUAGES = detected.join(",")
        env.PRIMARY_LANGUAGE = detected[0]
      }

      return env
    },

    "permission.ask": async (event: { tool: string; args: unknown }) => {
      log("info", `[ECC] Permission requested for: ${event.tool}`)

      const cmd = String((event.args as Record<string, unknown>)?.command || event.args || "")

      if (["read", "glob", "grep", "search", "list"].includes(event.tool)) {
        return { approved: true, reason: "Read-only operation" }
      }

      if (event.tool === "bash" && /^(npx )?(prettier|biome|black|gofmt|rustfmt)/.test(cmd)) {
        return { approved: true, reason: "Formatter execution" }
      }

      if (event.tool === "bash" && /^(npm test|npx vitest|npx jest|pytest|go test|cargo test)/.test(cmd)) {
        return { approved: true, reason: "Test execution" }
      }

      return { approved: undefined }
    },
  }
}

export default ECCHooksPlugin