import { useForm } from "@tanstack/react-form";
import {
  isValidNtfyUrl,
  NOTIFICATION_EVENT_KEYS,
  type NotificationSettings,
} from "../../../server/lib/notification-settings.ts";
import PageHeader from "../organisms/PageHeader.tsx";
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
 * フォーム状態は @tanstack/react-form の useForm に集約し、保存済み設定
 * (props.settings) を defaultValues にする。dirty は現在値と props.settings
 * の比較で導出するため、保存成功で props.settings が更新されれば dirty は
 * 自然に消える。URL エラーは「一度でも変更したか (dirty)」を解禁条件にする。
 */
export default function Notification(props: Props) {
  const { toast, show } = useToast();

  const form = useForm({
    defaultValues: props.settings,
    onSubmit: ({ value }) => {
      props.onSave({
        ...value,
        url: value.url.trim(),
        token: value.token.trim(),
      })
        .then(() => show(t("notification.toast.saved"), "success"))
        .catch(() => show(t("notification.toast.saveFailed"), "error"));
    },
  });

  const test = (values: NotificationSettings) => {
    props.onTest({ url: values.url.trim(), token: values.token.trim() })
      .then(() => show(t("notification.toast.testSent"), "success"))
      .catch(() => show(t("notification.toast.testFailed"), "error"));
  };

  return (
    <div className="app-root">
      <PageHeader
        icon="notifications"
        title={t("notification.title")}
        subtitle={t("notification.subtitle")}
        links={[
          {
            icon: "grid_view",
            label: t("notification.epg"),
            onClick: props.onBack,
          },
          {
            icon: "live_tv",
            label: t("watch.open"),
            onClick: props.onOpenWatch,
          },
          {
            icon: "settings",
            label: t("notification.settings"),
            onClick: props.onBackToSettings,
          },
        ]}
      >
        <ColorSchemeToggle />
      </PageHeader>

      <main className={styles.page}>
        <div className={styles.pageInner}>
          <div className={styles.pageHead}>
            <h2 className={styles.pageTitle}>{t("notification.title")}</h2>
            <p className={styles.pageLead}>{t("notification.lead")}</p>
          </div>

          <form.Subscribe selector={(s) => s.values}>
            {(values) => {
              const url = values.url.trim();
              const anyEvent = NOTIFICATION_EVENT_KEYS.some((key) =>
                values[key]
              );
              const urlInvalid = url !== "" && !isValidNtfyUrl(url);
              const urlMissing = anyEvent && url === "";
              const dirty = (
                ["url", "token", ...NOTIFICATION_EVENT_KEYS] as const
              ).some((key) => values[key] !== props.settings[key]);
              const urlError = !dirty
                ? undefined
                : urlInvalid
                ? "invalid" as const
                : urlMissing
                ? "required" as const
                : undefined;

              return (
                <>
                  <ServerCard
                    url={values.url}
                    token={values.token}
                    urlError={urlError}
                    testEnabled={isValidNtfyUrl(url)}
                    testing={props.testing}
                    onChangeUrl={(value) => form.setFieldValue("url", value)}
                    onChangeToken={(value) =>
                      form.setFieldValue("token", value)}
                    onTest={() => test(values)}
                  />

                  <EventToggles
                    values={values}
                    onToggle={(key) => form.setFieldValue(key, !values[key])}
                  />

                  <SaveBar
                    dirty={dirty}
                    saving={props.saving}
                    disabled={urlInvalid || urlMissing}
                    onSave={() => form.handleSubmit()}
                  />
                </>
              );
            }}
          </form.Subscribe>
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
