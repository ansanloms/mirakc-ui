import Loading from "../molecules/Loading.tsx";
import styles from "./Loading.module.css";

export default function LoadingTemplate() {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <Loading />
      </section>
    </div>
  );
}
