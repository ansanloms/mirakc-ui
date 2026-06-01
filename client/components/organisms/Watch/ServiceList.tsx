import type { ChangeEvent } from "react";
import { t } from "../../../locales/i18n.ts";
import type { components } from "../../../lib/api/schema.d.ts";
import styles from "./ServiceList.module.css";

type Service = components["schemas"]["MirakurunService"];

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
  // mirakc /services の生のリストを channel.type 単位で grouping する。
  const grouped = new Map<string, Service[]>();
  for (const service of props.services) {
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

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    const service = props.services.find((s) => s.id === id);
    if (service) {
      props.setService(service);
    }
  };

  return (
    <select
      className={styles.select}
      value={props.activeServiceId ?? ""}
      onChange={handleChange}
      aria-label={t("watch.selectService")}
    >
      <option value="" disabled>
        {t("watch.selectService")}
      </option>
      {sortedTypes.map((type) => (
        <optgroup key={type} label={getChannelTypeLabel(type)}>
          {(grouped.get(type) ?? []).map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
