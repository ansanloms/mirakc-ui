import type { ComponentProps } from "react";
import WatchPlayer from "../organisms/Watch/Player.tsx";
import WatchServiceList from "../organisms/Watch/ServiceList.tsx";
import styles from "./Watch.module.css";

type Props = {
  streamUrl: ComponentProps<typeof WatchPlayer>["streamUrl"];
  audioTrackIndex: ComponentProps<typeof WatchPlayer>["audioTrackIndex"];
  onAudioTrackChange: ComponentProps<typeof WatchPlayer>["onAudioTrackChange"];
  audios: ComponentProps<typeof WatchPlayer>["audios"];
  quality: ComponentProps<typeof WatchPlayer>["quality"];
  onQualityChange: ComponentProps<typeof WatchPlayer>["onQualityChange"];
  captionVisible: ComponentProps<typeof WatchPlayer>["captionVisible"];
  onCaptionToggle: ComponentProps<typeof WatchPlayer>["onCaptionToggle"];
  serviceSelectedAt: ComponentProps<typeof WatchPlayer>["serviceSelectedAt"];
  services: ComponentProps<typeof WatchServiceList>["services"];
  activeServiceId: ComponentProps<typeof WatchServiceList>["activeServiceId"];
  setService: ComponentProps<typeof WatchServiceList>["setService"];
};

export default function Watch(props: Props) {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <div className={styles.player}>
          <WatchPlayer
            streamUrl={props.streamUrl}
            audioTrackIndex={props.audioTrackIndex}
            onAudioTrackChange={props.onAudioTrackChange}
            audios={props.audios}
            quality={props.quality}
            onQualityChange={props.onQualityChange}
            captionVisible={props.captionVisible}
            onCaptionToggle={props.onCaptionToggle}
            serviceSelectedAt={props.serviceSelectedAt}
          />
        </div>
        <div className={styles.sidebar}>
          <WatchServiceList
            services={props.services}
            activeServiceId={props.activeServiceId}
            setService={props.setService}
          />
        </div>
      </section>
    </div>
  );
}
