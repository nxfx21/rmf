# RobloxModFormat (RMF)

A universal, platform-neutral format for Roblox modding packages.

###### Disclaimer. The logic was written by me. A human. The UI however is made by Gemini 3 because my lazy ass can't be bothered to make a frontend. Regarding the commit names, I use GitHub Desktop which autofills them with AI Slop, however IT IS useful.

---
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
2. **Package**: Automatically bundle your files into the `.rmd`/`.rmf`/`.zip` (ZIP) package.

To run the web app locally:
```bash
cd app
npm install
npm run dev
```

### Deployment to GitHub Pages
This repository is configured with a GitHub Action to automatically deploy the web app.
1.  **Push your changes** to the `main` branch.
2.  Go to your repository **Settings** on GitHub.
3.  Navigate to **Pages** in the left sidebar.
4.  Under **Build and deployment > Source**, select **GitHub Actions**.
5. Your site will be live at `https://nxfx21.github.io/rmf/`!

## Development
This project is currently in the definition phase. Contributions to the specification are welcome!
