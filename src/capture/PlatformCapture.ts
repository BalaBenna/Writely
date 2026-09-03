// PlatformCapture — shared interface per spec §10-11
// Electron Main will load WindowsTextCapture or MacTextCapture via native addon.

export interface ApplicationInfo { name: string; bundleId?: string; pid?: number; }

export interface PlatformTextCapture {
  getSelectedText(): Promise<string>;
  replaceSelectedText(text: string): Promise<void>;
  getFocusedApplication(): Promise<ApplicationInfo | null>;
}

// Renderer-side proxy via IPC (preload → ipc → Main)
export class CaptureProxy implements PlatformTextCapture {
  async getSelectedText(): Promise<string> {
    const api = (window as any).writelyCapture;
    if (!api?.getSelectedText) throw new Error('TextCapture not available in this context');
    return api.getSelectedText();
  }
  async replaceSelectedText(text: string): Promise<void> {
    const api = (window as any).writelyCapture;
    if (!api?.replaceSelectedText) throw new Error('TextCapture not available');
    return api.replaceSelectedText(text);
  }
  async getFocusedApplication(): Promise<ApplicationInfo | null> {
    const api = (window as any).writelyCapture;
    if (!api?.getFocusedApplication) return null;
    return api.getFocusedApplication();
  }
}
