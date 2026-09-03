// Writely Content Script — Inline wavy underlines + floating badge + bridge
(() => {
  let activeElement = null;
  let floatingBadge = null;
  let debounceTimeout = null;
  let lastSuggestions = [];
  let inlineWrapper = null;
  let suggestionPopup = null;

  function createFloatingBadge() {
    if (floatingBadge) return;
    floatingBadge = document.createElement('div');
    floatingBadge.id = 'writely-floating-badge';
    floatingBadge.innerHTML = `
      <div class="writely-badge-inner" title="Writely — click to see fixes">
        <span class="writely-badge-icon">✍️</span>
        <span class="writely-badge-count" style="display:none">0</span>
      </div>
    `;
    floatingBadge.style.display = 'none';
    document.body.appendChild(floatingBadge);
    floatingBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      if (suggestionPopup && suggestionPopup.style.display !== 'none') {
        suggestionPopup.style.display = 'none';
      } else if (lastSuggestions.length > 0) {
        showSuggestionPopup();
      } else {
        triggerQuickCorrection();
      }
    });
  }

  function ensurePopup() {
    if (suggestionPopup) return;
    suggestionPopup = document.createElement('div');
    suggestionPopup.id = 'writely-suggestion-popup';
    suggestionPopup.style.display = 'none';
    document.body.appendChild(suggestionPopup);
  }

  function updateBadgePosition(el) {
    if (!floatingBadge || !el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      floatingBadge.style.display = 'none';
      return;
    }
    floatingBadge.style.display = 'block';
    floatingBadge.style.top = `${window.scrollY + rect.bottom - 36}px`;
    floatingBadge.style.left = `${window.scrollX + rect.right - 36}px`;
  }

  function handleInput(e) {
    const target = e.target;
    if (!(target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)) return;
    activeElement = target;
    updateBadgePosition(activeElement);
    const text = getElementText(activeElement);
    if (text.length < 3) {
      clearInlineMarks();
      return;
    }
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      chrome.runtime.sendMessage({ id: Date.now(), action: 'analyze', text });
    }, 120);
  }

  function getElementText(el) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value || '';
    return el.innerText || el.textContent || '';
  }

  function setElementText(el, newText) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = newText;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // For contentEditable, replace textContent (will clear marks, next analyze will re-mark after fix)
      el.textContent = newText;
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
  }

  function triggerQuickCorrection() {
    if (!activeElement) return;
    const text = getElementText(activeElement);
    chrome.runtime.sendMessage({ id: Date.now(), action: 'analyze', text });
  }

  function clearInlineMarks() {
    // Remove our marks for contentEditable
    if (activeElement && activeElement.isContentEditable) {
      const marks = activeElement.querySelectorAll('.writely-inline-mark');
      marks.forEach(m => {
        const parent = m.parentNode;
        if (parent) parent.replaceChild(document.createTextNode(m.textContent || ''), m);
        parent && parent.normalize();
      });
    }
    if (suggestionPopup) suggestionPopup.style.display = 'none';
    if (inlineWrapper) {
      inlineWrapper.remove();
      inlineWrapper = null;
    }
  }

  function applyInlineMarksForContentEditable(el, suggestions, fullText) {
    if (!el.isContentEditable) return;
    // Avoid re-entrancy if already marked
    clearInlineMarks();
    if (suggestions.length === 0) return;

    // Sort by start asc, then walk text nodes
    const text = fullText;
    // Build a map of offset -> text node + offset within node
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    // For simplicity, only handle single text node case (Gmail/Notion simple paragraphs)
    // For multi-node, we fallback to popup list only
    if (nodes.length !== 1) {
      return;
    }
    const textNode = nodes[0];
    const original = textNode.textContent || '';
    if (original !== text) return;

    let frag = document.createDocumentFragment();
    let lastIdx = 0;
    const sorted = [...suggestions].sort((a, b) => a.start - b.start);
    for (const s of sorted) {
      const relStart = s.start;
      const relEnd = s.end;
      if (relStart < lastIdx || relEnd > original.length) continue;
      if (relStart > lastIdx) frag.appendChild(document.createTextNode(original.slice(lastIdx, relStart)));
      const mark = document.createElement('span');
      mark.className = `writely-inline-mark writely-mark-${s.type}`;
      mark.title = `${s.explanation} → ${s.replacement} (click to fix)`;
      mark.textContent = original.slice(relStart, relEnd);
      mark.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const newText = original.slice(0, relStart) + s.replacement + original.slice(relEnd);
        textNode.textContent = newText;
        // Dispatch input to trigger re-analyze
        el.dispatchEvent(new InputEvent('input', { bubbles: true }));
        clearInlineMarks();
        // Re-analyze after fix
        chrome.runtime.sendMessage({ id: Date.now(), action: 'analyze', text: newText });
      });
      frag.appendChild(mark);
      lastIdx = relEnd;
    }
    if (lastIdx < original.length) frag.appendChild(document.createTextNode(original.slice(lastIdx)));
    textNode.parentNode.replaceChild(frag, textNode);
  }

  function showSuggestionPopup() {
    if (!activeElement || lastSuggestions.length === 0) return;
    ensurePopup();
    const rect = activeElement.getBoundingClientRect();
    suggestionPopup.innerHTML = `
      <div class="writely-popup-header">
        <span>✍️ Writely — ${lastSuggestions.length} suggestion${lastSuggestions.length > 1 ? 's' : ''}</span>
        <button class="writely-popup-close">×</button>
      </div>
      <div class="writely-popup-list">
        ${lastSuggestions.slice(0, 8).map(s => `
          <button class="writely-popup-item writely-popup-${s.type}" data-id="${s.id}">
            <span class="writely-popup-badge">${s.type}</span>
            <span class="writely-popup-text"><s>${escapeHtml(s.original)}</s> → <b>${escapeHtml(s.replacement)}</b></span>
            <span class="writely-popup-explain">${escapeHtml(s.explanation)}</span>
          </button>
        `).join('')}
        ${lastSuggestions.length > 8 ? `<div class="writely-popup-more">+${lastSuggestions.length - 8} more in Writely app</div>` : ''}
        <button class="writely-popup-fixall">Fix All</button>
      </div>
    `;
    suggestionPopup.style.display = 'block';
    suggestionPopup.style.top = `${window.scrollY + rect.bottom + 6}px`;
    suggestionPopup.style.left = `${Math.max(8, window.scrollX + rect.left)}px`;
    suggestionPopup.style.maxWidth = `${Math.min(360, rect.width)}px`;

    suggestionPopup.querySelector('.writely-popup-close')?.addEventListener('click', () => suggestionPopup.style.display = 'none');
    suggestionPopup.querySelectorAll('.writely-popup-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const s = lastSuggestions.find(x => x.id === id);
        if (s) applyFix(s);
      });
    });
    suggestionPopup.querySelector('.writely-popup-fixall')?.addEventListener('click', () => applyFixAll());
  }

  function escapeHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function applyFix(s) {
    if (!activeElement) return;
    const text = getElementText(activeElement);
    const newText = text.slice(0, s.start) + s.replacement + text.slice(s.end);
    setElementText(activeElement, newText);
    // Remove this suggestion from popup
    lastSuggestions = lastSuggestions.filter(x => x.id !== s.id);
    if (lastSuggestions.length === 0) {
      if (suggestionPopup) suggestionPopup.style.display = 'none';
      clearInlineMarks();
    } else {
      showSuggestionPopup();
    }
    // For contentEditable, clear marks before next analyze
    if (activeElement.isContentEditable) clearInlineMarks();
    chrome.runtime.sendMessage({ id: Date.now(), action: 'analyze', text: newText });
  }

  function applyFixAll() {
    if (!activeElement || lastSuggestions.length === 0) return;
    let text = getElementText(activeElement);
    const sorted = [...lastSuggestions].sort((a, b) => b.start - a.start);
    for (const s of sorted) {
      text = text.slice(0, s.start) + s.replacement + text.slice(s.end);
    }
    setElementText(activeElement, text);
    lastSuggestions = [];
    if (suggestionPopup) suggestionPopup.style.display = 'none';
    clearInlineMarks();
    chrome.runtime.sendMessage({ id: Date.now(), action: 'analyze', text });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'analyze_result' && floatingBadge) {
      const countEl = floatingBadge.querySelector('.writely-badge-count');
      lastSuggestions = msg.suggestions || [];
      const count = lastSuggestions.length;
      if (countEl) {
        if (count > 0) {
          countEl.innerText = count > 9 ? '9+' : String(count);
          countEl.style.display = 'inline-block';
          floatingBadge.classList.add('has-issues');
        } else {
          countEl.style.display = 'none';
          floatingBadge.classList.remove('has-issues');
          clearInlineMarks();
          if (suggestionPopup) suggestionPopup.style.display = 'none';
          return;
        }
      }
      // Try inline marks for contentEditable, else popup list
      if (activeElement && activeElement.isContentEditable) {
        const fullText = getElementText(activeElement);
        applyInlineMarksForContentEditable(activeElement, lastSuggestions, fullText);
        // Also show popup as fallback for multi-node
        if (activeElement.querySelectorAll && activeElement.querySelectorAll('.writely-inline-mark').length === 0) {
          showSuggestionPopup();
        }
      } else {
        // For textarea/input, show popup near field
        showSuggestionPopup();
      }
    }
  });

  document.addEventListener('focusin', (e) => {
    const target = e.target;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) {
      createFloatingBadge();
      ensurePopup();
      activeElement = target;
      updateBadgePosition(target);
      const text = getElementText(target);
      if (text.length >= 3) {
        chrome.runtime.sendMessage({ id: Date.now(), action: 'analyze', text });
      }
    }
  });

  document.addEventListener('focusout', () => {
    setTimeout(() => {
      if (suggestionPopup && !suggestionPopup.matches(':hover') && document.activeElement !== activeElement) {
        // keep badge, hide popup after delay
      }
    }, 300);
  });

  document.addEventListener('input', handleInput);
  window.addEventListener('resize', () => activeElement && updateBadgePosition(activeElement));
  window.addEventListener('scroll', () => activeElement && updateBadgePosition(activeElement), true);
  // Click outside to close popup
  document.addEventListener('click', (e) => {
    if (suggestionPopup && !suggestionPopup.contains(e.target) && e.target !== floatingBadge) {
      suggestionPopup.style.display = 'none';
    }
  });
})();
