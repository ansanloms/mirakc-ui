import type { ReactNode } from "react";
import Icon from "../atoms/Icon.tsx";
import styles from "./PageHeader.module.css";

/** ヘッダ右側のナビゲーションリンク (アイコンのみ)。 */
export type PageHeaderLink = {
  /** Material Symbols のアイコン名。 */
  icon: string;
  /** アクセシブルなラベル (aria-label)。 */
  label: string;
  /** クリック時の遷移処理。 */
  onClick: () => void;
};

type Props = {
  /** 左端の mark に表示する Material Symbols アイコン名。 */
  icon: string;

  /** ページタイトル。 */
  title: string;

  /** サブタイトル (モバイルでは非表示)。 */
  subtitle: string;

  /** 右側のナビゲーションリンク群。各ページは自身に当たるリンクを省いて渡す。 */
  links: PageHeaderLink[];

  /** right 末尾に差し込むスロット (ColorSchemeToggle 等)。 */
  children?: ReactNode;
};

/**
 * 設定系ページ・視聴ページで共通のページヘッダ。
 * mark (アイコン) + タイトル / サブタイトル + 右ナビゲーションリンク群 + スロット
 * で構成する。リンクはデータ駆動 (links) で受け取り、各ページは自身に当たる
 * リンクを省いて渡す。
 */
export default function PageHeader(props: Props) {
  return (
    <header className={styles.toolbar}>
      <span className={styles.mark}>
        <Icon size={20}>{props.icon}</Icon>
      </span>
      <div className={styles.titles}>
        <h1 className={styles.title}>{props.title}</h1>
        <p className={styles.subtitle}>{props.subtitle}</p>
      </div>
      <div className={styles.right}>
        {props.links.map((link) => (
          <button
            key={link.label}
            type="button"
            className={styles.link}
            onClick={link.onClick}
            aria-label={link.label}
          >
            <Icon size={18}>{link.icon}</Icon>
          </button>
        ))}
        {props.children}
      </div>
    </header>
  );
}
