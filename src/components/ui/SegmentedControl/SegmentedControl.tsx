/**
 * Component: SegmentedControl
 * 탭 내비게이션 (Segmented Control)
 *
 * 스펙:
 *  - Background: #1C1C1E
 *  - Active Tab: White background, Black text, Border Radius 24px
 *  - Inactive Tab: Transparent, White text
 *  - Gap: 8px | Vertical padding: 8px | Width: hug contents
 */
"use client";
import { useState } from "react";
import "./SegmentedControl.css";

export interface SegmentedControlTab {
    /** 탭 식별자 */
    id: string;
    /** 탭 표시 레이블 */
    label: string;
    /** 탭 아이콘 (optional) */
    icon?: string;
}

export interface SegmentedControlProps {
    /** 탭 목록 */
    tabs: SegmentedControlTab[];
    /** 현재 활성 탭 id */
    activeId?: string;
    /** 탭 변경 콜백 */
    onChange?: (id: string) => void;
    /** 전체 너비 레이아웃 */
    fullWidth?: boolean;
    /** 액센트(네온) 활성 탭 스타일 */
    accent?: boolean;
    /** aria-label */
    ariaLabel?: string;
}

export function SegmentedControl({
    tabs,
    activeId,
    onChange,
    fullWidth = false,
    accent = false,
    ariaLabel = "탭 내비게이션",
}: SegmentedControlProps) {
    const [internalActive, setInternalActive] = useState(
        activeId ?? tabs[0]?.id
    );

    const currentActive = activeId ?? internalActive;

    const handleClick = (id: string) => {
        setInternalActive(id);
        onChange?.(id);
    };

    return (
        <nav
            className={[
                "segmented-control",
                fullWidth ? "segmented-control--full" : "",
                accent ? "segmented-control--accent" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            role="tablist"
            aria-label={ariaLabel}
        >
            {tabs.map((tab) => {
                const isActive = tab.id === currentActive;
                return (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`panel-${tab.id}`}
                        id={`tab-${tab.id}`}
                        className={[
                            "segmented-control__tab",
                            isActive
                                ? "segmented-control__tab--active"
                                : "segmented-control__tab--inactive",
                        ].join(" ")}
                        onClick={() => handleClick(tab.id)}
                    >
                        {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
}
