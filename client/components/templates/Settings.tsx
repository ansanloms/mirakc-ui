import Icon from "../atoms/Icon.tsx";
import PageHeader from "../organisms/PageHeader.tsx";
import ColorSchemeToggle from "../../islands/ColorSchemeToggle.tsx";
import { t } from "../../locales/i18n.ts";
import styles from "./Settings.module.css";

type Props = {
  /** キーワード自動録画の管理ページ (/settings/keywords) へ遷移する。 */
  onOpenKeywords: () => void;

  /** 通知設定 (/settings/notification) へ遷移する。 */
  onOpenNotification: () => void;

  /** 実況連携の設定 (/settings/live-comments) へ遷移する。 */
  onOpenLiveComments: () => void;

  /** 番組表へ戻る。 */
  onBack: () => void;

  /** 視聴画面 (/watch) へ遷移する。 */
  onOpenWatch: () => void;
};

/**
 * 設定ポータル。各設定画面へのナビゲーションカードを並べる。
 * 今後 /settings/notification (通知設定) のカードを追加していく想定。
 */
export default function Settings(props: Props) {
  return (
    <div className="app-root">
      <PageHeader
        icon="settings"
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        links={[
          {
            icon: "grid_view",
            label: t("settings.epg"),
            onClick: props.onBack,
          },
          {
            icon: "live_tv",
            label: t("watch.open"),
            onClick: props.onOpenWatch,
          },
        ]}
      >
        <ColorSchemeToggle />
      </PageHeader>

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

            <button
              type="button"
              className={styles.card}
              onClick={props.onOpenLiveComments}
            >
              <span className={styles.cardTop}>
                <span className={styles.cardIcon}>
                  <Icon size={20}>forum</Icon>
                </span>
                <span className={styles.cardTitle}>
                  {t("liveComment.title")}
                </span>
                <span className={styles.cardArrow}>
                  <Icon size={18}>arrow_forward</Icon>
                </span>
              </span>
              <span className={styles.cardDesc}>
                {t("settings.cards.liveComment.description")}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
