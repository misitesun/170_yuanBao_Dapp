# SegmentedTabs
顶部胶囊分段切换组件。

`SegmentedTabs` is a controlled two-or-three-item tab list. It uses native
buttons with tab semantics, supports pointer and arrow-key selection, and keeps
the selected gradient transition inside the component.

`SegmentedTabs` 是受控的两项或三项 Tab。组件使用原生按钮与 Tab 语义，支持点击及方向键切换，并在组件内部统一处理选中渐变过渡。

```tsx
const items = [
    { value: 'active', label: '进行中' },
    { value: 'done', label: '已完成' },
] as const

<SegmentedTabs
    items={items}
    value={status}
    onChange={setStatus}
    ariaLabel="订单状态"
/>
```
