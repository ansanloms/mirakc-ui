import type { ComponentProps } from "preact";
import { t } from "../../../locales/i18n.ts";
import WatchServiceItem from "../../molecules/Watch/ServiceItem.tsx";
import styles from "./ServiceList.module.css";

type Service = ComponentProps<typeof WatchServiceItem>["service"];

type Props = {
  /**
   * サービス一覧。
   */
  services: Service[];

  /**
   * 選択中のサービス ID。
   */
  activeServiceId: number | undefined;

  /**
   * サービスを選択する。
   */
  setService: (service: Service) => void;
};

const CHANNEL_TYPE_ORDER = ["GR", "BS", "CS", "SKY"];

function getChannelTypeLabel(type: string): string {
  const key = `watch.channelType.${type}` as Parameters<typeof t>[0];
  const label = t(key);
  // i18next が key をそのまま返した場合はそのまま使う
  return label === key ? type : label;
}

export default function WatchServiceList(props: Props) {
  // mirakc の /services は 1 物理チャンネルに対して主サービス・副サービス・
  // 1 セグ・臨時サービス等を別 serviceId で返すため、放送局によっては
  // 同名のサービスが複数並ぶ (例: "フジテレビ" が 3 件、"テレビ朝日" が 3 件)。
  // ユーザから見れば同じチャンネルなので、channel の type + channel +
  // サービス名の組で重複排除し、最初に現れた 1 件だけを残す。
  const uniqMap = new Map<string, Service>();
  for (const service of props.services) {
    const key = `${service.channel?.type ?? ""}:${
      service.channel?.channel ?? ""
    }:${service.name ?? ""}`;
    if (!uniqMap.has(key)) {
      uniqMap.set(key, service);
    }
  }
  const uniqServices = [...uniqMap.values()];

  // channel.type でグループ化
  const grouped = new Map<string, Service[]>();
  for (const service of uniqServices) {
    const type = service.channel?.type ?? "OTHER";
    if (!grouped.has(type)) {
      grouped.set(type, []);
    }
    grouped.get(type)!.push(service);
  }

  // 表示順: 既知の種別を先に、残りはアルファベット順
  const sortedTypes = [...grouped.keys()].sort((a, b) => {
    const ai = CHANNEL_TYPE_ORDER.indexOf(a);
    const bi = CHANNEL_TYPE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) {
      return ai - bi;
    }
    if (ai !== -1) {
      return -1;
    }
    if (bi !== -1) {
      return 1;
    }
    return a.localeCompare(b);
  });

  return (
    <div class={styles.root}>
      {sortedTypes.map((type) => (
        <section key={type} class={styles.group}>
          <p class={styles.groupHeader}>{getChannelTypeLabel(type)}</p>
          <ul class={styles.list}>
            {(grouped.get(type) ?? []).map((service) => (
              <li
                key={service.id}
                class={styles.item}
                data-active={service.id === props.activeServiceId}
              >
                <WatchServiceItem
                  service={service}
                  active={service.id === props.activeServiceId}
                  onClick={() => props.setService(service)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
