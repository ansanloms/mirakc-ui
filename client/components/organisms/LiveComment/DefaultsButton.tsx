import { useState } from "react";
import Icon from "../../atoms/Icon.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./DefaultsButton.module.css";

/** select に出す地域の選択肢。 */
export type DefaultRegionOption = { id: string; label: string };

type Props = {
  /** 地域の選択肢 (デフォルトデータの地域一覧)。空なら何も描画しない。 */
  regions: DefaultRegionOption[];

  /** 登録処理中。操作を無効にする。 */
  busy?: boolean;

  /** 選択中の地域でデフォルトを一括登録する。 */
  onApply: (regionId: string) => void;
};

/**
 * デフォルト設定の一括登録コントロール。地域を select で選び、ボタン押下で
 * インライン確認 (現状の設定が上書きされる旨) を経て onApply を発火する。
 * 既存チャンネルは上書き、新規は追加、mirakc に無い channel は無視する
 * (振り分けは呼び出し側 = route の planDefaultApply が行う)。
 */
export default function DefaultsButton(props: Props) {
  const [regionId, setRegionId] = useState(props.regions[0]?.id ?? "");
  const [confirming, setConfirming] = useState(false);

  if (props.regions.length === 0) {
    return null;
  }

  if (confirming) {
    return (
      <div className={styles.confirm}>
        <span className={styles.confirmText}>
          {t("liveComment.defaults.confirm")}
        </span>
        <button
          type="button"
          className={styles.apply}
          disabled={props.busy}
          onClick={() => {
            props.onApply(regionId);
            setConfirming(false);
          }}
        >
          {t("liveComment.defaults.apply")}
        </button>
        <button
          type="button"
          className={styles.cancel}
          onClick={() => setConfirming(false)}
        >
          {t("liveComment.defaults.cancel")}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.bar}>
      <select
        className={styles.select}
        value={regionId}
        disabled={props.busy}
        aria-label={t("liveComment.defaults.regionLabel")}
        onChange={(e) => setRegionId(e.target.value)}
      >
        {props.regions.map((region) => (
          <option key={region.id} value={region.id}>
            {region.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={styles.button}
        disabled={props.busy}
        onClick={() => setConfirming(true)}
      >
        <Icon size={16}>download</Icon>
        {t("liveComment.defaults.button")}
      </button>
    </div>
  );
}
