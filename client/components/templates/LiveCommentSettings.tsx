import { useRef, useState } from "react";
import type { components } from "../../lib/api/schema.d.ts";
import {
  type ChannelMapping,
  isValidChannelId,
  LIVE_COMMENT_SOURCE_IDS,
  type LiveCommentSettings,
  type LiveCommentSourceId,
} from "../../../server/lib/live-comment-settings.ts";
import Icon from "../atoms/Icon.tsx";
import Toast from "../molecules/Toast.tsx";
import SourceSegment from "../organisms/LiveComment/SourceSegment.tsx";
import ChannelMapCard, {
  type MappingRow,
} from "../organisms/LiveComment/ChannelMapCard.tsx";
import SaveBar from "../organisms/Notification/SaveBar.tsx";
import ColorSchemeToggle from "../../islands/ColorSchemeToggle.tsx";
import { useToast } from "../../hooks/use-toast.ts";
import { t } from "../../locales/i18n.ts";
import styles from "./LiveCommentSettings.module.css";

type Service = components["schemas"]["MirakurunService"];

type Props = {
  /** 取得元ごとの保存済み割り当て (未保存なら既定値)。dirty 判定の基準。 */
  channels: Record<LiveCommentSourceId, ChannelMapping[]>;

  /** 取得元ごとの自動補完候補 (複合サービス ID 文字列 → チャンネル ID)。 */
  suggestions: Record<LiveCommentSourceId, Record<string, string>>;

  /** チャンネル選択肢 (mirakc のサービス一覧)。 */
  services: Service[];

  /** 保存処理中。 */
  saving: boolean;

  /** 設定を保存する。失敗は reject。 */
  onSave: (settings: LiveCommentSettings) => Promise<void>;

  /** 設定ポータルへ戻る。 */
  onBack: () => void;
};

type Validation = { invalidCount: number; duplicateIds: Set<string> };

/** serviceId 選択済みの行だけを永続化対象に整える。 */
function persistableOf(rows: MappingRow[]): ChannelMapping[] {
  return rows
    .filter((row) => row.serviceId !== null)
    .map((row) => ({
      serviceId: row.serviceId!,
      channelId: row.channelId.trim(),
      enabled: row.enabled,
    }));
}

/** 1 取得元の検証: 有効行の形式不正数とチャンネル ID 重複。 */
function validate(
  source: LiveCommentSourceId,
  rows: MappingRow[],
): Validation {
  const persistable = persistableOf(rows);
  const invalidCount = persistable.filter(
    (row) => row.enabled && !isValidChannelId(source, row.channelId),
  ).length;
  const seen = new Set<string>();
  const duplicateIds = new Set<string>();
  for (const row of persistable) {
    if (!row.enabled || !isValidChannelId(source, row.channelId)) {
      continue;
    }
    if (seen.has(row.channelId)) {
      duplicateIds.add(row.channelId);
    } else {
      seen.add(row.channelId);
    }
  }
  return { invalidCount, duplicateIds };
}

/**
 * 実況連携の設定ページ。取得元セグメント + 取得元別のチャンネル割り当て
 * カード + 保存バー。割り当ては取得元ごとに別々に draft 保持し (切替で
 * 失わない)、保存済み (props.channels) との比較で dirty を導出する。
 * 検証は全取得元に対して行い、どれか不正なら保存できない。
 */
export default function LiveCommentSettings(props: Props) {
  const rowKey = useRef(0);
  const toRows = (channels: ChannelMapping[]): MappingRow[] =>
    channels.map((channel) => ({
      key: ++rowKey.current,
      serviceId: channel.serviceId,
      channelId: channel.channelId,
      enabled: channel.enabled,
    }));
  const [rowsBySource, setRowsBySource] = useState<
    Record<LiveCommentSourceId, MappingRow[]>
  >(() => {
    const initial = {} as Record<LiveCommentSourceId, MappingRow[]>;
    for (const source of LIVE_COMMENT_SOURCE_IDS) {
      initial[source] = toRows(props.channels[source]);
    }
    return initial;
  });
  const [selected, setSelected] = useState<LiveCommentSourceId>(
    LIVE_COMMENT_SOURCE_IDS[0],
  );
  const { toast, show } = useToast();

  const persistable = {} as LiveCommentSettings;
  for (const source of LIVE_COMMENT_SOURCE_IDS) {
    persistable[source] = persistableOf(rowsBySource[source]);
  }

  const validations = {} as Record<LiveCommentSourceId, Validation>;
  for (const source of LIVE_COMMENT_SOURCE_IDS) {
    validations[source] = validate(source, rowsBySource[source]);
  }
  const hasError = LIVE_COMMENT_SOURCE_IDS.some(
    (source) =>
      validations[source].invalidCount > 0 ||
      validations[source].duplicateIds.size > 0,
  );
  const current = validations[selected];

  const dirty = JSON.stringify(persistable) !== JSON.stringify(props.channels);

  const changeRow = (
    key: number,
    patch: Partial<Pick<MappingRow, "serviceId" | "channelId" | "enabled">>,
  ) => {
    setRowsBySource((currentRows) => ({
      ...currentRows,
      [selected]: currentRows[selected].map((row) => {
        if (row.key !== key) {
          return row;
        }
        const next = { ...row, ...patch };
        // チャンネルを選び直したとき、ID が空 or 直前の自動補完のままなら
        // 新しいチャンネルの既知 ID を補完する。
        if (patch.serviceId !== undefined && patch.serviceId !== null) {
          const previous = row.serviceId === null
            ? ""
            : props.suggestions[selected][String(row.serviceId)] ?? "";
          if (row.channelId === "" || row.channelId === previous) {
            next.channelId =
              props.suggestions[selected][String(patch.serviceId)] ?? "";
          }
        }
        return next;
      }),
    }));
  };

  const addRow = () => {
    setRowsBySource((currentRows) => ({
      ...currentRows,
      [selected]: [
        ...currentRows[selected],
        {
          key: ++rowKey.current,
          serviceId: null,
          channelId: "",
          enabled: true,
        },
      ],
    }));
  };

  const removeRow = (key: number) => {
    setRowsBySource((currentRows) => ({
      ...currentRows,
      [selected]: currentRows[selected].filter((row) => row.key !== key),
    }));
  };

  const handleSave = () => {
    props.onSave(persistable)
      .then(() => show(t("liveComment.toast.saved"), "success"))
      .catch(() => show(t("liveComment.toast.saveFailed"), "error"));
  };

  return (
    <div className="app-root">
      <header className={styles.toolbar}>
        <span className={styles.mark}>
          <Icon size={20}>forum</Icon>
        </span>
        <div className={styles.titles}>
          <h1 className={styles.title}>{t("liveComment.title")}</h1>
          <p className={styles.subtitle}>{t("liveComment.subtitle")}</p>
        </div>
        <div className={styles.right}>
          <button
            type="button"
            className={styles.backLink}
            onClick={props.onBack}
          >
            <Icon size={15}>chevron_left</Icon>
            <span className={styles.backLinkText}>
              {t("liveComment.backToSettings")}
            </span>
          </button>
          <ColorSchemeToggle />
        </div>
      </header>

      <main className={styles.page}>
        <div className={styles.pageInner}>
          <div className={styles.pageHead}>
            <h2 className={styles.pageTitle}>{t("liveComment.title")}</h2>
            <p className={styles.pageLead}>{t("liveComment.lead")}</p>
          </div>

          <SourceSegment
            sources={[...LIVE_COMMENT_SOURCE_IDS]}
            selected={selected}
            onSelect={setSelected}
          />

          <ChannelMapCard
            source={selected}
            rows={rowsBySource[selected]}
            services={props.services}
            duplicateIds={current.duplicateIds}
            invalidCount={current.invalidCount}
            onChangeRow={changeRow}
            onAddRow={addRow}
            onRemoveRow={removeRow}
          />

          <SaveBar
            dirty={dirty}
            saving={props.saving}
            disabled={hasError}
            onSave={handleSave}
          />
        </div>
      </main>

      {toast !== null && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          leaving={toast.leaving}
        />
      )}
    </div>
  );
}
