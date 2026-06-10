import Loading from "../molecules/Loading.tsx";
import styles from "./Loading.module.css";

type Props = {
  /** ローディングの説明文。下位の Loading にそのまま渡す。 */
  label?: string;
};

export default function LoadingTemplate({ label }: Props) {
  return (
    <div className={styles.container}>
      <Loading label={label} />
    </div>
  );
}
