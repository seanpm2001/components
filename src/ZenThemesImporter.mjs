const kZenStylesheetThemeHeader = `
/* Zen Themes - Generated by ZenThemeImporter.
  * DO NOT EDIT THIS FILE DIRECTLY!
  * Your changes will be overwritten.
  * Instead, go to the preferences and edit the themes there.
  */
`;
const kenStylesheetFooter = `
/* End of Zen Themes */
`;
var gZenStylesheetManager = {
  async writeStylesheet(path, themes) {
    let content = kZenStylesheetThemeHeader;
    for (let theme of themes) {
      content += this.getThemeCSS(theme);
    }
    content += kenStylesheetFooter;
    let buffer = new TextEncoder().encode(content);
    await IOUtils.write(path, buffer);
  },

  getThemeCSS(theme) {
    let css = '\n';
    if (theme._readmeURL) {
      css += `/* Name: ${theme.name} */\n`;
      css += `/* Description: ${theme.description} */\n`;
      css += `/* Author: @${theme.author} */\n`;
      css += `/* Readme: ${theme.readme} */\n`;
    }
    css += `@import url("${theme._chromeURL}");\n`;
    return css;
  },
};

var gZenThemeImporter = new (class {
  constructor() {
    console.info('ZenThemeImporter: Initiating Zen theme importer');
    try {
      window.SessionStore.promiseInitialized.then(async () => {
        this.insertStylesheet();
        await this.writeToDom();
      });
      console.info('ZenThemeImporter: Zen theme imported');
    } catch (e) {
      console.error('ZenThemeImporter: Error importing Zen theme: ', e);
    }
    Services.prefs.addObserver('zen.themes.updated-value-observer', this.rebuildThemeStylesheet.bind(this), false);
  }

  get sss() {
    if (!this._sss) {
      this._sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
    }
    return this._sss;
  }

  get styleSheetPath() {
    return PathUtils.join(PathUtils.profileDir, 'chrome', 'zen-themes.css');
  }

  get themesRootPath() {
    return PathUtils.join(PathUtils.profileDir, 'chrome', 'zen-themes');
  }

  get themesDataFile() {
    return PathUtils.join(PathUtils.profileDir, 'zen-themes.json');
  }

  getThemeFolder(theme) {
    return PathUtils.join(this.themesRootPath, theme.id);
  }

  async getThemes() {
    if (!this._themes) {
      if (!(await IOUtils.exists(this.themesDataFile))) {
        await IOUtils.writeJSON(this.themesDataFile, {});
      }
      this._themes = await IOUtils.readJSON(this.themesDataFile);
    }
    return this._themes;
  }

  rebuildThemeStylesheet() {
    this._themes = null;
    this.updateStylesheet();
  }

  get styleSheetURI() {
    if (!this._styleSheetURI) {
      this._styleSheetURI = Services.io.newFileURI(new FileUtils.File(this.styleSheetPath));
    }
    return this._styleSheetURI;
  }

  getStylesheetURIForTheme(theme) {
    return Services.io.newFileURI(new FileUtils.File(PathUtils.join(this.getThemeFolder(theme), 'chrome.css')));
  }

  insertStylesheet() {
    if (IOUtils.exists(this.styleSheetPath)) {
      this.sss.loadAndRegisterSheet(this.styleSheetURI, this.sss.AGENT_SHEET);
    }
  }

  removeStylesheet() {
    this.sss.unregisterSheet(this.styleSheetURI, this.sss.AGENT_SHEET);
  }

  async updateStylesheet() {
    this.removeStylesheet();
    await this.writeStylesheet();
    await this.writeToDom();
    this.insertStylesheet();
  }

  _getBrowser() {
    if (!this.__browser) {
      this.__browser = Services.wm.getMostRecentWindow("navigator:browser")
    }

    return this.__browser
  }

  async _getThemePreferences(theme) {
    const themePath = PathUtils.join(this.getThemeFolder(theme), 'preferences.json');

    if (!(await IOUtils.exists(themePath)) || !theme.preferences) {
      return { preferences: [], isLegacyMode: false };
    }

    let preferences = await IOUtils.readJSON(themePath);

    // skip transformation, we won't be writing old preferences to dom, all of them can only be checkboxes
    if (typeof preferences === "object" && !Array.isArray(preferences)) {
      return { preferences: [], areOldPreferences: true };
    }

    return { preferences, areOldPreferences: false };
  }

  async writeToDom() {
    const browser = this._getBrowser()

    for (const theme of Object.values(await this.getThemes())) {
      const { preferences, areOldPreferences } = await this._getThemePreferences(theme);

      if (areOldPreferences) {
        continue;
      }

      const themePreferences = preferences.filter(({ type }) => type === "dropdown")

      for (const { property } of themePreferences) {
        const value = Services.prefs.getStringPref(property, "")

        if (value !== "") {
          let element = browser.document.getElementById(theme.name)

          if (!element) {
            element = browser.document.createElement("div")

            element.style.display = "none"
            element.setAttribute("id", theme.name)

            browser.document.body.appendChild(element)
          }

          element.setAttribute(property, value)
        }
      }
    }
  }

  async writeStylesheet() {
    const themes = [];
    this._themes = null;
    for (let theme of Object.values(await this.getThemes())) {
      theme._chromeURL = this.getStylesheetURIForTheme(theme).spec;
      themes.push(theme);
    }
    await gZenStylesheetManager.writeStylesheet(this.styleSheetPath, themes);
  }
})();
