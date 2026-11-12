export type ModelTab = "best" | "compatible" | "stretch" | "heavy";

type ModelTabsProps = {
  activeTab: ModelTab;
  counts: Record<ModelTab, number>;
  onTabChange: (tab: ModelTab) => void;
};

const tabs: { id: ModelTab; label: string }[] = [
  { id: "best", label: "Best Matches" },
  { id: "compatible", label: "All Compatible" },
  { id: "stretch", label: "Stretch" },
  { id: "heavy", label: "Too Heavy" },
];

export function ModelTabs({ activeTab, counts, onTabChange }: ModelTabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label="Model compatibility groups">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={activeTab === tab.id ? "active" : ""}
          onClick={() => onTabChange(tab.id)}
        >
          <span>{tab.label}</span>
          <strong>{counts[tab.id]}</strong>
        </button>
      ))}
    </div>
  );
}
