import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import AppContext from "../components/AppContext";
import Link from "next/link";
import styles from "./Header.module.scss";
export default function Header() {
  const router = useRouter();
  const context = useContext(AppContext);
  const userContext = context.userContext;
  const [navToShow, setNavToShow] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof userContext.loggedin === "undefined") return;
    if (!userContext.loggedin) {
      setNavToShow(
        <li>
          <Link href={`/login`}>
            <a>Login</a>
          </Link>
        </li>
      );
    } else {
      setNavToShow(
        <li>
          <Link href={`/dashboard`}>
            <a>Dashboard</a>
          </Link>
        </li>
      );
    }
  }, [router.isReady, userContext]);
  return (
    <div className={styles.container}>
      <div className={styles.holdcontent}>
        <div className={styles.logo}>
          <Link href={`/`}>
            <a>LOGO</a>
          </Link>
        </div>
        <div className={styles.navlinks}>
          <ul>{navToShow}</ul>
        </div>
      </div>
    </div>
  );
}
