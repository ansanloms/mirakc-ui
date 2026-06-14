import { type ReactNode, useMemo } from "react";
import type { components } from "../../lib/api/schema.d.ts";
import {
  type KeywordRule,
  matchesKeywordRule,
} from "../../../server/lib/keyword-rules.ts";
import { buildUpcoming } from "../../lib/keyword-preview.ts";
import Icon from "../atoms/Icon.tsx";
import RuleCard from "../organisms/KeywordRules/RuleCard.tsx";
import ColorSchemeToggle from "../../islands/ColorSchemeToggle.tsx";
import { t } from "../../locales/i18n.ts";
import styles from "./KeywordRules.module.css";

type Service = components["schemas"]["MirakurunService"];
type Program = components["schemas"]["MirakurunProgram"];

type Props = {
  /** 登録済みルール一覧。 */
  rules: KeywordRule[];

  /** チャンネル条件チップの表示に使うサービス一覧。 */
  services: Service[];

  /** 一致件数の対象にする番組一覧。 */
  programs: Program[];

  /** 現在時刻 (epoch ms)。「今後 7 日間」の起点。データ源 (route) が注入する。 */
  currentEpochMs: number;

  /** トグル・削除の処理中。操作を無効にする。 */
  busy?: boolean;

  /** 新規登録モーダル (/settings/keywords/new) へ遷移する。 */
  onAdd: () => void;

  /** 編集モーダル (/settings/keywords/$ruleId) へ遷移する。 */
  onEdit: (rule: KeywordRule) => void;

  /** 有効/停止を切り替える。 */
  onToggle: (rule: KeywordRule) => void;

  /** ルールを削除する。 */
  onRemove: (rule: KeywordRule) => void;

  /** 設定ポータル (/settings) へ戻る。 */
  onBackToSettings: () => void;

  /** 番組表へ戻る。 */
  onBack: () => void;

  /** モーダル用のスロット (子ルートの Outlet を流し込む)。 */
  children?: ReactNode;
};

/**
 * キーワード自動録画の管理ページ。ツールバー + 集計付きヘッダ + ルールカード
 * 一覧。空状態は登録ボタン付きの案内を出す。登録/編集モーダルは子ルートが
 * 描画し、`children` (Outlet) としてこの上に重なる。
 */
export default function KeywordRules(props: Props) {
  const upcoming = useMemo(
    () => buildUpcoming(props.programs, props.services, props.currentEpochMs),
    [props.programs, props.services, props.currentEpochMs],
  );

  const matchCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const rule of props.rules) {
      counts.set(
        rule.id,
        upcoming.filter((entry) => matchesKeywordRule(rule, entry.target))
          .length,
      );
    }
    return counts;
  }, [props.rules, upcoming]);

  // 有効ルールのいずれかに一致する番組数 (重複は 1 番組と数える)。
  const totalUpcoming = useMemo(() => {
    const ids = new Set<number>();
    for (const rule of props.rules) {
      if (!rule.enabled) {
        continue;
      }
      for (const entry of upcoming) {
        if (matchesKeywordRule(rule, entry.target)) {
          ids.add(entry.program.id);
        }
      }
    }
    return ids.size;
  }, [props.rules, upcoming]);

  const enabledCount = props.rules.filter((rule) => rule.enabled).length;

  return (
    <div className="app-root">
      <header className={styles.toolbar}>
        <span className={styles.mark}>
          <Icon size={20}>label</Icon>
        </span>
        <div className={styles.titles}>
          <h1 className={styles.title}>{t("keyword.title")}</h1>
          <p className={styles.subtitle}>{t("keyword.subtitle")}</p>
        </div>
        <div className={styles.right}>
          <button
            type="button"
            className={styles.epgLink}
            onClick={props.onBackToSettings}
            aria-label={t("keyword.toolbar.settings")}
          >
            <Icon size={18}>settings</Icon>
          </button>
          <button
            type="button"
            className={styles.epgLink}
            onClick={props.onBack}
            aria-label={t("keyword.toolbar.epg")}
          >
            <Icon size={18}>grid_view</Icon>
          </button>
          <ColorSchemeToggle />
        </div>
      </header>

      <main className={styles.page}>
        <div className={styles.pageInner}>
          {props.rules.length === 0
            ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>
                  <Icon size={44}>label</Icon>
                </span>
                <h2 className={styles.emptyTitle}>
                  {t("keyword.empty.title")}
                </h2>
                <p className={styles.emptyText}>
                  {t("keyword.empty.description")}
                </p>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={props.onAdd}
                >
                  <Icon size={16}>add</Icon>
                  {t("keyword.add")}
                </button>
              </div>
            )
            : (
              <>
                <div className={styles.pageHead}>
                  <div className={styles.pageHeadText}>
                    <h2 className={styles.pageTitle}>
                      {t("keyword.head.title")}
                    </h2>
                    <p className={styles.pageSummary}>
                      {t("keyword.head.summary", {
                        total: props.rules.length,
                        enabled: enabledCount,
                        matches: totalUpcoming,
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={props.onAdd}
                  >
                    <Icon size={16}>add</Icon>
                    {t("keyword.add")}
                  </button>
                </div>
                <ul className={styles.list}>
                  {props.rules.map((rule) => (
                    <li key={rule.id}>
                      <RuleCard
                        rule={rule}
                        services={props.services}
                        matchCount={matchCounts.get(rule.id) ?? 0}
                        disabled={props.busy}
                        onToggle={() => props.onToggle(rule)}
                        onEdit={() => props.onEdit(rule)}
                        onRemove={() => props.onRemove(rule)}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
        </div>
      </main>

      {props.children}
    </div>
  );
}
