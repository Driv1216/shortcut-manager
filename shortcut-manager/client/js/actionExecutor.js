/**
 * Action Executor Module
 * Executes local demo actions when shortcuts are triggered
 */

// Map of known action names to handlers
const actionHandlers = {
  'save file': () => {
    return 'Save action triggered - document saved!';
  },
  
  'toggle theme': () => {
    const currentTheme = toggleThemeState();
    return `Theme toggled to ${currentTheme} mode`;
  },
  
  'open search': () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
    return 'Search opened';
  },
  
  'open help': () => {
    return 'Help: Press any configured shortcut to trigger its action. Create shortcuts using the form above.';
  },
  
  'open settings': () => {
    return 'Settings panel would open here';
  },
  
  'clear output': () => {
    const outputPanel = document.getElementById('output-panel');
    if (outputPanel) {
      outputPanel.innerHTML = `
        <div class="output-message output-info">
          <div class="output-badge">Ready</div>
          <div class="output-copy">
            <strong>Activity feed cleared</strong>
            <p>New shortcut activity and operation feedback will appear here.</p>
          </div>
          <time class="output-time">Now</time>
        </div>
      `;
    }
    return null; // Don't add another message
  },
  
  'new note': () => {
    return 'New note created';
  },
  
  'refresh data': () => {
    // Trigger a data refresh
    window.dispatchEvent(new CustomEvent('refreshData'));
    return 'Refreshing data...';
  },
  
  'show notification': () => {
    return 'Notification: This is a sample notification!';
  },
  
  'copy': () => {
    return 'Copy action triggered';
  },
  
  'paste': () => {
    return 'Paste action triggered';
  },
  
  'cut': () => {
    return 'Cut action triggered';
  },
  
  'undo': () => {
    return 'Undo action triggered';
  },
  
  'redo': () => {
    return 'Redo action triggered';
  },
  
  'select all': () => {
    return 'Select All action triggered';
  },
  
  'find': () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
    }
    return 'Find activated';
  },
  
  'print': () => {
    return 'Print dialog would open here';
  },
  
  'zoom in': () => {
    return 'Zoom in triggered';
  },
  
  'zoom out': () => {
    return 'Zoom out triggered';
  },
  
  'reset zoom': () => {
    return 'Zoom reset to 100%';
  }
};

function applyTheme(theme) {
  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
  const html = document.documentElement;
  html.setAttribute('data-theme', normalizedTheme);
  html.classList.toggle('dark', normalizedTheme === 'dark');
  localStorage.setItem('theme', normalizedTheme);
  return normalizedTheme;
}

export function toggleThemeState() {
  const html = document.documentElement;
  const currentTheme =
    html.getAttribute('data-theme') === 'dark' || html.classList.contains('dark')
      ? 'dark'
      : 'light';
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  return applyTheme(nextTheme);
}

/**
 * Execute an action by name
 * @param {string} actionName - The name of the action
 * @param {Object} shortcut - The full shortcut object
 * @returns {{ executed: boolean, message: string }}
 */
export function executeAction(actionName, shortcut) {
  const normalizedName = actionName.toLowerCase().trim();
  
  // Check for known action handler
  if (actionHandlers[normalizedName]) {
    const result = actionHandlers[normalizedName]();
    return {
      executed: true,
      message: result
    };
  }
  
  // Unknown action - just report it was triggered
  return {
    executed: true,
    message: `Action triggered: ${actionName}`
  };
}

/**
 * Get list of available demo actions
 * @returns {Array<string>} Action names
 */
export function getAvailableActions() {
  return Object.keys(actionHandlers).map(name => 
    name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  );
}

/**
 * Initialize theme from localStorage
 */
export function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme);
    return;
  }

  const prefersDark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}
