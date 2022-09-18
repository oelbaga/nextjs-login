import { useState, useEffect } from "react";
export default async function checkLogin() {
  let loggedIn;
  const postData = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  };
  const apiUrl = `${process.env.NEXT_PUBLIC_URL}/api/users/authentication/account`;
  const res = await fetch(apiUrl, postData);
  const serverCookieResponse = await res.json();
  if (serverCookieResponse.error) return (loggedIn = false);
  if (!serverCookieResponse.response.data.signedin) loggedIn = false;
  if (serverCookieResponse.response.data.signedin === true) {
    loggedIn = {
      loggedin: true,
    };
  } else {
    loggedIn = false;
  }
  return loggedIn;
}
