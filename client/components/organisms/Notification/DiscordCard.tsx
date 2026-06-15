import Icon from "../../atoms/Icon.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./DiscordCard.module.css";

type Props = {
  /** Discord の Incoming Webhook URL。 */
  webhookUrl: string;

  /** URL のエラー種別。undefined ならヒントを表示する。 */
  urlError?: "invalid" | "required";

  /** テスト送信ボタンの活性 (Webhook URL が有効な形式のとき)。 */
  testEnabled: boolean;

  /** テスト送信中。 */
  testing: boolean;

  onChangeWebhookUrl: (url: string) => void;
  onTest: () => void;
};

/** Discord 送信先カード。Incoming Webhook URL とテスト送信。 */
export default function DiscordCard(props: Props) {
  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <span className={styles.headIcon}>
          <Icon size={20}>forum</Icon>
        </span>
        <div>
          <h2 className={styles.title}>{t("notification.discord.title")}</h2>
          <p className={styles.description}>
            {t("notification.discord.description")}
          </p>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.fieldLabel}>
              {t("notification.discord.url")}
            </span>
          </div>
          <input
            type="text"
            className={`${styles.input} ${
              props.urlError !== undefined ? styles.inputBad : ""
            }`}
            value={props.webhookUrl}
            placeholder={t("notification.discord.urlPlaceholder")}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => props.onChangeWebhookUrl(event.target.value)}
          />
          {props.urlError === "invalid"
            ? (
              <p className={styles.fieldError}>
                {t("notification.discord.urlInvalid")}
              </p>
            )
            : props.urlError === "required"
            ? (
              <p className={styles.fieldError}>
                {t("notification.discord.urlRequired")}
              </p>
            )
            : (
              <p className={styles.fieldHint}>
                {t("notification.discord.urlHint")}
              </p>
            )}
        </div>
      </div>

      <div className={styles.foot}>
        <button
          type="button"
          className={styles.testButton}
          disabled={!props.testEnabled || props.testing}
          onClick={props.onTest}
        >
          <Icon size={15} spin={props.testing}>
            {props.testing ? "progress_activity" : "send"}
          </Icon>
          {t("notification.discord.test")}
        </button>
      </div>
    </section>
  );
}
