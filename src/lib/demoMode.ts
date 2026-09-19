// A simple module-level flag rather than React context, so any data hook
// can check it directly without threading it through every component.
let demoModeEnabled = false;

export function isDemoMode(): boolean {
  return demoModeEnabled;
}

export function setDemoMode(enabled: boolean): void {
  demoModeEnabled = enabled;
}
