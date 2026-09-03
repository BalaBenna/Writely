// native/macos/text_capture.mm — macOS AXUIElement implementation (spec §10-11)
// Build as N-API addon via node-gyp or CMake. Exposed to Electron Main via writely:getSelectedText.
// TODO Phase 3: Implement per spec:
// - Use AXUIElementCopyParameterizedAttributeValue(kAXSelectedTextMarkerRange) + kAXValue
// - Check accessibility permissions (AXIsProcessTrustedWithOptions), show onboarding if not granted
// - Handle focused app via NSWorkspace.frontmostApplication, ignore secure fields (password)
// - Replace via AXUIElementSetAttributeValue(kAXValueAttribute) or clipboard fallback + Cmd+V
// Reference: https://developer.apple.com/documentation/applicationservices/axuielement_h

#import <Cocoa/Cocoa.h>
#import <ApplicationServices/ApplicationServices.h>

// Stub — returns empty until N-API wiring is complete
NSString* WritelyGetSelectedTextMac() {
  if (!AXIsProcessTrusted()) {
    NSLog(@"[Writely] Accessibility not granted — prompt onboarding");
    return @"";
  }
  // TODO: implement AX capture
  return @"";
}
void WritelyReplaceSelectedTextMac(NSString* text) {
  // TODO: implement AX replace
}
