import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import AppContext from "../components/AppContext";
import styles from "../styles/Home.module.scss";

export default function Home() {
  const router = useRouter();
  const context = useContext(AppContext);
  const userContext = context.userContext;
  const [pageChecksReady, setPageChecksReady] = useState(false);
  useEffect(() => {
    if (!router.isReady) return;
    if (typeof userContext.loggedin === "undefined") return;
    if (!userContext.loggedin) {
      router.push(`/login`);
    } else {
      setPageChecksReady(true);
    }
  }, [router.isReady, userContext]);
  return (
    <div className={styles.container}>
      {pageChecksReady && (
        <main className={styles.main}>
          <h1>User Dashboard</h1>
        </main>
      )}
    </div>
  );
}
