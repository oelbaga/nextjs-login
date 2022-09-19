import { useState, useContext } from "react";
import AppContext from "../components/AppContext";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import {
  EMAIL_REGEX_VALIDATION,
  PASSWORD_REGEX_VALIDATION,
  PHONE_REGEX_VALIDATION,
} from "../lib/lib";
import styles from "../styles/Home.module.scss";

export default function Home() {
  const router = useRouter();
  const context = useContext(AppContext);
  const setUserContext = context.setUserContext;
  const [credentialsValid, setCredentialsValid] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => {
    // console.log(data);
    loginUser(data);
  };
  async function loginUser(data) {
    const postData = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    };
    const apiUrl = `${process.env.NEXT_PUBLIC_URL}/api/users/authentication/account`;
    const res = await fetch(apiUrl, postData);
    const response = await res.json();
    console.log(response);
    if (response.response === true) {
      router.push(`/dashboard`);
      setUserContext((prevState) => ({
        ...prevState,
        loggedin: {
          loggedin: true,
        },
      }));
    } else {
      setCredentialsValid("Credentials entered are incorrect.");
    }
  }
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={`${styles.flex1}`}>
            <span className={`errormsg`}>{credentialsValid}</span>
            <div className={styles.input}>
              <label htmlFor="" className={styles.label}>
                Email*
              </label>
              <input
                type="email"
                className={styles.field}
                defaultValue={`testing@gmail.com`}
                {...register("email", {
                  required: true,
                  pattern: EMAIL_REGEX_VALIDATION,
                })}
              />
              {errors.email && (
                <span className="errormsg">Should be an email address</span>
              )}
            </div>
            <div className={styles.input}>
              <label htmlFor="" className={styles.label}>
                Password*
              </label>
              <input
                type="text"
                className={styles.field}
                defaultValue={`Testing123!`}
                {...register("password", {
                  required: true,
                  pattern: PASSWORD_REGEX_VALIDATION,
                })}
              />
              {errors.password && (
                <span className="errormsg">
                  Should be 8 characters, at least one letter, one number, one
                  special symbol
                </span>
              )}
            </div>
          </div>
          <input type="submit" className={styles.btn} value="Sign In" />
        </form>
      </main>
    </div>
  );
}
