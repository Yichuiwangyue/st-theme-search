(function () {
    'use strict';

    jQuery(async () => {
        // 等待页面完全加载
        await new Promise(resolve => setTimeout(resolve, 1500));
        patchThemeSelector();
    });

    function patchThemeSelector() {
        // ST 的主题 select 元素 ID
        const $sel = $('#css_theme_select');
        if (!$sel.length) {
            console.log('[ThemeSearch] 找不到 #css_theme_select，换用备用选择器');
            tryFallback();
            return;
        }

        // 监听 Select2 弹窗打开事件
        $sel.on('select2:open', function () {
            setTimeout(injectSearchBox, 30);
        });

        console.log('[ThemeSearch] 已挂载到主题选择器 ✓');
    }

    function tryFallback() {
        // 备用：监听所有 select2 打开
        $(document).on('select2:open', function () {
            setTimeout(injectSearchBox, 30);
        });
    }

    function injectSearchBox() {
        // Select2 的搜索框容器
        const $dropdown = $('.select2-dropdown');
        if (!$dropdown.length) return;

        // 已经注入过了就跳过
        if ($dropdown.find('#ts-search-wrap').length) return;

        const $results = $dropdown.find('.select2-results');
        if (!$results.length) return;

        // 创建搜索框
        const $wrap = $('<div id="ts-search-wrap" style="padding:8px 8px 4px 8px;"></div>');
        const $input = $('<input id="ts-input" type="text" placeholder="🔍 搜索主题..." autocomplete="off" style="width:100%;box-sizing:border-box;padding:6px 10px;border-radius:6px;border:1px solid rgba(128,128,128,0.4);background:rgba(255,255,255,0.08);color:inherit;font-size:13px;outline:none;">')
        const $count = $('<div id="ts-count" style="font-size:11px;padding:2px 2px 0;opacity:0.6;"></div>');

        $wrap.append($input).append($count);
        $results.before($wrap);

        // 获取所有选项
        const $allItems = $results.find('.select2-results__option');
        const total = $allItems.length;
        $count.text(`共 ${total} 个主题`);

        // 实时过滤
        $input.on('input', function () {
            const q = $(this).val().toLowerCase().trim();
            let shown = 0;
            $allItems.each(function () {
                const text = $(this).text().toLowerCase();
                const match = !q || text.includes(q);
                $(this).toggle(match);
                if (match) shown++;
            });
            $count.text(q ? `${shown} / ${total}` : `共 ${total} 个主题`);
        });

        // 自动聚焦
        setTimeout(() => $input.trigger('focus'), 50);

        // 防止输入时 Select2 关闭
        $input.on('click mousedown', function (e) {
            e.stopPropagation();
        });
    }
})();
