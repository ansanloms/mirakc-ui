import Icon from "../atoms/Icon.tsx";
import ColorSchemeToggle from "../../islands/ColorSchemeToggle.tsx";
import { t } from "../../locales/i18n.ts";
import styles from "./Settings.module.css";

type Props = {
  /** キーワード自動録画の管理ページ (/settings/keywords) へ遷移する。 */
  onOpenKeywords: () => void;

  /** 通知設定 (/settings/notification) へ遷移する。 */
  onOpenNotification: () => void;

  /** 番組表へ戻る。 */
  onBack: () => void;
};

/**
 * 設定ポータル。各設定画面へのナビゲーションカードを並べる。
 * 今後 /settings/notification (通知設定) のカードを追加していく想定。
 */
export default function Settings(props: Props) {
  return (
    <div className="app-root">
      <header className={styles.toolbar}>
        <span className={styles.mark}>
          <Icon size={20}>settings</Icon>
        </span>
        <div className={styles.titles}>
          <h1 className={styles.title}>{t("settings.title")}</h1>
          <p className={styles.subtitle}>{t("settings.subtitle")}</p>
        </div>
        <div className={styles.right}>
          <button
            type="button"
            className={styles.epgLink}
            onClick={props.onBack}
            aria-label={t("settings.epg")}
          >
            <Icon size={18}>grid_view</Icon>
          </button>
          <ColorSchemeToggle />
        </div>
      </header>

      <main className={styles.page}>
        <div className={styles.pageInner}>
          <div className={styles.pageHead}>
            <h2 className={styles.pageTitle}>{t("settings.title")}</h2>
            <p className={styles.pageLead}>{t("settings.lead")}</p>
          </div>

          <div className={styles.grid}>
            <button
              type="button"
              className={styles.card}
              onClick={props.onOpenKeywords}
            >
              <span className={styles.cardTop}>
                <span className={styles.cardIcon}>
                  <Icon size={20}>label</Icon>
                </span>
                <span className={styles.cardTitle}>{t("keyword.title")}</span>
                <span className={styles.cardArrow}>
                  <Icon size={18}>arrow_forward</Icon>
                </span>
              </span>
              <span className={styles.cardDesc}>
                {t("settings.cards.keyword.description")}
              </span>
            </button>

            <button
              type="button"
              className={styles.card}
              onClick={props.onOpenNotification}
            >
              <span className={styles.cardTop}>
                <span className={styles.cardIcon}>
                  <Icon size={20}>notifications</Icon>
                </span>
                <span className={styles.cardTitle}>
                  {t("notification.title")}
                </span>
                <span className={styles.cardArrow}>
                  <Icon size={18}>arrow_forward</Icon>
                </span>
              </span>
              <span className={styles.cardDesc}>
                {t("settings.cards.notification.description")}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
