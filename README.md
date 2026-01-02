# Obsidian Assistant

An all-in-one assistant plugin that integrates multiple powerful Obsidian plugins into a unified, modular system. Obsidian Assistant combines the functionality of five popular plugins while adding improvements in architecture, internationalization, and user experience.

## 🌟 Features

Obsidian Assistant provides **five independent modules**, each can be enabled or disabled separately:

### 📝 MySnippets - CSS Snippet Manager
Manage your CSS snippets with ease through a convenient status bar menu.

- Toggle snippets on/off with a single click
- Quick access to snippet files
- Create new snippets with templates
- Reload snippets without restarting Obsidian
- Glass menu effect option

### 📁 MyFolders - Folder Visibility Manager
Hide and show folders in your file explorer to reduce visual clutter.

- Hide specific folders by name
- Support for exact match, `startsWith::`, and `endsWith::` patterns
- Case-insensitive matching option
- Add hidden folders to Obsidian's exclusion list
- Compatible with quick-explorer plugin

### ⚡ MyPlugins - Lazy Plugin Loader  
Optimize Obsidian's startup time by delaying plugin loading.

- Four loading modes: Disabled, Instant, Short delay, Long delay
- Configure individual plugins with different startup times
- Separate desktop/mobile configurations
- Batch operations for quick setup
- Staggered loading to prevent performance spikes

### 🎛️ MyStatusBar - Status Bar Organizer
Customize your status bar by reordering and hiding elements.

- Drag-and-drop reordering
- Toggle element visibility
- Multiple presets support
- Fullscreen mode presets
- Hotkey support for quick preset switching

### 🔢 MyHeadings & MyFormulas - Number Adder
Automatically number headings and mathematical formulas in your documents.

**MyHeadings:**
- 5 numbering styles: `1` (Arabic), `A` (Uppercase), `a` (Lowercase), `一` (Chinese), `①` (Circled)
- Customizable separators and start values
- Configurable level ranges (H1-H6)
- Skip specific headings
- Auto-numbering mode

**MyFormulas:**
- Automatic formula numbering with `\tag{}`  
- Continuous mode: `(1)`, `(2)`, `(3)`...
- Heading-based mode: `(1.1-1)`, `(1.1-2)`...
- Adjustable depth control for heading-based mode
- Code block and table protection

---

## 📦 Installation

### From Release

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/yourusername/obsidian-assistant/releases)
2. Create a folder named `obsidian-assistant` in your vault's `.obsidian/plugins/` directory
3. Place the downloaded files into this folder
4. Restart Obsidian and enable the plugin in Settings → Community Plugins

### Manual Build

```bash
# Clone the repository
git clone https://github.com/yourusername/obsidian-assistant.git
cd obsidian-assistant/obsidian-assistant

# Install dependencies
npm install

# Build the plugin
npm run build

# The output files will be in the current directory
```

---

## 🚀 Usage

### Module Management

Each module can be independently enabled or disabled in the plugin settings:

1. Open Settings → Obsidian Assistant
2. Navigate to the module you want to configure
3. Toggle the "Enable" switch
4. Configure module-specific settings

### Module-Specific Usage

#### MySnippets
- Click the CSS snippet icon in the status bar
- Use command palette: "Open snippets in status bar" or "Create new CSS snippet"

#### MyFolders
- Configure folders to hide in settings
- Click the ribbon icon or use command: "Toggle visibility of hidden folders"

#### MyPlugins
- Configure plugin loading modes in settings
- Plugins will automatically load with the specified delay on startup

#### MyStatusBar
- Configure element order and visibility in settings  
- Create and switch between presets
- Use hotkeys for quick preset switching

#### MyHeadings
- Use command: "Number Headings" for manual numbering
- Enable auto-numbering in settings or control panel
- Use command: "Configure Headings" to open control panel

#### MyFormulas
- Use command: "Number Formulas" for manual numbering
- Enable auto-numbering in settings or control panel
- Use command: "Configure Formulas" to open control panel

---

## 🌐 Internationalization

Obsidian Assistant supports multiple languages:
- 🇬🇧 English
- 🇨🇳 简体中文 (Simplified Chinese)

The language will automatically match your Obsidian interface language.

---

## 🙏 Acknowledgments

Obsidian Assistant integrates and enhances the work of several amazing plugin developers. We are deeply grateful to:

### Original Plugin Authors

1. **[chetachi](https://github.com/chetachiezikeuzor)** - Creator of [MySnippets Plugin](https://github.com/chetachiezikeuzor/mysnippets-plugin)
   - Original CSS snippet manager with status bar integration

2. **[JonasDoesThings](https://github.com/JonasDoesThings)** - Creator of [Hide Folders](https://github.com/JonasDoesThings/obsidian-hide-folders)
   - Original folder visibility management system

3. **[Alan Grainger](https://github.com/alangrainger)** - Creator of [Lazy Plugin Loader](https://github.com/alangrainger/obsidian-lazy-plugins)
   - Original delayed plugin loading mechanism

4. **[Kacper Darowski (opisek)](https://opisek.net/)** - Creator of [Status Bar Organizer](https://github.com/Phrisk/obsidian-statusbar-organizer)
   - Original status bar customization system

5. **[Kevin Albrecht (onlyafly)](https://www.kevinalbrecht.com)** - Creator of [Number Headings](https://github.com/onlyafly/number-headings-obsidian)
   - Original heading numbering algorithm and core logic foundation for the Number Adder enhanced version

### Enhanced Version Contributors

- **[Randy Allen](https://github.com/RandyAllenEEE)** - Developer of the enhanced Number Adder version
  - Added formula numbering functionality
  - Implemented Chinese numbering support (一, 二, 三) and circled numbers (①, ②, ③)
  - Enhanced with heading-based formula mode and depth control
  - Improved code block and table protection mechanisms

---

## 🎯 Why Obsidian Assistant?

### Benefits of Integration

1. **Unified Management**: Control all modules from a single settings interface
2. **Reduced Overhead**: One plugin instead of five reduces startup time and memory usage
3. **Consistent UX**: Unified design language and interaction patterns
4. **Better Maintenance**: Centralized updates and bug fixes
5. **Enhanced Architecture**: Modern TypeScript codebase with improved error handling
6. **Internationalization**: Built-in support for multiple languages

### Key Improvements

- **Modular Architecture**: Each module is independently maintainable
- **TypeScript**: Full type safety and better IDE support
- **i18n Support**: Comprehensive internationalization framework
- **Error Handling**: Robust error recovery mechanisms
- **Resource Management**: Proper lifecycle management prevents memory leaks
- **Code Quality**: Modern patterns and best practices

---

## 📄 License

MIT License

Copyright (c) 2026 Randy Allen

This project integrates code from multiple open-source plugins (see Acknowledgments). Each original plugin retains its original license and copyright. The integration work, TypeScript refactoring, and enhancements are licensed under MIT.

---

## 🐛 Bug Reports & Feature Requests

If you encounter any issues or have suggestions:

1. Check existing [Issues](https://github.com/yourusername/obsidian-assistant/issues)
2. Create a new issue with detailed information
3. For module-specific issues, please mention which module is affected

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📚 Documentation

For detailed documentation on each module:

- [MySnippets Documentation](./docs/mysnippets.md)
- [MyFolders Documentation](./docs/myfolders.md)
- [MyPlugins Documentation](./docs/myplugins.md)
- [MyStatusBar Documentation](./docs/mystatusbar.md)
- [MyHeadings Documentation](./docs/myheadings.md)
- [MyFormulas Documentation](./docs/myformulas.md)

---

## ⭐ Support

If you find this plugin helpful:

- ⭐ Star the repository
- 🐛 Report bugs and suggest features
- 📢 Share with the Obsidian community
- ☕ Consider supporting the original plugin authors (links in Acknowledgments)

---

**Made with ❤️ for the Obsidian community**
