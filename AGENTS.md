# klassroom

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Klassroom generates HTML presentations for Polish parent-teacher meetings from school grade XLSX exports (Librus Synergia, later Vulcan UONET+).

## Critical Constraints

**GDPR**: Output must use student numbers (`number` field) only, never names. Student names exist in data for parsing but must never appear in generated output.

**Polish Output**: All user-facing output (chart labels, axis titles, UI text) must be in Polish. End users are Polish teachers and parents. Codebase uses English internally (variable names, comments, documentation).

## Architecture

pnpm monorepo: `@klassroom/core` (parsing, analytics, charts, HTML generation) → `@klassroom/cli` (command-line interface) → `@klassroom/web` (future browser UI).

Pipeline: Parse XLSX → Calculate analytics → Generate chart configs → Render HTML presentation.

## Development strategy

Adheres to following principles:
- **Minimalism**: Keep the code simple and easy to understand.
- **YAGNI** (You Ain't Gonna Need It): Avoid adding features until they are actually needed.
- **DRY** (Don't Repeat Yourself): Avoid duplicating code.
- **KISS** (Keep It Simple, Stupid): Keep the code simple and easy to understand.
- **Single Responsibility Principle**: Each function should have a single responsibility.

## Domain Knowledge

### Librus Synergia XLSX Export Format

Librus Synergia's "additional internal documentation" XLSX export contains 6 Polish-named sheets. Format detection requires at least 4 of these sheets to be present:

| Sheet Name | Purpose | Used by Parser |
|------------|---------|----------------|
| **Okres klasyfikacyjny** | Grades matrix with embedded behavior | ✅ Required |
| **Dodatkowe informacje 1** | Class metadata (horizontal form) | ✅ Required |
| **Średnia uczniów** | Student averages | ✅ Required |
| **Dodatkowe informacje 2** | Attendance stats | ❌ Not parsed |
| **Zachowanie** | Behavior summary (counts only) | ❌ Not parsed |
| **Informacje o uczniach** | Student details | ❌ Not parsed |

### Sheet Structures (Verified from Real Export)

**Okres klasyfikacyjny (Grades)**:
- Row 0: Headers `["Nr w dzienniku", "Uczeń", "Zachowanie", "Nazwa przedmiotu", ...]`
- Row 1: Subject names `[null, null, null, "Religia", "Język polski", ...]`
- Row 2: Empty separator
- Row 3+: Student data `[number, name, behavior, grade1, grade2, ...]`
- Note: Behavior is embedded in column 2, NOT from the "Zachowanie" sheet

**Dodatkowe informacje 1 (Metadata)**:
- Row 0: Title with period `"Dodatkowe informacje dla 1 semestru w roku szkolnym 2024/2025"`
- Row 1: Horizontal form `["Oddział", "5b", "Wychowawca", null, null, "Teacher Name", ...]`

**Średnia uczniów (Averages)**:
- Row 0: Headers `["Numer w dzienniku", "Dane ucznia", "Średnia"]`
- Row 1+: Student data `[number, name, average]`

### Behavior Grade Mapping

Polish behavior grades map: wzorowe→exemplary, bardzo dobre→veryGood, dobre→good, poprawne→acceptable, nieodpowiednie→inappropriate, naganne→reprehensible.

### Future: Vulcan UONET+ Support

Vulcan UONET+ exports are not yet supported. They use different sheet structures and terminology. Format detection will reject non-Librus files with a helpful error message.
