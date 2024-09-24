
const KEYCODE_MAP = {
  F1: 'VK_F1',
  F2: 'VK_F2',
  F3: 'VK_F3',
  F4: 'VK_F4',
  F5: 'VK_F5',
  F6: 'VK_F6',
  F7: 'VK_F7',
  F8: 'VK_F8',
  F9: 'VK_F9',
  F10: 'VK_F10',
  F11: 'VK_F11',
  F12: 'VK_F12',
  TAB: 'VK_TAB',
  ENTER: 'VK_RETURN',
  ESCAPE: 'VK_ESCAPE',
  SPACE: 'VK_SPACE',
  ARROWLEFT: 'VK_LEFT',
  ARROWRIGHT: 'VK_RIGHT',
  ARROWUP: 'VK_UP',
  ARROWDOWN: 'VK_DOWN',
  DELETE: 'VK_DELETE',
  BACKSPACE: 'VK_BACK',
};

const defaultKeyboardGroups = {
  windowAndTabManagement: [
    "zen-window-new-shortcut",
    "zen-tab-new-shortcut",
    "zen-key-enter-full-screen",
    "zen-key-exit-full-screen",
    "zen-quit-app-shortcut",
    "id:key_selectTab1",
    "id:key_selectTab2",
    "id:key_selectTab3",
    "id:key_selectTab4",
    "id:key_selectTab5",
    "id:key_selectTab6",
    "id:key_selectTab7",
    "id:key_selectTab8",
    "id:key_selectLastTab",
  ],
  navigation: [
    "zen-nav-back-shortcut-alt",
    "zen-nav-fwd-shortcut-alt",
    "zen-nav-reload-shortcut-2",
    "zen-nav-reload-shortcut-skip-cache",
    "zen-nav-reload-shortcut",
    "zen-key-stop",
    "id:goHome",
    "id:key_gotoHistory",
    "id:goBackKb",
    "id:goForwardKb",
  ],
  searchAndFind: [
    "zen-search-focus-shortcut",
    "zen-search-focus-shortcut-alt",
    "zen-find-shortcut",
    "zen-search-find-again-shortcut-2",
    "zen-search-find-again-shortcut",
    "zen-search-find-again-shortcut-prev",
  ],
  pageOperations: [
    "zen-location-open-shortcut",
    "zen-location-open-shortcut-alt",
    "zen-save-page-shortcut",
    "zen-print-shortcut",
    "zen-page-source-shortcut",
    "zen-page-info-shortcut",
    "zen-reader-mode-toggle-shortcut-other",
    "zen-picture-in-picture-toggle-shortcut"
  ],
  historyAndBookmarks: [
    "zen-history-show-all-shortcut",
    "zen-bookmark-this-page-shortcut",
    "zen-bookmark-show-library-shortcut"
  ],
  mediaAndDisplay: [
    "zen-mute-toggle-shortcut",
    "zen-full-zoom-reduce-shortcut",
    "zen-full-zoom-enlarge-shortcut",
    "zen-full-zoom-reset-shortcut",
    "zen-bidi-switch-direction-shortcut",
    "zen-private-browsing-shortcut",
    "zen-screenshot-shortcut"
  ],
};

const fixedL10nIds = {
  cmd_findPrevious: 'zen-search-find-again-shortcut-prev',
  "Browser:ReloadSkipCache": "zen-nav-reload-shortcut-skip-cache",
  cmd_close: "zen-close-tab-shortcut",
};

const ZEN_COMPACT_MODE_SHORTCUTS_GROUP = 'zen-compact-mode';
const ZEN_WORKSPACE_SHORTCUTS_GROUP = 'zen-workspace';
const ZEN_OTHER_SHORTCUTS_GROUP = 'zen-other';
const ZEN_SPLIT_VIEW_SHORTCUTS_GROUP = 'zen-split-view';
const FIREFOX_SHORTCUTS_GROUP = 'zen-kbs-invalid';
const VALID_SHORTCUT_GROUPS = [
  ZEN_COMPACT_MODE_SHORTCUTS_GROUP, 
  ZEN_WORKSPACE_SHORTCUTS_GROUP, 
  ZEN_SPLIT_VIEW_SHORTCUTS_GROUP,
  ...Object.keys(defaultKeyboardGroups), ZEN_OTHER_SHORTCUTS_GROUP, 'other'
];

class KeyShortcutModifiers {
  #control = false;
  #alt = false;
  #shift = false;
  #meta = false;
  #accel = false;

  constructor(ctrl, alt, shift, meta, accel) {
    this.#control = ctrl;
    this.#alt = alt;
    this.#shift = shift;
    this.#meta = meta;
    this.#accel = accel;
    if (AppConstants.platform != 'macosx') {
      // Replace control with accel, to make it more consistent
      this.#accel = ctrl || accel;
      this.#control = false;
    }
  }

  static parseFromJSON(modifiers) {
    if (!modifiers) {
      return new KeyShortcutModifiers(false, false, false, false, false);
    }

    return new KeyShortcutModifiers(
      modifiers['control'] == true,
      modifiers['alt'] == true,
      modifiers['shift'] == true,
      modifiers['meta'] == true,
      modifiers['accel'] == true
    );
  }

  static parseFromXHTMLAttribute(modifiers) {
    if (!modifiers) {
      return new KeyShortcutModifiers(false, false, false, false, false);
    }

    return new KeyShortcutModifiers(
      modifiers.includes('control'),
      modifiers.includes('alt'),
      modifiers.includes('shift'),
      modifiers.includes('meta'),
      modifiers.includes('accel')
    );
  }

  // used to avoid any future changes to the object
  static fromObject({ctrl = false, alt = false, shift = false, meta = false}) {
    return new KeyShortcutModifiers(ctrl, alt, shift, meta);
  }

  toUserString() {
    let str = '';
    if (this.#control) {
      str += 'Ctrl+';
    }
    if (this.#alt) {
      str += AppConstants.platform == 'macosx' ? 'Option+' : 'Alt+';
    }
    if (this.#shift) {
      str += 'Shift+';
    }
    if (this.#meta) {
      str += AppConstants.platform == 'macosx' ? 'Cmd+' : 'Win+';
    }
    if (this.#accel) {
      if (AppConstants.platform == 'macosx') {
        str += 'Cmd+';
      } else {
        str += 'Ctrl+';
      }
    }
    return str;
  }

  equals(other) {
    if (!other) {
      return false;
    }
    return (
      this.#alt == other.#alt &&
      this.#shift == other.#shift &&
      this.#meta == other.#meta &&
      this.#accel == other.#accel &&
      this.#control == other.#control
    );
  }

  toString() {
    let str = '';
    if (this.#control) {
      str += 'control,';
    }
    if (this.#alt) {
      str += 'alt,';
    }
    if (this.#shift) {
      str += 'shift,';
    }
    if (this.#accel) {
      str += 'accel,';
    }
    if (this.#meta) {
      str += 'meta,';
    }
    return str.slice(0, -1);
  }

  toJSONString() {
    return {
      control: this.#control,
      alt: this.#alt,
      shift: this.#shift,
      meta: this.#meta,
      accel: this.#accel,
    };
  }

  areAnyActive() {
    return this.#control || this.#alt || this.#shift || this.#meta || this.#accel;
  }
}

class KeyShortcut {
  #id = '';
  #key = '';
  #keycode = '';
  #group = FIREFOX_SHORTCUTS_GROUP;
  #modifiers = new KeyShortcutModifiers(false, false, false, false, false);
  #action = '';
  #l10nId = '';
  #disabled = false;
  #reserved = false;
  #internal = false;

  constructor(id, key, keycode, group, modifiers, action, l10nId, disabled = false, reserved = false, internal = false) {
    this.#id = id;
    this.#key = key?.toLowerCase();
    this.#keycode = keycode;

    if (!VALID_SHORTCUT_GROUPS.includes(group)) {
      throw new Error('Illegal group value: ' + group);
    }

    this.#group = group;
    this.#modifiers = modifiers;
    this.#action = action;
    this.#l10nId = KeyShortcut.sanitizeL10nId(l10nId, action);
    this.#disabled = disabled;
    this.#reserved = reserved;
    this.#internal = internal;
  }

  isEmpty() {
    return !this.#key && !this.#keycode;
  }

  static parseFromSaved(json) {
    let rv = [];

    for (let key of json) {
      rv.push(this.#parseFromJSON(key));
    }

    return rv;
  }

  static getGroupFromL10nId(l10nId, id) {
    // Find inside defaultKeyboardGroups
    for (let group of Object.keys(defaultKeyboardGroups)) {
      for (let shortcut of defaultKeyboardGroups[group]) {
        if (shortcut == l10nId || shortcut == "id:" + id) {
          return group;
        }
      }
    }
    return 'other';
  }

  static #parseFromJSON(json) {
    return new KeyShortcut(
      json['id'],
      json['key'],
      json['keycode'],
      json['group'],
      KeyShortcutModifiers.parseFromJSON(json['modifiers']),
      json['action'],
      json['l10nId'],
      json['disabled'] == 'true',
      json['reserved'] == 'true',
      json['internal'] == 'true'
    );
  }

  static parseFromXHTML(key) {
    return new KeyShortcut(
      key.getAttribute('id'),
      key.getAttribute('key'),
      key.getAttribute('keycode'),
      KeyShortcut.getGroupFromL10nId(KeyShortcut.sanitizeL10nId(key.getAttribute('data-l10n-id')), key.getAttribute('id')),
      KeyShortcutModifiers.parseFromXHTMLAttribute(key.getAttribute('modifiers')),
      key.getAttribute('command'),
      key.getAttribute('data-l10n-id'),
      key.getAttribute('disabled') == 'true',
      key.getAttribute('reserved') == 'true',
      key.getAttribute('internal') == 'true'
    );
  }

  static sanitizeL10nId(id, action) {
    if (!id || id.startsWith('zen-')) {
      return id;
    }
    // Check if any action is on the list of fixed l10n ids
    if (fixedL10nIds[action]) {
      return fixedL10nIds[action];
    }
    return `zen-${id}`;
  }

  toXHTMLElement(window) {
    let key = window.document.createXULElement('key');
    key.id = this.#id;
    if (this.#keycode) {
      key.setAttribute('keycode', this.#keycode);
    } else {
      // note to "mr. macos": Better use setAttribute, because without it, there's a
      //  risk of malforming the XUL element.
      key.setAttribute('key', this.#key);
    }
    key.setAttribute('group', this.#group);

    // note to "mr. macos": We add the `zen-` prefix because since firefox hasnt been built with the
    // shortcuts in mind, it will siply just override the shortcuts with whatever the default is.
    //  note that this l10n id is not used for actually translating the key's label, but rather to
    //  identify the default keybinds.
    key.setAttribute('data-l10n-id', this.#l10nId);
    key.setAttribute('modifiers', this.#modifiers.toString());
    if (this.#action?.startsWith('code:')) {
      key.setAttribute('oncommand', this.#action.substring(5));
    } else {
      key.setAttribute('command', this.#action);
    }
    key.setAttribute('disabled', this.#disabled);
    key.setAttribute('reserved', this.#reserved);
    key.setAttribute('internal', this.#internal);
    key.setAttribute('zen-keybind', 'true');

    return key;
  }

  getID() {
    return this.#id;
  }

  getAction() {
    return this.#action;
  }

  getL10NID() {
    return this.#l10nId;
  }

  getGroup() {
    return this.#group;
  }

  getModifiers() {
    return this.#modifiers;
  }

  getKeyName() {
    return this.#key;
  }

  getKeyCode() {
    return this.#keycode;
  }

  getKeyNameOrCode() {
    return this.#key ? this.#key : this.#keycode;
  }

  isDisabled() {
    return this.#disabled;
  }

  isReserved() {
    return this.#reserved;
  }

  isInternal() {
    return this.#internal;
  }

  setModifiers(modifiers) {
    if ((!modifiers) instanceof KeyShortcutModifiers) {
      throw new Error('Only KeyShortcutModifiers allowed');
    }
    this.#modifiers = modifiers;
  }

  toJSONForm() {
    return {
      id: this.#id,
      key: this.#key,
      keycode: this.#keycode,
      group: this.#group,
      l10nId: this.#l10nId,
      modifiers: this.#modifiers.toJSONString(),
      action: this.#action,
      disabled: this.#disabled,
      reserved: this.#reserved,
      internal: this.#internal,
    };
  }

  toUserString() {
    let str = this.#modifiers.toUserString();

    if (this.#key) {
      str += this.#key.toUpperCase();
    } else if (this.#keycode) {
      // Get the key from the value
      for (let [key, value] of Object.entries(KEYCODE_MAP)) {
        if (value == this.#keycode) {
          str += key.toLowerCase();
          break;
        }
      }
    } else {
      return '';
    }
    return str;
  }

  isUserEditable() {
    if (
      !this.#id ||
      this.#internal ||
      this.#reserved ||
      (this.#group == FIREFOX_SHORTCUTS_GROUP && this.#disabled)
    ) {
      return false;
    }
    return true;
  }

  clearKeybind() {
    this.#key = '';
    this.#keycode = '';
    this.#modifiers = new KeyShortcutModifiers(false, false, false, false);
  }

  setNewBinding(shortcut) {
    for (let keycode of Object.entries(KEYCODE_MAP)) {
      if (KEYCODE_MAP[keycode] == shortcut) {
        this.#keycode = shortcut;
        return;
      }
    }

    this.#key = shortcut;
  }
}

class ZenKeyboardShortcutsLoader {
  #shortcutsDirtyCache = undefined;

  constructor() {
  }

  get shortcutsFile() {
    return PathUtils.join(PathUtils.profileDir, 'zen-keyboard-shortcuts.json');
  }

  async save(data) {
    await IOUtils.writeJSON(this.shortcutsFile, data);
    this.#shortcutsDirtyCache = data;
  }

  async loadObject() {
    if (this.#shortcutsDirtyCache) {
      return this.#shortcutsDirtyCache;
    }
    try {
      this.#shortcutsDirtyCache = await IOUtils.readJSON(this.shortcutsFile);
      return this.#shortcutsDirtyCache;
    } catch (e) {
      console.error('Error loading shortcuts file', e);
      return null;
    }
  }

  async load() {
    return (await this.loadObject())?.shortcuts;
  }

  async remove() {
    await IOUtils.remove(this.shortcutsFile);
  }
}

function zenGetDefaultShortcuts() {
  // DO NOT CHANGE ANYTHING HERE
  // For adding new default shortcuts, add them to inside the migration function
  //  and increment the version number.

  console.info('Zen CKS: Loading default shortcuts...');
  let keySet = document.getElementById('mainKeyset');
  let newShortcutList = [];

  // Firefox's standard keyset. Reverse order to keep the order of the keys
  for (let i = keySet.children.length - 1; i >= 0; i--) {
    let key = keySet.children[i];
    let parsed = KeyShortcut.parseFromXHTML(key);
    newShortcutList.push(parsed);
  }

  // Compact mode's keyset
  newShortcutList.push(
    new KeyShortcut(
      'zen-compact-mode-toggle',
      'C',
      '',
      ZEN_COMPACT_MODE_SHORTCUTS_GROUP,
      KeyShortcutModifiers.fromObject({ctrl: true, alt: true}),
      'code:gZenCompactModeManager.toggle()',
      'zen-compact-mode-shortcut-toggle'
    )
  );
  newShortcutList.push(
    new KeyShortcut(
      'zen-compact-mode-show-sidebar',
      'S',
      '',
      ZEN_COMPACT_MODE_SHORTCUTS_GROUP,
      KeyShortcutModifiers.fromObject({ctrl: true, alt: true}),
      'code:gZenCompactModeManager.toggleSidebar()',
      'zen-compact-mode-shortcut-show-sidebar'
    )
  );
  newShortcutList.push(
    new KeyShortcut(
      'zen-compact-mode-show-toolbar',
      'T',
      '',
      ZEN_COMPACT_MODE_SHORTCUTS_GROUP,
      KeyShortcutModifiers.fromObject({ctrl: true, alt: true}),
      'code:gZenCompactModeManager.toggleToolbar()',
      'zen-compact-mode-shortcut-show-toolbar'
    )
  );

  // Workspace's keyset
  for (let i = 10; i > 0; i--) {
    newShortcutList.push(
      new KeyShortcut(
        `zen-workspace-switch-${i}`,
        '',
        '',
        ZEN_WORKSPACE_SHORTCUTS_GROUP,
        KeyShortcutModifiers.fromObject({}),
        `code:ZenWorkspaces.shortcutSwitchTo(${i - 1})`,
        `zen-workspace-shortcut-switch-${i}`
      )
    );
  }
  newShortcutList.push(
    new KeyShortcut(
      'zen-workspace-forward',
      'E',
      '',
      ZEN_WORKSPACE_SHORTCUTS_GROUP,
      KeyShortcutModifiers.fromObject({ctrl: true, alt: true}),
      'code:ZenWorkspaces.changeWorkspaceShortcut()',
      'zen-workspace-shortcut-forward'
    )
  );
  newShortcutList.push(
    new KeyShortcut(
      'zen-workspace-backward',
      'Q',
      '',
      ZEN_WORKSPACE_SHORTCUTS_GROUP,
      KeyShortcutModifiers.fromObject({ctrl: true, alt: true}),
      'code:ZenWorkspaces.changeWorkspaceShortcut(-1)',
      'zen-workspace-shortcut-backward'
    )
  );

  // Other keyset
  newShortcutList.push(
    new KeyShortcut(
      'zen-toggle-web-panel',
      'P',
      '',
      ZEN_OTHER_SHORTCUTS_GROUP,
      KeyShortcutModifiers.fromObject({alt: true}),
      'code:gZenBrowserManagerSidebar.toggle()',
      'zen-web-panel-shortcut-toggle'
    )
  );
  newShortcutList.push(
    new KeyShortcut(
      'zen-toggle-sidebar',
      'B',
      '',
      ZEN_OTHER_SHORTCUTS_GROUP,
      KeyShortcutModifiers.fromObject({alt: true}),
      'code:gZenVerticalTabsManager.toggleExpand()',
      'zen-sidebar-shortcut-toggle'
    )
  );

  // Split view
  newShortcutList.push(
    new KeyShortcut(
      'zen-split-view-grid',
      'G',
      '',
      ZEN_SPLIT_VIEW_SHORTCUTS_GROUP,
      KeyShortcutModifiers.fromObject({ctrl: true, alt: true}),
      'code:gZenViewSplitter.toggleShortcut(\'grid\')',
      'zen-split-view-shortcut-grid'
    )
  );
  newShortcutList.push(
    new KeyShortcut(
      'zen-split-view-vertical',
      'V',
      '',
      ZEN_SPLIT_VIEW_SHORTCUTS_GROUP,
      KeyShortcutModifiers.fromObject({ctrl: true, alt: true}),
      'code:gZenViewSplitter.toggleShortcut(\'vsep\')',
      'zen-split-view-shortcut-vertical'
    )
  );
  newShortcutList.push(
    new KeyShortcut(
      'zen-split-view-horizontal',
      'H',
      '',
      ZEN_SPLIT_VIEW_SHORTCUTS_GROUP,
      KeyShortcutModifiers.fromObject({ctrl: true, alt: true}),
      'code:gZenViewSplitter.toggleShortcut(\'hsep\')',
      'zen-split-view-shortcut-horizontal'
    )
  );
  newShortcutList.push(
    new KeyShortcut(
      'zen-split-view-unsplit',
      'U',
      '',
      ZEN_SPLIT_VIEW_SHORTCUTS_GROUP,
      KeyShortcutModifiers.fromObject({ctrl: true, alt: true}),
      'code:gZenViewSplitter.toggleShortcut(\'unsplit\')',
      'zen-split-view-shortcut-unsplit'
    )
  );

  return newShortcutList;
}

class ZenKeyboardShortcutsVersioner {
  static LATEST_KBS_VERSION = 1.0;

  #loadedVersion = 0.0;

  constructor(versionedData) {
    this.#loadedVersion = versionedData.version ?? 0.0;
  }

  getVersionedData(data) {
    return {
      version: this.#loadedVersion,
      shortcuts: data,
    };
  }

  isVersionUpToDate() {
    return this.#loadedVersion == ZenKeyboardShortcutsVersioner.LATEST_KBS_VERSION;
  }

  isVersionOutdated() {
    return this.#loadedVersion < ZenKeyboardShortcutsVersioner.LATEST_KBS_VERSION;
  }

  migrateIfNeeded(data) {
    if (this.isVersionUpToDate()) {
      return data;
    }

    if (this.isVersionOutdated()) {
      console.info('Zen CKS: Migrating shortcuts from version', this.#loadedVersion, 'to', ZenKeyboardShortcutsVersioner.LATEST_KBS_VERSION);
      const newData = this.migrate(data);
      this.#loadedVersion = ZenKeyboardShortcutsVersioner.LATEST_KBS_VERSION;
      return newData;
    }

    throw new Error('Unknown keyboar shortcuts version');
  }

  migrate(data) {
    if (this.#loadedVersion < 1.0) {
      // Migrate from 0.0 to 1.0
      // Here, we do a complet reset of the shortcuts,
      // since nothing seems to work properly.
      return zenGetDefaultShortcuts();
    }
    return data;
  }
}

var gZenKeyboardShortcutsManager = {
  loader: new ZenKeyboardShortcutsLoader(),
  async init() {
    if (window.location.href == 'chrome://browser/content/browser.xhtml') {
      console.info('Zen CKS: Initializing shortcuts');

      const loadedShortcuts = await this._loadSaved();

      this._currentShortcutList = this.versioner.migrateIfNeeded(loadedShortcuts);
      this._applyShortcuts();

      await this._saveShortcuts();

      console.info('Zen CKS: Initialized');
    }
  },

  async _loadSaved() {
    var innerLoad = async() => {
      let data = await this.loader.load();
      if (!data || data.length == 0) {
        return zenGetDefaultShortcuts();
      }

      try {
        return KeyShortcut.parseFromSaved(data);
      } catch (e) {
        console.error('Zen CKS: Error parsing saved shortcuts. Resetting to defaults...', e);
        return zenGetDefaultShortcuts();
      }
    }

    const loadedShortcuts = await innerLoad();
    this.versioner = new ZenKeyboardShortcutsVersioner(
      loadedShortcuts,
    );
    return loadedShortcuts;
  },

  _applyShortcuts() {
    for (const browser of ZenThemesCommon.browsers) {
      let mainKeyset = browser.document.getElementById('mainKeyset');
      if (!mainKeyset) {
        throw new Error('Main keyset not found');
      }

      let parent = mainKeyset.parentElement;

      mainKeyset.remove();
      const children = mainKeyset.children;
      for (let i = children.length - 1; i >= 0; i--) {
        let key = children[i];
        key.remove();
      }
      if (mainKeyset.children.length > 0) {
        throw new Error('Child list not empty');
      }

      for (let key of this._currentShortcutList) {
        if (key.isEmpty()) {
          continue;
        }
        let child = key.toXHTMLElement(browser);
        mainKeyset.appendChild(child);
      }

      parent.prepend(mainKeyset);
      console.debug('Shortcuts applied...');
    }
  },

  async resetAllShortcuts() {
    await this.loader.remove();
  },

  async _saveShortcuts() {
    let json = [];
    for (shortcut of this._currentShortcutList) {
      json.push(shortcut.toJSONForm());
    }

    await this.loader.save(this.versioner.getVersionedData(json));
  },

  triggerShortcutRebuild() {
    this._applyShortcuts();
  },

  async setShortcut(action, shortcut, modifiers) {
    if (!action) {
      throw new Error('Action cannot be null');
    }

    // Unsetting shortcut
    for (let targetShortcut of this._currentShortcutList) {
      if (targetShortcut.getAction() != action) {
        continue;
      }
      if (!shortcut && !modifiers) {
        targetShortcut.clearKeybind();
      } else {
        targetShortcut.setNewBinding(shortcut);
        targetShortcut.setModifiers(modifiers);
      }
    }

    await this._saveShortcuts();
    this.triggerShortcutRebuild();
  },

  async getModifiableShortcuts() {
    let rv = [];

    if (!this._currentShortcutList) {
      this._currentShortcutList = await this._loadSaved();
    }

    for (let shortcut of this._currentShortcutList) {
      if (shortcut.isUserEditable()) {
        rv.push(shortcut);
      }
    }

    return rv;
  },

  checkForConflicts(shortcut, modifiers, id, action) {
    for (let targetShortcut of this._currentShortcutList) {
      if ((targetShortcut.getID() == id)
        || (action == targetShortcut.getAction())) {
        continue;
      }

      if (targetShortcut.getModifiers().equals(modifiers) && targetShortcut.getKeyNameOrCode() == shortcut) {
        return true
      }
    }

    return false;
  },
};
