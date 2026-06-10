import {
  NOTIFICATION_EVENT_KEYS,
  type NotificationEventKey,
  type NotificationSettings,
} from "../../../../server/lib/notification-settings.ts";
import Icon from "../../atoms/Icon.tsx";
import ToggleSwitch from "../../atoms/ToggleSwitch.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./EventToggles.module.css";

type Props = {
  /** 各イベントの ON/OFF。NotificationSettings のトグル部分。 */
  values: Pick<NotificationSettings, NotificationEventKey>;

  /** イベントの ON/OFF を切り替える。 */
  onToggle: (key: NotificationEventKey) => void;
};

// アイコン・配色はメタデータなので code 側に置く (表示文言は locales)。
const EVENT_ROWS: Record<NotificationEventKey, { icon: string; tone: string }> =
  {
    onSchedule: { icon: "event_available", tone: "schedule" },
    onStart: { icon: "fiber_manual_record", tone: "start" },
    onEnd: { icon: "check", tone: "end" },
    onFail: { icon: "error", tone: "fail" },
    onRemove: { icon: "event_busy", tone: "remove" },
  };

/**
 * 通知先 (録画イベント) のカード。録画登録・開始・終了・失敗・削除の
 * トグル行を NOTIFICATION_EVENT_KEYS の順で描画する。
 */
export default function EventToggles(props: Props) {
  const anyEnabled = NOTIFICATION_EVENT_KEYS.some((key) => props.values[key]);

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <span className={styles.headIcon}>
          <Icon size={20}>notifications</Icon>
        </span>
        <div>
          <h2 className={styles.title}>{t("notification.events.title")}</h2>
          <p className={styles.description}>
            {t("notification.events.description")}
          </p>
        </div>
      </div>

      <div className={styles.body}>
        {NOTIFICATION_EVENT_KEYS.map((key) => (
          <div key={key} className={styles.row}>
            <span
              className={`${styles.rowIcon} ${styles[EVENT_ROWS[key].tone]}`}
            >
              <Icon size={14}>{EVENT_ROWS[key].icon}</Icon>
            </span>
            <span className={styles.rowText}>
              <span className={styles.rowName}>
                {t(`notification.events.items.${key}.label`)}
              </span>
              <span className={styles.rowDescription}>
                {t(`notification.events.items.${key}.description`)}
              </span>
            </span>
            <ToggleSwitch
              checked={props.values[key]}
              label={t(`notification.events.items.${key}.label`)}
              onToggle={() =>
                props.onToggle(key)}
            />
          </div>
        ))}

        {!anyEnabled && (
          <p className={styles.hint}>{t("notification.events.none")}</p>
        )}
      </div>
    </section>
  );
}
