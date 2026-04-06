(function () {
  'use strict';

  // 等待 ST 加载完毕
  jQuery(async () => {
    // 注入搜索框到主题选择下拉弹窗
    injectSearchOnOpen();
  });

  function injectSearchOnOpen() {
    // 监听主题选择器弹窗的打开
    // ST 的主题列表在 #ui_theme_block 里，点击会弹出 power_user 的主题选择器
    // 我们用 MutationObserver 监听 body 内的弹窗出现

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          // ST 的主题选择弹窗 class 通常是 .ui-selectmenu-menu 或 select 变成的 list
          tryInjectSearch(node);
        }
      }
      // 也处理已存在但变为可见的元素
      const menu = document.querySelector('.ui-selectmenu-menu:not([theme-search-injected])');
      if (menu && menu.style.display !== 'none') {
        tryInjectSearch(menu);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 也监听 select 元素的 open 事件（jQuery UI selectmenu）
    const sel = document.querySelector('#ui_theme_select');
    if (sel) {
      $(sel).on('selectmenuopen', () => {
        setTimeout(() => {
          const menu = document.querySelector('.ui-selectmenu-menu');
          if (menu) tryInjectSearch(menu);
        }, 50);
      });
    }
  }

  function tryInjectSearch(container) {
    // 找到列表容器
    const listbox = container.classList?.contains('ui-selectmenu-menu')
      ? container
      : container.querySelector('.ui-selectmenu-menu');

    if (!listbox) return;
    if (listbox.getAttribute('theme-search-injected')) return;
    listbox.setAttribute('theme-search-injected', '1');

    const ul = listbox.querySelector('ul');
    if (!ul) return;

    // 保存所有 item
    const allItems = Array.from(ul.querySelectorAll('li'));

    // 创建搜索框容器
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'padding:8px 8px 2px 8px; position:sticky; top:0; background:inherit; z-index:1;';

    const countEl = document.createElement('div');
    countEl.id = 'theme-search-count';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'theme-search-box';
    input.placeholder = '🔍 搜索主题...';
    input.autocomplete = 'off';

    wrapper.appendChild(input);
    wrapper.appendChild(countEl);
    listbox.insertBefore(wrapper, ul);

    function updateCount(shown, total) {
      countEl.textContent = shown === total ? `共 ${total} 个主题` : `${shown} / ${total}`;
    }

    updateCount(allItems.length, allItems.length);

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      allItems.forEach(item => {
        const text = item.textContent || '';
        const match = !q || text.toLowerCase().includes(q);
        item.style.display = match ? '' : 'none';
        if (match) {
          shown++;
          // 高亮
          const span = item.querySelector('.ui-menu-item-wrapper') || item;
          if (q) {
            span.innerHTML = span.textContent.replace(
              new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
              '<span class="theme-search-highlight">$1</span>'
            );
          } else {
            span.textContent = span.textContent; // 还原（触发 reflow）
            span.innerHTML = item.dataset.originalText || span.textContent;
          }
        }
      });
      updateCount(shown, allItems.length);
    });

    // 保存原始文字
    allItems.forEach(item => {
      const span = item.querySelector('.ui-menu-item-wrapper') || item;
      item.dataset.originalText = span.innerHTML;
    });

    // 聚焦搜索框
    setTimeout(() => input.focus(), 80);
  }
})();
