---
name: changelog-writer
description: Use this skill when the user wants to create or update a changelog, release notes, product updates, or an MDX changelog page from git history or local code changes. This skill reads git status, diff, and commits, extracts user-visible product changes, and writes a changelog entry for the site in MDX format.
---

# Changelog Writer

Write changelog entries from the product perspective, not the implementation perspective.

## Use this skill when

- The user asks for `changelog`, `更新日志`, `release notes`, or `产品更新`
- The task requires reading `git log`, `git diff`, or uncommitted changes
- The output should be an MDX entry under `apps/site/changelog/content/`

## Goal

Turn technical changes into a concise product update that answers:

1. What changed for users
2. Why it matters
3. What became easier, faster, or more reliable

Do not center the writeup on refactors, file moves, lint cleanups, or dependency churn unless they produce a clear user-facing benefit.

## Workflow

1. Inspect repo state first
   - Run `git status --short`
   - Run `git diff --stat`
   - Run `git log --oneline -n 20`
2. Choose the right source of truth
   - For shipped work, inspect commits with `git log --stat` and `git show --stat <commit>`
   - For uncommitted work, inspect `git diff --stat` and targeted `git diff -- <path>`
3. Identify user-visible themes
   - Group changes into `Features`, `Improvements`, and `Fixes`
   - Merge low-level edits into broader product outcomes
4. Write the MDX entry
   - Save to `apps/site/changelog/content/YYYY-MM-DD.mdx`
   - Reuse the existing changelog page style and component conventions
5. Validate
   - Check frontmatter keys and date format
   - Make sure every bullet is understandable without reading the code

## Writing rules

- Favor user language:
  - Good: `Browser-based CLI login with device approval`
  - Bad: `Added auth-store, shared commands, and proxy updates`
- Mention internal work only when it changes reliability, accessibility, onboarding, discoverability, or supported workflows
- Keep the top summary to 3-5 bullets
- Prefer concrete outcomes such as `public docs with search`, `clearer extension controls`, `safer automation commands`
- Avoid claiming a feature is complete if the diff only adds infrastructure

## MDX format

Use this structure:

```mdx
---
title: "Short release title"
description: "One-sentence summary of the release."
date: "YYYY-MM-DD"
tags: ["Tag1", "Tag2"]
version: "x.y"
---

- **Summary point one** with user-facing wording
- **Summary point two** with user-facing wording
- **Summary point three** with user-facing wording

<Accordion type="multiple" collapsible className="w-full not-prose">
  <AccordionItem value="features">
    <AccordionTrigger>Features</AccordionTrigger>
    <AccordionContent className="flex flex-col gap-4 text-balance">
      <ul className="list-disc space-y-2 pl-4">
        <li>Feature detail</li>
      </ul>
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="improvements">
    <AccordionTrigger>Improvements</AccordionTrigger>
    <AccordionContent className="flex flex-col gap-4 text-balance">
      <ul className="list-disc space-y-2 pl-4">
        <li>Improvement detail</li>
      </ul>
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="fixes">
    <AccordionTrigger>Fixes</AccordionTrigger>
    <AccordionContent className="flex flex-col gap-4 text-balance">
      <ul className="list-disc space-y-2 pl-4">
        <li>Fix detail</li>
      </ul>
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

## MindPocket-specific guidance

- Default output path: `apps/site/changelog/content/`
- Existing entries are English MDX, even when the working conversation is Chinese
- The site changelog favors product framing over engineering detail
- Good themes for MindPocket:
  - multi-platform capture
  - CLI workflow
  - docs and onboarding
  - extension UX
  - reliability and test coverage

## Final check

Before finishing, verify:

- The title is readable on a marketing page
- The description can work as preview copy
- Tags are broad and useful
- Bullets describe visible value, not file edits
