import {
  CHANNEL_TYPES,
  type ChannelType,
  channelTypeLabel,
} from "../../../lib/service.ts";
import styles from "./ChannelTypeTabList.module.css";

type Props = {
  /** 選択中の channel type。 */
  channelType: ChannelType;

  /** channel type を切り替える。 */
  onChangeChannelType: (channelType: ChannelType) => void;
};

/** 地上波 / BS / CS の channel type 切替タブ。 */
export default function ChannelTypeTabList(props: Props) {
  return (
    <div className={styles.channelTypeTabs}>
      {CHANNEL_TYPES.map((id) => (
        <button
          key={id}
          type="button"
          className={`${styles.channelTypeTab} ${
            props.channelType === id ? styles.channelTypeTabActive : ""
          }`}
          onClick={() => props.onChangeChannelType(id)}
        >
          {channelTypeLabel(id)}
        </button>
      ))}
    </div>
  );
}
