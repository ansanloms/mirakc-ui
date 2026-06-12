import { useRef, useState } from "react";
import type { components } from "../../lib/api/schema.d.ts";
import {
  isValidNicoliveChannelId,
  type NiconicoSettings,
} from "../../../server/lib/niconico-settings.ts";
import Icon from "../atoms/Icon.tsx";
import Toast from "../molecules/Toast.tsx";
import ChannelMapCard, {
  type MappingRow,
} from "../organisms/Niconico/ChannelMapCard.tsx";
import SaveBar from "../organisms/Notification/SaveBar.tsx";
import ColorSchemeToggle from "../../islands/ColorSchemeToggle.tsx";
import { useToast } from "../../hooks/use-toast.ts";
import { t } from "../../locales/i18n.ts";
import styles from "./Niconico.module.css";

type Service = components["schemas"]["MirakurunService"];

type Props = {
  /** 保存済みの割り当て (未保存なら server が組み立てた既定値)。dirty 判定の基準。 */
  channels: NiconicoSettings["channels"];

  /** 複合サービス ID (文字列キー) → 既知のニコニコチャンネル ID (自動補完)。 */
  suggestions: Record<string, string>;

  /** チャンネル選択肢 (mirakc のサービス一覧)。 */
  services: Service[];

  /** 保存処理中。 */
  saving: boolean;

  /** 設定を保存する。失敗は reject。 */
  onSave: (settings: NiconicoSettings) => Promise<void>;

  /** 設定ポータルへ戻る。 */
  onBack: () => void;
};

/**
 * ニコニコ実況連携の設定ページ。チャンネル割り当てカード + 保存バー。
 * 行 (draft)・自動補完・検証はこのテンプレートが持ち、保存済み設定
 * (props.channels) との比較で dirty を導出する。
 */
export default function Niconico(props: Props) {
  const rowKey = useRef(0);
  const [rows, setRows] = useState<MappingRow[]>(() =>
    props.channels.map((channel) => ({
      key: ++rowKey.current,
      serviceId: channel.serviceId,
      nicoliveChannelId: channel.nicoliveChannelId,
    }))
  );
  const { toast, show } = useToast();

  // 永続化対象 (チャンネル選択済みの行)。検証と dirty 判定もこれを基準にする。
  const persistable = rows
    .filter((row) => row.serviceId !== null)
    .map((row) => ({
      serviceId: row.serviceId!,
      nicoliveChannelId: row.nicoliveChannelId.trim(),
    }));

  const invalidCount = persistable.filter(
    (row) => !isValidNicoliveChannelId(row.nicoliveChannelId),
  ).length;

  const duplicateIds = (() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const row of persistable) {
      if (!isValidNicoliveChannelId(row.nicoliveChannelId)) {
        continue;
      }
      if (seen.has(row.nicoliveChannelId)) {
        duplicates.add(row.nicoliveChannelId);
      } else {
        seen.add(row.nicoliveChannelId);
      }
    }
    return duplicates;
  })();

  const dirty = JSON.stringify(persistable) !== JSON.stringify(props.channels);

  const changeRow = (
    key: number,
    patch: Partial<Pick<MappingRow, "serviceId" | "nicoliveChannelId">>,
  ) => {
    setRows((current) =>
      current.map((row) => {
        if (row.key !== key) {
          return row;
        }
        const next = { ...row, ...patch };
        // チャンネルを選び直したとき、ID が空 or 直前の自動補完のままなら
        // 新しいチャンネルの既知 ID を補完する。
        if (patch.serviceId !== undefined && patch.serviceId !== null) {
          const previous = row.serviceId === null
            ? ""
            : props.suggestions[String(row.serviceId)] ?? "";
          if (
            row.nicoliveChannelId === "" || row.nicoliveChannelId === previous
          ) {
            next.nicoliveChannelId =
              props.suggestions[String(patch.serviceId)] ?? "";
          }
        }
        return next;
      })
    );
  };

  const addRow = (afterKey: number | null) => {
    setRows((current) => {
      const index = afterKey === null
        ? current.length - 1
        : current.findIndex((row) => row.key === afterKey);
      const next = [...current];
      next.splice(index + 1, 0, {
        key: ++rowKey.current,
        serviceId: null,
        nicoliveChannelId: "",
      });
      return next;
    });
  };

  const removeRow = (key: number) => {
    setRows((current) => current.filter((row) => row.key !== key));
  };

  const handleSave = () => {
    props.onSave({ channels: persistable })
      .then(() => show(t("niconico.toast.saved"), "success"))
      .catch(() => show(t("niconico.toast.saveFailed"), "error"));
  };

  return (
    <div className="app-root">
      <header className={styles.toolbar}>
        <span className={styles.mark}>
          <Icon size={20}>forum</Icon>
        </span>
        <div className={styles.titles}>
          <h1 className={styles.title}>{t("niconico.title")}</h1>
          <p className={styles.subtitle}>{t("niconico.subtitle")}</p>
        </div>
        <div className={styles.right}>
          <button
            type="button"
            className={styles.backLink}
            onClick={props.onBack}
          >
            <Icon size={15}>chevron_left</Icon>
            <span className={styles.backLinkText}>
              {t("niconico.backToSettings")}
            </span>
          </button>
          <ColorSchemeToggle />
        </div>
      </header>

      <main className={styles.page}>
        <div className={styles.pageInner}>
          <div className={styles.pageHead}>
            <h2 className={styles.pageTitle}>{t("niconico.title")}</h2>
            <p className={styles.pageLead}>{t("niconico.lead")}</p>
          </div>

          <ChannelMapCard
            rows={rows}
            services={props.services}
            duplicateIds={duplicateIds}
            invalidCount={invalidCount}
            onChangeRow={changeRow}
            onAddRow={addRow}
            onRemoveRow={removeRow}
          />

          <SaveBar
            dirty={dirty}
            saving={props.saving}
            disabled={invalidCount > 0 || duplicateIds.size > 0}
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
