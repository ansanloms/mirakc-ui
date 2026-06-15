import type { ReactNode } from "react";
import type { LiveCommentMapping } from "../../lib/api/live-comment-settings.ts";
import type { ChannelGroup } from "../../lib/service.ts";
import Icon from "../atoms/Icon.tsx";
import PageHeader from "../organisms/PageHeader.tsx";
import MappingCard from "../organisms/LiveComment/MappingCard.tsx";
import DefaultsButton, {
  type DefaultRegionOption,
} from "../organisms/LiveComment/DefaultsButton.tsx";
import ColorSchemeToggle from "../../islands/ColorSchemeToggle.tsx";
import { t } from "../../locales/i18n.ts";
import styles from "./LiveCommentSettings.module.css";

type Props = {
  /** 登録済みの割り当て一覧。 */
  mappings: LiveCommentMapping[];

  /** チャンネルのバッジ・名前の表示に使うチャンネル一覧。 */
  channels: ChannelGroup[];

  /** トグル・削除の処理中。操作を無効にする。 */
  busy?: boolean;

  /** デフォルト一括登録の地域選択肢。空ならボタンを出さない。 */
  regions: DefaultRegionOption[];

  /** デフォルト一括登録の処理中。 */
  applyingDefaults?: boolean;

  /** 選択地域のデフォルトを一括登録する (既存は上書き)。 */
  onApplyDefaults: (regionId: string) => void;

  /** 新規登録モーダル (/settings/live-comments/new) へ遷移する。 */
  onAdd: () => void;

  /** 編集モーダル (/settings/live-comments/$id) へ遷移する。 */
  onEdit: (mapping: LiveCommentMapping) => void;

  /** 有効/停止を切り替える。 */
  onToggle: (mapping: LiveCommentMapping) => void;

  /** 割り当てを削除する。 */
  onRemove: (mapping: LiveCommentMapping) => void;

  /** 設定ポータル (/settings) へ戻る。 */
  onBackToSettings: () => void;

  /** 番組表へ戻る。 */
  onBack: () => void;

  /** 視聴画面 (/watch) へ遷移する。 */
  onOpenWatch: () => void;

  /** モーダル用のスロット (子ルートの Outlet を流し込む)。 */
  children?: ReactNode;
};

/**
 * 実況連携の管理ページ。ツールバー + 集計付きヘッダ + 割り当てカード一覧。
 * 空状態は登録ボタン付きの案内を出す。登録/編集モーダルは子ルートが描画し、
 * `children` (Outlet) としてこの上に重なる (KeywordRules テンプレと同じ構成)。
 */
export default function LiveCommentSettings(props: Props) {
  const channelOf = (mapping: LiveCommentMapping): ChannelGroup | undefined =>
    props.channels.find((channel) => channel.id === mapping.channel);

  const enabledCount = props.mappings.filter((m) => m.enabled).length;

  return (
    <div className="app-root">
      <PageHeader
        icon="forum"
        title={t("liveComment.title")}
        subtitle={t("liveComment.subtitle")}
        links={[
          {
            icon: "grid_view",
            label: t("liveComment.toolbar.epg"),
            onClick: props.onBack,
          },
          {
            icon: "live_tv",
            label: t("watch.open"),
            onClick: props.onOpenWatch,
          },
          {
            icon: "settings",
            label: t("liveComment.toolbar.settings"),
            onClick: props.onBackToSettings,
          },
        ]}
      >
        <ColorSchemeToggle />
      </PageHeader>

      <main className={styles.page}>
        <div className={styles.pageInner}>
          {props.mappings.length === 0
            ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>
                  <Icon size={44}>forum</Icon>
                </span>
                <h2 className={styles.emptyTitle}>
                  {t("liveComment.empty.title")}
                </h2>
                <p className={styles.emptyText}>
                  {t("liveComment.empty.description")}
                </p>
                <div className={styles.emptyActions}>
                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={props.onAdd}
                  >
                    <Icon size={16}>add</Icon>
                    {t("liveComment.add")}
                  </button>
                  <DefaultsButton
                    regions={props.regions}
                    busy={props.applyingDefaults}
                    onApply={props.onApplyDefaults}
                  />
                </div>
              </div>
            )
            : (
              <>
                <div className={styles.pageHead}>
                  <div className={styles.pageHeadText}>
                    <h2 className={styles.pageTitle}>
                      {t("liveComment.head.title")}
                    </h2>
                    <p className={styles.pageSummary}>
                      {t("liveComment.head.summary", {
                        total: props.mappings.length,
                        enabled: enabledCount,
                      })}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    <DefaultsButton
                      regions={props.regions}
                      busy={props.applyingDefaults}
                      onApply={props.onApplyDefaults}
                    />
                    <button
                      type="button"
                      className={styles.addButton}
                      onClick={props.onAdd}
                    >
                      <Icon size={16}>add</Icon>
                      {t("liveComment.add")}
                    </button>
                  </div>
                </div>
                <ul className={styles.list}>
                  {props.mappings.map((mapping) => (
                    <li key={mapping.id}>
                      <MappingCard
                        mapping={mapping}
                        channel={channelOf(mapping)}
                        disabled={props.busy}
                        onToggle={() => props.onToggle(mapping)}
                        onEdit={() => props.onEdit(mapping)}
                        onRemove={() => props.onRemove(mapping)}
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
