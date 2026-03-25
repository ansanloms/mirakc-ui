import type { ComponentProps } from "preact";
import WatchPlayer from "../organisms/Watch/Player.tsx";
import WatchServiceList from "../organisms/Watch/ServiceList.tsx";
import styles from "./Watch.module.css";

type Props = {
  streamUrl: ComponentProps<typeof WatchPlayer>["streamUrl"];
  audioTrackIndex: ComponentProps<typeof WatchPlayer>["audioTrackIndex"];
  onAudioTrackChange: ComponentProps<typeof WatchPlayer>["onAudioTrackChange"];
  quality: ComponentProps<typeof WatchPlayer>["quality"];
  onQualityChange: ComponentProps<typeof WatchPlayer>["onQualityChange"];
  captionVisible: ComponentProps<typeof WatchPlayer>["captionVisible"];
  onCaptionToggle: ComponentProps<typeof WatchPlayer>["onCaptionToggle"];
  services: ComponentProps<typeof WatchServiceList>["services"];
  activeServiceId: ComponentProps<typeof WatchServiceList>["activeServiceId"];
  setService: ComponentProps<typeof WatchServiceList>["setService"];
};

export default function Watch(props: Props) {
  return (
    <div class={styles.container}>
      <section class={styles.section}>
        <div class={styles.player}>
          <WatchPlayer
            streamUrl={props.streamUrl}
            audioTrackIndex={props.audioTrackIndex}
            onAudioTrackChange={props.onAudioTrackChange}
            quality={props.quality}
            onQualityChange={props.onQualityChange}
            captionVisible={props.captionVisible}
            onCaptionToggle={props.onCaptionToggle}
          />
        </div>
        <div class={styles.sidebar}>
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
