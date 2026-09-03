// native/windows/text_capture.cpp — Windows UI Automation implementation (spec §10-11)
// Build as N-API addon. Exposed to Electron Main via writely:getSelectedText.
// TODO Phase 3:
// - Use IUIAutomation::GetFocusedElement + GetCurrentPattern(UIA_TextPatternId) + GetSelection()
// - Or fallback to SendInput Ctrl+C + clipboard read (with restore)
// - Handle elevated apps, protected fields, UAC
// - Replace via TextPattern::GetSelection()->GetElement()->SetValue or clipboard + SendInput Ctrl+V
// Reference: https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-entry

#include <windows.h>
#include <UIAutomation.h>

// Stub — returns empty until N-API wiring
const wchar_t* WritelyGetSelectedTextWin() {
  // TODO: implement UIA capture
  return L"";
}
void WritelyReplaceSelectedTextWin(const wchar_t* text) {
  // TODO: implement UIA replace
}
