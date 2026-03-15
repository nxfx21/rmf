# RobloxModFormat (RMF)

A universal, platform-neutral format for Roblox modding packages.

## Why RMF?
Traditional modding often involves platform-specific metadata or messy zip structures. RMF provides a standardized way to package Roblox mods that is:
- **Cross-Platform**: No OS-specific files.
- **Parsable**: Simple JSON manifest.
- **Human-Readable**: Includes standard documentation.
- **Universal**: Uses the ubiquitous ZIP container.

## Specification
The full specification can be found in [specification.md](./specification.md).

## Example Structure
```text
my_mod.rmf (zip)
├── manifest.json
├── README.md
├── icon.png
├── content/
│   └── mod_logic.lua
└── assets/
    └── funny_sound.mp3
```

## Tools
### RMF Web App
Located in the `app/` directory. This tool allows you to:
1. **Validate**: Drag and drop your mod folder to check for RMF compliance.
2. **Package**: Automatically bundle your files into an `.rmf` (ZIP) package.

To run the web app locally:
```bash
cd app
npm install
npm run dev
```

## Development
This project is currently in the definition phase. Contributions to the specification are welcome!
