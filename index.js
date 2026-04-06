(function () {
    'use strict';

    jQuery(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        initThemeSearch();
    });

    function initThemeSearch() {
        // 读取主题列表的函数
        function getThemes() {
            // 尝试多种可能的 select 元素
            const sel = document.querySelector('#css_theme_select')
                     || document.querySelector('select[name*="theme"]')
                     || document.querySelector('select');
            if (!sel) return [];
            return Array.from(sel.options).map(o => ({
                value: o.value,
                text: o.text,
                selected: o.selected,
            }));
        }

        function applyTheme(value) {
            const sel = document.querySelector('#css_theme_select')
                     || document.querySelector('select[name*="theme"]');
            if (!sel) return;
            $(sel).val(value).trigger('change');
        }

        // 注入 CSS
        const style = document.createElement('style');
        style.textContent = `
            #ts-fab {
                position: fixed;
                bottom: 80px;
                right: 16px;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: rgba(93,202,165,0.85);
                color: #fff;
                font-size: 20px;
                border: none;
                cursor: pointer;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                transition: transform 0.15s;
            }
            #ts-fab:active { transform: scale(0.92); }

            #ts-panel {
                position: fixed;
                bottom: 136px;
                right: 16px;
                width: 280px;
                max-height: 420px;
                background: var(--SmartThemeBlurTintColor, rgba(255,255,255,0.95));
                border: 1px solid rgba(128,128,128,0.25);
                border-radius: 16px;
                z-index: 99998;
                display: none;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.18);
            }
            #ts-panel.open { display: flex; }

            #ts-panel-header {
                padding: 10px 12px 6px;
                border-bottom: 1px solid rgba(128,128,128,0.15);
            }
            #ts-panel-input {
                width: 100%;
                box-sizing: border-box;
                padding: 7px 10px;
                border-radius: 8px;
                border: 1px solid rgba(128,128,128,0.3);
                background: rgba(255,255,255,0.6);
                color: var(--SmartThemeBodyColor, #333);
                font-size: 13px;
                outline: none;
            }
            #ts-panel-input:focus {
                border-color: rgba(93,202,165,0.8);
            }
            #ts-count-label {
                font-size: 11px;
                color: rgba(128,128,128,0.7);
                padding: 3px 2px 0;
            }
            #ts-list {
                overflow-y: auto;
                flex: 1;
                padding: 6px 0;
            }
            .ts-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 9px 14px;
                font-size: 13px;
                cursor: pointer;
                color: var(--SmartThemeBodyColor, #333);
                transition: background 0.1s;
            }
            .ts-item:active { background: rgba(93,202,165,0.15); }
            .ts-item.ts-active { color: #0F6E56; font-weight: 600; }
            .ts-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                border: 2px solid rgba(128,128,128,0.4);
                flex-shrink: 0;
                margin-left: 8px;
            }
            .ts-dot.on { background: #1D9E75; border-color: #1D9E75; }
            .ts-highlight { background: rgba(93,202,165,0.35); border-radius: 2px; }
            #ts-empty {
                text-align: center;
                padding: 20px;
                font-size: 13px;
                color: rgba(128,128,128,0.6);
                display: none;
            }
        `;
        document.head.appendChild(style);

        // 创建悬浮按钮
        const fab = document.createElement('button');
        fab.id = 'ts-fab';
        fab.title = '主题搜索';
        fab.textContent = '🔍';
        document.body.appendChild(fab);

        // 创建面板
        const panel = document.createElement('div');
        panel.id = 'ts-panel';
        panel.innerHTML = `
            <div id="ts-panel-header">
                <input id="ts-panel-input" type="text" placeholder="搜索主题名..." autocomplete="off" />
                <div id="ts-count-label"></div>
            </div>
            <div id="ts-list"></div>
            <div id="ts-empty">没有找到匹配的主题 🌧</div>
        `;
        document.body.appendChild(panel);

        const input = document.getElementById('ts-panel-input');
        const list = document.getElementById('ts-list');
        const countLabel = document.getElementById('ts-count-label');
        const emptyEl = document.getElementById('ts-empty');

        function highlight(text, q) {
            if (!q) return text;
            const i = text.toLowerCase().indexOf(q.toLowerCase());
            if (i === -1) return text;
            return text.slice(0, i)
                + '<span class="ts-highlight">' + text.slice(i, i + q.length) + '</span>'
                + text.slice(i + q.length);
        }

        function renderList(q) {
            const themes = getThemes();
            const filtered = themes.filter(t =>
                !q || t.text.toLowerCase().includes(q.toLowerCase())
            );
            list.innerHTML = '';
            if (filtered.length === 0) {
                emptyEl.style.display = 'block';
                countLabel.textContent = '0 个结果';
                return;
            }
            emptyEl.style.display = 'none';
            countLabel.textContent = q
                ? `${filtered.length} / ${themes.length} 个主题`
                : `共 ${themes.length} 个主题`;

            filtered.forEach(t => {
                const item = document.createElement('div');
                item.className = 'ts-item' + (t.selected ? ' ts-active' : '');
                item.innerHTML = `<span>${highlight(t.text, q)}</span><div class="ts-dot ${t.selected ? 'on' : ''}"></div>`;
                item.addEventListener('click', () => {
                    applyTheme(t.value);
                    setTimeout(() => renderList(input.value), 300);
                });
                list.appendChild(item);
            });
        }

        // 开关面板
        fab.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = panel.classList.toggle('open');
            if (isOpen) {
                renderList('');
                setTimeout(() => input.focus(), 80);
            }
        });

        // 点击面板外关闭
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target !== fab) {
                panel.classList.remove('open');
            }
        });

        // 搜索过滤
        input.addEventListener('input', () => renderList(input.value.trim()));

        console.log('[ThemeSearch] 悬浮搜索面板已启动 ✓');
    }
})();
