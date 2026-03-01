# Custom CLI Skills

This directory contains custom CLI skills and automation for this project.

## Structure

Each skill is a directory containing:
- `SKILL.md` — Skill definition and metadata
- `skill.ts` or `skill.js` — Implementation

## Getting Started

Create a new skill:
```bash
mkdir -p _claude/skills/my-skill
echo "# My Skill" > _claude/skills/my-skill/SKILL.md
```

Then reference it in your Claude instructions.

## Resources

- [Claude Code Documentation](https://claude.com/claude-code)
- [Skills System](https://docs.anthropic.com/claude/reference/skills)
