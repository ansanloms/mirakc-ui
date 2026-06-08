import type { components } from "../../../lib/api/schema.d.ts";
import { BANDS } from "../../../lib/service.ts";
import { t } from "../../../locales/i18n.ts";
import ChannelRow from "../../molecules/Watch/ChannelRow.tsx";
import Empty from "../../molecules/Empty.tsx";
import styles from "./SelectTab.module.css";

type Service = components["schemas"]["MirakurunService"];
type Program = components["schemas"]["MirakurunProgram"];

/** band タブの ID (`channel.type` に対応)。 */
export type BandId = "GR" | "BS" | "CS";

/** チャンネル 1 行ぶんの表示データ。島側が API から組み立てて渡す。 */
export type ChannelEntry = {
  /** サービス (チャンネル)。 */
  service: Service;
  /** 放送中の番組。 */
  program?: Program;
  /** 次の番組。 */
  nextProgram?: Program;
  /** 放送経過割合 (0..1)。 */
  progress: number;
};

type Props = {
  /** 現在の band。 */
  band: BandId;
  /** band を切り替える。 */
  onChangeBand: (band: BandId) => void;
  /** 表示するチャンネル列。 */
  channels: ChannelEntry[];
  /** 視聴中サービスの id。 */
  activeServiceId?: number;
  /** チャンネルを選択する。 */
  onSelect: (service: Service) => void;
};

/** 番組選択タブ。上に band タブ、下にチャンネル行リスト。 */
export default function SelectTab(props: Props) {
  const bandLabel = BANDS.find((b) => b.id === props.band)?.label ?? props.band;

  return (
    <div className={styles.tab}>
      <div className={styles.bands}>
        {BANDS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`${styles.band} ${
              props.band === b.id ? styles.active : ""
            }`}
            onClick={() => props.onChangeBand(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>
      {props.channels.length === 0
        ? (
          <Empty
            compact
            title={t("watch.empty.title", { band: bandLabel })}
            description={t("watch.empty.description", { band: bandLabel })}
          />
        )
        : (
          <ul className={styles.list}>
            {props.channels.map((entry) => (
              <li key={entry.service.id}>
                <ChannelRow
                  service={entry.service}
                  program={entry.program}
                  nextProgram={entry.nextProgram}
                  progress={entry.progress}
                  active={entry.service.id === props.activeServiceId}
                  onSelect={() => props.onSelect(entry.service)}
                />
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
