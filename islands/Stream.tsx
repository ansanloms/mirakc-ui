import StreamTemplate from "../components/templates/Stream.tsx";

type Props = {
  serviceId: number;
};

export default function Stream({ serviceId }: Props) {
  return <StreamTemplate serviceId={serviceId} />;
}
