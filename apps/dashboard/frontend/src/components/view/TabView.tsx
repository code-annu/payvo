import { useId, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export type TabItem<T extends string> = {
  value: T;
  label: string;
  content: ReactNode;
};

type TabViewProps<T extends string> = {
  tabs: readonly TabItem<T>[];
  ariaLabel: string;
  defaultValue?: T;
  value?: T;
  onValueChange?: (value: T) => void;
  className?: string;
};

export default function TabView<T extends string>({
  tabs,
  ariaLabel,
  defaultValue,
  value,
  onValueChange,
  className = "",
}: TabViewProps<T>) {
  const generatedId = useId();
  const [uncontrolledValue, setUncontrolledValue] = useState<T | undefined>(
    defaultValue ?? tabs[0]?.value,
  );
  const activeValue = value ?? uncontrolledValue;
  const activeIndex = tabs.findIndex((tab) => tab.value === activeValue);
  const activeTab = tabs[activeIndex] ?? tabs[0];

  if (!activeTab) return null;

  const getTabId = (tabValue: T) => `${generatedId}-${tabValue}-tab`;
  const getPanelId = (tabValue: T) => `${generatedId}-${tabValue}-panel`;

  const selectTab = (tabValue: T) => {
    if (value === undefined) setUncontrolledValue(tabValue);
    onValueChange?.(tabValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.value === activeTab.value);
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight")
      nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    const nextTab = tabs[nextIndex]!;
    selectTab(nextTab.value);
    document.getElementById(getTabId(nextTab.value))?.focus();
  };

  return (
    <div className={className}>
      <div className="border-b border-border">
        <div
          role="tablist"
          aria-label={ariaLabel}
          onKeyDown={handleKeyDown}
          className="flex gap-6"
        >
          {tabs.map((tab) => {
            const isSelected = tab.value === activeTab.value;
            return (
              <button
                key={tab.value}
                id={getTabId(tab.value)}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={getPanelId(tab.value)}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => selectTab(tab.value)}
                className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                  isSelected
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <section
        id={getPanelId(activeTab.value)}
        role="tabpanel"
        aria-labelledby={getTabId(activeTab.value)}
        tabIndex={0}
        className="pt-6 outline-none"
      >
        {activeTab.content}
      </section>
    </div>
  );
}
