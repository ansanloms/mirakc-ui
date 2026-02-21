import Loading from "../molecules/Loading.tsx";
import styles from "./Loading.module.css";

export default function LoadingTemplate() {
  return (
    <div class={styles.container}>
      <section class={styles.section}>
        <Loading />
      </section>
    </div>
  );
}
