import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import AppContext from "../components/AppContext";
import checkLogin from "../customhooks/checkLogin";
import Header from "../components/Header";
import "../styles/globals.scss";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [userContext, setUserContext] = useState({});
  useEffect(() => {
    if (!router.isReady) return;
    let mounted = true;
    if (mounted === true) {
      checkLogin().then((loggedInData) => {
        setUserContext((prevState) => ({
          ...prevState,
          loggedin: loggedInData,
        }));
      });
      mounted = false;
    }
    return () => {
      mounted = false;
    };
  }, [router.isReady]);

  useEffect(() => {
    console.log(userContext);
  }, [userContext]);

  return (
    <AppContext.Provider
      value={{
        userContext,
        setUserContext,
      }}
    >
      <Header />
      <Component {...pageProps} />
    </AppContext.Provider>
  );
}

export default MyApp;
