import { useState } from "react";
import {
  isValidNtfyUrl,
  NOTIFICATION_EVENT_KEYS,
  type NotificationSettings,
} from "../../../server/lib/notification-settings.ts";
import Icon from "../atoms/Icon.tsx";
import Toast from "../molecules/Toast.tsx";
import ServerCard from "../organisms/Notification/ServerCard.tsx";
import EventToggles from "../organisms/Notification/EventToggles.tsx";
import SaveBar from "../organisms/Notification/SaveBar.tsx";
import ColorSchemeToggle from "../../islands/ColorSchemeToggle.tsx";
import { useToast } from "../../hooks/use-toast.ts";
import { t } from "../../locales/i18n.ts";
import styles from "./Notification.module.css";

type Props = {
  /** 保存済みの設定。draft の初期値と dirty 判定の基準。 */
  settings: NotificationSettings;

  /** 保存処理中。 */
  saving: boolean;

  /** テスト送信中。 */
  testing: boolean;

  /** 設定を保存する。失敗は reject。 */
  onSave: (settings: NotificationSettings) => Promise<void>;

  /** draft の url / token でテスト通知を送る。失敗は reject。 */
  onTest: (target: { url: string; token: string }) => Promise<void>;

  /** 設定ポータル (/settings) へ戻る。 */
  onBackToSettings: () => void;

  /** 番組表へ戻る。 */
  onBack: () => void;

  /** 視聴画面 (/watch) へ遷移する。 */
  onOpenWatch: () => void;
};

/**
 * ntfy 通知設定ページ。サーバーカード + 通知先カード + 保存バー。
 * draft はこのテンプレートが保持し、保存済み設定 (props.settings) との
 * 比較で dirty を導出する。保存成功で props.settings が更新されれば
 * dirty は自然に消える。
 */
export default function Notification(props: Props) {
  const [draft, setDraft] = useState(props.settings);
  const [touched, setTouched] = useState(false);
  const { toast, show } = useToast();

  const set = (patch: Partial<NotificationSettings>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setTouched(true);
  };

  const url = draft.url.trim();
  const anyEvent = NOTIFICATION_EVENT_KEYS.some((key) => draft[key]);
  const urlInvalid = url !== "" && !isValidNtfyUrl(url);
  const urlMissing = anyEvent && url === "";
  const urlError = !touched
    ? undefined
    : urlInvalid
    ? "invalid" as const
    : urlMissing
    ? "required" as const
    : undefined;

  const dirty = (
    ["url", "token", ...NOTIFICATION_EVENT_KEYS] as const
  ).some((key) => draft[key] !== props.settings[key]);

  const handleSave = () => {
    props.onSave({ ...draft, url, token: draft.token.trim() })
      .then(() => show(t("notification.toast.saved"), "success"))
      .catch(() => show(t("notification.toast.saveFailed"), "error"));
  };

  const handleTest = () => {
    props.onTest({ url, token: draft.token.trim() })
      .then(() => show(t("notification.toast.testSent"), "success"))
      .catch(() => show(t("notification.toast.testFailed"), "error"));
  };

  return (
    <div className="app-root">
      <header className={styles.toolbar}>
        <span className={styles.mark}>
          <Icon size={20}>notifications</Icon>
        </span>
        <div className={styles.titles}>
          <h1 className={styles.title}>{t("notification.title")}</h1>
          <p className={styles.subtitle}>{t("notification.subtitle")}</p>
        </div>
        <div className={styles.right}>
          <button
            type="button"
            className={styles.epgLink}
            onClick={props.onBack}
            aria-label={t("notification.epg")}
          >
            <Icon size={18}>grid_view</Icon>
          </button>
          <button
            type="button"
            className={styles.epgLink}
            onClick={props.onOpenWatch}
            aria-label={t("watch.open")}
          >
            <Icon size={18}>live_tv</Icon>
          </button>
          <button
            type="button"
            className={styles.epgLink}
            onClick={props.onBackToSettings}
            aria-label={t("notification.settings")}
          >
            <Icon size={18}>settings</Icon>
          </button>
          <ColorSchemeToggle />
        </div>
      </header>

      <main className={styles.page}>
        <div className={styles.pageInner}>
          <div className={styles.pageHead}>
            <h2 className={styles.pageTitle}>{t("notification.title")}</h2>
            <p className={styles.pageLead}>{t("notification.lead")}</p>
          </div>

          <ServerCard
            url={draft.url}
            token={draft.token}
            urlError={urlError}
            testEnabled={isValidNtfyUrl(url)}
            testing={props.testing}
            onChangeUrl={(value) => set({ url: value })}
            onChangeToken={(value) => set({ token: value })}
            onTest={handleTest}
          />

          <EventToggles
            values={draft}
            onToggle={(key) => set({ [key]: !draft[key] })}
          />

          <SaveBar
            dirty={dirty}
            saving={props.saving}
            disabled={urlInvalid || urlMissing}
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
