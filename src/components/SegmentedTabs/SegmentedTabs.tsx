import {
    useRef,
    type KeyboardEvent,
    type ReactNode,
} from 'react'

import './SegmentedTabs.scss'

export interface SegmentedTabOption<Value extends string> {
    value: Value
    label: ReactNode
    disabled?: boolean
}

export type SegmentedTabOptions<Value extends string> = readonly [
    SegmentedTabOption<Value>,
    SegmentedTabOption<Value>,
    SegmentedTabOption<Value>?,
]

export interface SegmentedTabsProps<Value extends string> {
    items: SegmentedTabOptions<Value>
    value: Value
    onChange: (value: Value) => void
    ariaLabel: string
    className?: string
    idPrefix?: string
}

export function SegmentedTabs<Value extends string>({
    items,
    value,
    onChange,
    ariaLabel,
    className = '',
    idPrefix,
}: SegmentedTabsProps<Value>) {
    const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

    function selectByKeyboard(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
        const enabledIndexes = items.reduce<number[]>((indexes, item, index) => {
            if (item && !item.disabled) indexes.push(index)
            return indexes
        }, [])

        if (!enabledIndexes.length) return

        const currentEnabledIndex = enabledIndexes.indexOf(currentIndex)
        let nextEnabledIndex = currentEnabledIndex

        if (event.key === 'ArrowRight') {
            nextEnabledIndex = (currentEnabledIndex + 1) % enabledIndexes.length
        } else if (event.key === 'ArrowLeft') {
            nextEnabledIndex = (currentEnabledIndex - 1 + enabledIndexes.length) % enabledIndexes.length
        } else if (event.key === 'Home') {
            nextEnabledIndex = 0
        } else if (event.key === 'End') {
            nextEnabledIndex = enabledIndexes.length - 1
        } else {
            return
        }

        event.preventDefault()
        const nextIndex = enabledIndexes[nextEnabledIndex]
        const nextItem = nextIndex === undefined ? undefined : items[nextIndex]

        if (!nextItem || nextIndex === undefined) return

        onChange(nextItem.value)
        buttonRefs.current[nextIndex]?.focus()
    }

    return (
        <div className={`segmented-tabs flex ${className}`} role="tablist" aria-label={ariaLabel}>
            {items.map((item, index) => {
                if (!item) return null

                const selected = item.value === value
                const tabId = idPrefix ? `${idPrefix}-${item.value}-tab` : undefined
                const panelId = idPrefix ? `${idPrefix}-${item.value}-panel` : undefined

                return (
                    <button
                        key={item.value}
                        ref={(element) => { buttonRefs.current[index] = element }}
                        id={tabId}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-controls={panelId}
                        tabIndex={selected ? 0 : -1}
                        disabled={item.disabled}
                        className={`segmented-tabs__item flex-center size-28 bold-5 ${selected ? 'segmented-tabs__item--active' : ''}`}
                        onClick={() => onChange(item.value)}
                        onKeyDown={(event) => selectByKeyboard(event, index)}
                    >
                        <span>{item.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
