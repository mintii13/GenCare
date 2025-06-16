// Clean console utility for production
export function setupConsoleCleanup() {
  if (import.meta.env.PROD) {
    // Save original console methods
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };

    // Override console methods in production
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    
    // Keep warnings and errors for important issues
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;

    // Provide a way to restore console for debugging if needed
    (window as any).__restoreConsole = () => {
      Object.assign(console, originalConsole);
    };

    // Provide a way to show debug info
    (window as any).__enableDebug = () => {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
    };
  }
}

// Call this in your main entry point
setupConsoleCleanup(); 