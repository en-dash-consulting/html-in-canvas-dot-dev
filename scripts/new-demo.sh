#!/usr/bin/env bash
# scripts/new-demo.sh — Scaffold a new demo from the _template directory.
#
# Usage:
#   ./scripts/new-demo.sh <slug>
#
# Example:
#   ./scripts/new-demo.sh gradient-text
#
# Creates src/content/demos/<slug>/ with a ready-to-edit meta.json and demo.html.

set -euo pipefail

# -----------------------------------------------------------------------
# Resolve paths relative to the repository root (parent of scripts/)
# -----------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEMOS_DIR="$ROOT_DIR/src/content/demos"
TEMPLATE_DIR="$DEMOS_DIR/_template"

# -----------------------------------------------------------------------
# Validate arguments
# -----------------------------------------------------------------------
if [ $# -lt 1 ]; then
  echo "Usage: $0 <slug>" >&2
  echo "  slug: kebab-case directory name (e.g. gradient-text)" >&2
  exit 1
fi

SLUG="$1"

# Enforce kebab-case: lowercase letters, digits, hyphens only
if ! echo "$SLUG" | grep -qE '^[a-z][a-z0-9-]*[a-z0-9]$'; then
  echo "Error: slug must be kebab-case (lowercase letters, digits, hyphens)." >&2
  echo "  Example: gradient-text" >&2
  exit 1
fi

TARGET_DIR="$DEMOS_DIR/$SLUG"

if [ -d "$TARGET_DIR" ]; then
  echo "Error: directory already exists: $TARGET_DIR" >&2
  exit 1
fi

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo "Error: template directory not found: $TEMPLATE_DIR" >&2
  exit 1
fi

# -----------------------------------------------------------------------
# Copy template and customise
# -----------------------------------------------------------------------
cp -r "$TEMPLATE_DIR" "$TARGET_DIR"

# Pre-fill the slug into meta.json title and demo.html title
TODAY=$(date +%Y-%m-%d)

# Convert slug to title case: "gradient-text" -> "Gradient Text"
TITLE=$(echo "$SLUG" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')

# Update meta.json: replace placeholder title, set dateCreated, remove _field_docs
python3 -c "
import json, sys
with open('$TARGET_DIR/meta.json') as f:
    data = json.load(f)
data['title'] = '$TITLE'
data['dateCreated'] = '$TODAY'
data['author'] = ''
data.pop('_field_docs', None)
with open('$TARGET_DIR/meta.json', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"

# Update demo.html title
sed -i '' "s|<title>Demo Title</title>|<title>$TITLE — HTML-in-Canvas</title>|" "$TARGET_DIR/demo.html"

echo "Created: $TARGET_DIR/"
echo "  meta.json  — fill in description, tags, features"
echo "  demo.html  — edit the canvas content and paint logic"
echo ""
echo "Start the dev server to preview:"
echo "  npm run dev"
echo "  open http://localhost:4321/demos/$SLUG/"
