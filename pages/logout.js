import { useState, useContext, useEffect } from "react";
import AppContext from "../components/AppContext";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.scss";

export default function Home() {
  const router = useRouter();
  const context = useContext(AppContext);
  const setUserContext = context.setUserContext;

  async function logOut() {
    const postData = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: [],
    };
    const apiUrl = `${process.env.NEXT_PUBLIC_URL}/api/users/authentication/account`;
    const res = await fetch(apiUrl, postData);
    const response = await res.json();
    if (response.response === true) {
      router.push(`/login`);
      setUserContext({ loggedin: false });
    }
  }
  useEffect(() => {
    logOut();
  }, []);
  return (
    <div className={styles.container}>
      <main className={styles.main}></main>
    </div>
  );
}
