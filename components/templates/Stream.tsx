import { useEffect, useRef } from "preact/hooks";

type Props = {
  serviceId: number;
};

export default function Stream(
  { serviceId }: Props,
) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.play();
  }, []);

  return (
    <video
      ref={videoRef}
      src={`/api/stream/${serviceId}?audio=1`}
      controls
      autoPlay={true}
      class={["w-full", "max-h-fit", "aspect-video"]}
    />
  );
}
