# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Klassroom generates HTML presentations for Polish parent-teacher meetings from school grade XLSX exports (Librus Synergia, later Vulcan UONET+).

## Critical Constraint

**GDPR**: Output must use student numbers (`number` field) only, never names. Student names exist in data for parsing but must never appear in generated output.

## Architecture

pnpm monorepo: `@klassroom/core` (parsing, analytics, charts, HTML generation) → `@klassroom/cli` (command-line interface) → `@klassroom/web` (future browser UI).

Pipeline: Parse XLSX → Calculate analytics → Generate chart configs → Render HTML presentation.

## Domain Knowledge

Librus XLSX export contains 6 Polish-named sheets:
- **Okres klasyfikacyjny** - grades matrix (students × subjects)
- **Dodatkowe informacje 1** - class metadata
- **Średnia uczniów** - student averages
- **Dodatkowe informacje 2** - attendance stats
- **Zachowanie** - behavior grades
- **Informacje o uczniach** - student details

Polish behavior grades map: wzorowe→exemplary, bardzo dobre→veryGood, dobre→good, poprawne→acceptable, nieodpowiednie→inappropriate, naganne→reprehensible.
