import type { ReactNode } from "react";
import { t } from "../../../locales/i18n.ts";
import styles from "./TabPanel.module.css";

/** タブ ID。 */
export type TabId = "select" | "info" | "live";

type Props = {
  /** アクティブなタブ。 */
  tab: TabId;
  /** タブを切り替える。 */
  onChangeTab: (tab: TabId) => void;
  /** 実況コメント件数 (live タブのバッジ)。 */
  liveCount: number;
  /** アクティブタブの内容。 */
  children: ReactNode;
};

const TABS: { id: TabId; label: string }[] = [
  { id: "select", label: t("watch.tab.select") },
  { id: "info", label: t("watch.tab.info") },
  { id: "live", label: t("watch.tab.live") },
];

/** 番組視聴ページのタブパネル。3 タブの切り替えと下線インク・タブ内容を持つ。 */
export default function TabPanel(props: Props) {
  const activeIndex = TABS.findIndex((tab) => tab.id === props.tab);

  return (
    <aside className={styles.panel}>
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tab} ${
              props.tab === tab.id ? styles.active : ""
            }`}
            onClick={() => props.onChangeTab(tab.id)}
          >
            {tab.label}
            {tab.id === "live" && (
              <span className={styles.badge}>{props.liveCount}</span>
            )}
          </button>
        ))}
        <span
          className={styles.ink}
          style={{
            left: `${activeIndex * (100 / TABS.length)}%`,
            width: `${100 / TABS.length}%`,
          }}
        />
      </div>
      <div className={styles.body}>{props.children}</div>
    </aside>
  );
}
