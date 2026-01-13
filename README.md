# Klassroom

Generate HTML semester presentations from Polish school grade exports.

## Features

- 📊 **Beautiful Charts**: Automatically generated grade distributions and attendance stats.
- 🇵🇱 **Polish Language**: All output (charts, labels, UI) is in Polish.
- 🔒 **GDPR Compliant**: Processes data locally, outputting only student numbers (no names).
- 🏫 **Vulcan UONET+ Support**: Native support for the "Internal Documentation" XLSX export.

## Supported Formats

- ✅ **Vulcan UONET+**: Fully supported. Requires "Internal Documentation" export (additional sheets like "Okres klasyfikacyjny").
- 🚧 **Librus Synergia**: Planned (Not yet implemented).

## Installation

_Note: This project is currently a private monorepo. You need to build it from source._

**Prerequisites**

- Node.js >= 22
- pnpm

```bash
# Clone the repository
git clone https://github.com/bitcraft-apps/klassroom.git
cd klassroom

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Usage

The CLI generates a standalone HTML presentation file in the same directory as your input file.

```bash
# Run the CLI via node
node packages/cli/dist/cli.js generate path/to/grades.xlsx

# Output will be created at: path/to/grades.html
```

You can also link the executable globally for easier access:

```bash
cd packages/cli
pnpm link --global
klassroom generate path/to/grades.xlsx
```

### CLI Reference

**`klassroom generate <xlsx-path>`**

Generates an HTML presentation from the provided Vulcan XLSX file.

- `<xlsx-path>`: Path to the Vulcan UONET+ XLSX export file.

_Example:_

```bash
node packages/cli/dist/cli.js generate ./exports/semestr1.xlsx
# -> ./exports/semestr1.html
```

## Privacy & GDPR

This tool is designed with student privacy as a priority:

- **Local Processing**: All parsing and generation happens on your machine. Data is never sent to the cloud.
- **Anonymized Output**: The generated HTML file refers to students only by their journal number ("Nr w dzienniku"). Student names are used internally for parsing but are **never** included in the output.

## License

MIT © Bitcraft Apps
