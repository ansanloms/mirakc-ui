import { useState } from "react";
import Icon from "../../atoms/Icon.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./ServerCard.module.css";

type Props = {
  /** ntfy の URL (トピック込み)。 */
  url: string;

  /** アクセストークン。 */
  token: string;

  /** URL のエラー種別。undefined ならヒントを表示する。 */
  urlError?: "invalid" | "required";

  /** テスト送信ボタンの活性 (URL が有効な形式のとき)。 */
  testEnabled: boolean;

  /** テスト送信中。 */
  testing: boolean;

  onChangeUrl: (url: string) => void;
  onChangeToken: (token: string) => void;
  onTest: () => void;
};

/** ntfy.sh サーバー設定カード。送信先 URL・トークン・テスト送信。 */
export default function ServerCard(props: Props) {
  // トークンの表示/非表示は純 UI 状態なのでローカルで持つ。
  const [showToken, setShowToken] = useState(false);

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <span className={styles.headIcon}>
          <Icon size={20}>dns</Icon>
        </span>
        <div>
          <h2 className={styles.title}>{t("notification.server.title")}</h2>
          <p className={styles.description}>
            {t("notification.server.description")}
          </p>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.fieldLabel}>
              {t("notification.server.url")}
            </span>
          </div>
          <input
            type="text"
            className={`${styles.input} ${
              props.urlError !== undefined ? styles.inputBad : ""
            }`}
            value={props.url}
            placeholder={t("notification.server.urlPlaceholder")}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => props.onChangeUrl(event.target.value)}
          />
          {props.urlError === "invalid"
            ? (
              <p className={styles.fieldError}>
                {t("notification.server.urlInvalid")}
              </p>
            )
            : props.urlError === "required"
            ? (
              <p className={styles.fieldError}>
                {t("notification.server.urlRequired")}
              </p>
            )
            : (
              <p className={styles.fieldHint}>
                {t("notification.server.urlHint")}
              </p>
            )}
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.fieldLabel}>
              {t("notification.server.token")}
            </span>
            <span className={styles.optTag}>
              {t("notification.server.optional")}
            </span>
          </div>
          <div className={styles.tokenWrap}>
            <input
              type={showToken ? "text" : "password"}
              className={`${styles.input} ${styles.tokenInput}`}
              value={props.token}
              placeholder={t("notification.server.tokenPlaceholder")}
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => props.onChangeToken(event.target.value)}
            />
            <button
              type="button"
              className={styles.eyeButton}
              aria-label={showToken
                ? t("notification.server.hideToken")
                : t("notification.server.showToken")}
              onClick={() => setShowToken(!showToken)}
            >
              <Icon size={16}>
                {showToken ? "visibility_off" : "visibility"}
              </Icon>
            </button>
          </div>
          <p className={styles.fieldHint}>
            {t("notification.server.tokenHint")}
          </p>
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
          {t("notification.server.test")}
        </button>
      </div>
    </section>
  );
}
