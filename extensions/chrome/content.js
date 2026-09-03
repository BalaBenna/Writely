// Writely Content Script — Injects floating indicator and communicates with desktop bridge
(() => {
  let activeElement = null;
  let floatingBadge = null;
  let debounceTimeout = null;

  function createFloatingBadge() {
    if (floatingBadge) return;
    floatingBadge = document.createElement('div');
    floatingBadge.id = 'writely-floating-badge';
    floatingBadge.innerHTML = `
      <div class="writely-badge-inner" title="Writely Local AI (Click to Fix)">
        <span class="writely-badge-icon">✍️</span>
        <span class="writely-badge-count" style="display:none">0</span>
      </div>
    `;
    floatingBadge.style.display = 'none';
    document.body.appendChild(floatingBadge);

    floatingBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerQuickCorrection();
    });
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
    activeElement = e.target;
    updateBadgePosition(activeElement);

    const text = activeElement.value || activeElement.innerText || '';
    if (text.length < 3) return;

    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      chrome.runtime.sendMessage({
        id: Date.now(),
        action: 'analyze',
        text: text,
      });
    }, 100);
  }

  function triggerQuickCorrection() {
    if (!activeElement) return;
    const text = activeElement.value || activeElement.innerText || '';
    chrome.runtime.sendMessage({
      id: Date.now(),
      action: 'analyze',
      text: text,
    });
  }

  // Receive analysis response from desktop bridge
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'analyze_result' && floatingBadge) {
      const countEl = floatingBadge.querySelector('.writely-badge-count');
      const count = msg.suggestions?.length || 0;
      if (countEl) {
        if (count > 0) {
          countEl.innerText = count;
          countEl.style.display = 'inline-block';
          floatingBadge.classList.add('has-issues');
        } else {
          countEl.style.display = 'none';
          floatingBadge.classList.remove('has-issues');
        }
      }
    }
  });

  // Track active focus on text fields
  document.addEventListener('focusin', (e) => {
    const target = e.target;
    if (
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.isContentEditable
    ) {
      createFloatingBadge();
      activeElement = target;
      updateBadgePosition(target);
    }
  });

  document.addEventListener('input', handleInput);
  window.addEventListener('resize', () => activeElement && updateBadgePosition(activeElement));
  window.addEventListener('scroll', () => activeElement && updateBadgePosition(activeElement));
})();
