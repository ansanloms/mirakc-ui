import Icon from "../../atoms/Icon.tsx";
import ToggleSwitch from "../../atoms/ToggleSwitch.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./EventToggles.module.css";

type Props = {
  /** 録画開始を通知する。 */
  onStart: boolean;

  /** 録画終了を通知する。 */
  onEnd: boolean;

  onToggleStart: () => void;
  onToggleEnd: () => void;
};

/** 通知先 (録画イベント) のカード。録画開始・終了のトグル行。 */
export default function EventToggles(props: Props) {
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
        <div className={styles.row}>
          <span className={`${styles.rowIcon} ${styles.start}`}>
            <Icon size={14}>fiber_manual_record</Icon>
          </span>
          <span className={styles.rowText}>
            <span className={styles.rowName}>
              {t("notification.events.start")}
            </span>
            <span className={styles.rowDescription}>
              {t("notification.events.startDescription")}
            </span>
          </span>
          <ToggleSwitch
            checked={props.onStart}
            label={t("notification.events.start")}
            onToggle={props.onToggleStart}
          />
        </div>

        <div className={styles.row}>
          <span className={`${styles.rowIcon} ${styles.end}`}>
            <Icon size={14}>check</Icon>
          </span>
          <span className={styles.rowText}>
            <span className={styles.rowName}>
              {t("notification.events.end")}
            </span>
            <span className={styles.rowDescription}>
              {t("notification.events.endDescription")}
            </span>
          </span>
          <ToggleSwitch
            checked={props.onEnd}
            label={t("notification.events.end")}
            onToggle={props.onToggleEnd}
          />
        </div>

        {!props.onStart && !props.onEnd && (
          <p className={styles.hint}>{t("notification.events.none")}</p>
        )}
      </div>
    </section>
  );
}
