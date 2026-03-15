# RobloxModFormat (RMF) Specification

**Version**: 1.0.0  
**Project Name**: RobloxModFormat (RMF)

## Overview
RobloxModFormat (RMF) is a cross-platform, easily parsable package format for Roblox modifications. It prioritizes simplicity and universal compatibility by avoiding platform-specific metadata files (like `.plist` or `.ini`) and using standard web formats (JSON, PNG, Markdown).

## The Container
All RMF projects are distributed as standard **ZIP** archives.
- **File Extension**: `.rmf` (preferred) or `.zip`.

## Directory Structure
An RMF package must follow this structure:

```text
/
├── manifest.json       (REQUIRED)
├── README.md           (OPTIONAL)
├── icon.png            (OPTIONAL)
├── thumbnail.png       (OPTIONAL)
├── content/            (OPTIONAL - Recommended for mod files)
└── assets/             (OPTIONAL - Recommended for media/other assets)
```

## Manifest (`manifest.json`)
The `manifest.json` file is the brain of the mod. It must be valid JSON.

### Required Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `rmf_version` | String | The version of the RMF spec used (e.g., "1.0.0"). |
| `id` | String | A unique identifier, typically in reverse domain format (e.g., `com.nexus.supermod`). |
| `name` | String | Human-readable name of the mod. |
| `version` | String | Semantic version of the mod (e.g., "1.2.3"). |
| `author` | String | Author name or handle. |

### Optional Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `description` | String | A short summary of what the mod does. |
| `tags` | Array | A list of string tags for searching/filtering. |
| `links` | Object | Key-value pairs of relevant URLs (e.g., `{"github": "...", "discord": "..."}`). |
| `dependencies` | Object | Map of `id: version_range` for other RMF mods. |

### Example `manifest.json`
```json
{
  "rmf_version": "1.0.0",
  "id": "com.nexus.coolmod",
  "name": "Cool Mod",
  "version": "1.0.0",
  "author": "NexusDev",
  "description": "A mod that adds neon lights to everything.",
  "tags": ["graphics", "visuals"],
  "links": {
    "github": "https://github.com/NexusDev/CoolMod"
  }
}
```

## Media Assets
- **icon.svg** (or .png): Recommended size is 512x512.
- **thumbnail.svg** (or .png): Recommended size is 1920x1080 (16:9 aspect ratio).
- Format: SVG is preferred for scaling; PNG/JPG are supported.

## Content and Assets
- **content/**: This directory should contain the modification data. For Roblox, this typically means:
    - `.rbxm` or `.rbxmx` (Roblox Model files for Studio import).
    - `.lua` (Source code for Studio-based development, NOT for runtime client-side injection).
    - `.json` (Configuration or data files).
- **assets/**: This directory should contain auxiliary media files like high-res images (`.png`, `.svg`), sounds (`.mp3`, `.ogg`), or additional documentation.

> [!IMPORTANT]
> **Safety First**: RMF is a data and asset packaging format. It does NOT provide a mechanism for loading untrusted scripts into the Roblox client. Users should never use third-party tools to inject executable code into their Roblox client, as this violates Roblox Terms of Service and may result in account bans.

## Guidelines
1. **No Platform-Specific Files**: Do not include `.DS_Store`, `thumbs.db`, `.plist`, `.ini`, or `.dat` files in the package.
2. **UTF-8 Encoding**: All text files (`manifest.json`, `README.md`) must use UTF-8 encoding.
3. **Case Sensitivity**: While Windows is case-insensitive, RMF names should be treated as case-sensitive for maximum compatibility.
