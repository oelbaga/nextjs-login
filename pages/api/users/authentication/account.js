import cookie from "cookie";
import { jsonwebtoken } from "jsonwebtoken";
import { query } from "../../../../lib/db";
import { hashPassword, verifyPassword } from "../../../../lib/pwd.js";
const cookiesecret = process.env.SIGN_COOKIES_SECRET;

export default async function handler(req, res) {
  let errorObject = {
    error: {
      code: 1,
      message: "Login data doesn't appear to be set.",
    },
  };
  let cookieContentSpl;
  let dataResponse = {
    data: "",
  };
  let ip;
  if (req.headers["x-forwarded-for"]) {
    ip = req.headers["x-forwarded-for"].split(",")[0];
  } else if (req.headers["x-real-ip"]) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.connection.remoteAddress;
  }
  let accessTokenExpirationTime = 10; //seconds
  let refreshTokenExpirationTime = 30; //seconds
  let accessCookieContent;
  let refreshCookieContent;
  let sessionid;

  const jwt = require("jsonwebtoken");
  //check if logged in. If Access token is valid good. If not, check if refresh token is valid and not blacklisted. If so good. Otherwise log out.
  if (req.method === "GET") {
    if (!req.headers.cookie) {
      res.status(200).json(errorObject);
      return;
    }
    var cookies = cookie.parse(req.headers.cookie);
    if (!cookies.spl) {
      res.status(200).json(errorObject);
      return;
    }

    if (cookies.spl) {
      let cookieExpired = false;
      jwt.verify(cookies.spl, cookiesecret, function (err, decoded) {
        if (err) {
          cookieExpired = true;
          cookieContentSpl = err;
        } else {
          cookieContentSpl = decoded;
        }
        dataResponse.data = cookieContentSpl;
      });

      if (cookieExpired) {
        //check refresh token
        if (cookies.splRefresh) {
          let refreshCookieExpired = false;
          jwt.verify(cookies.splRefresh, cookiesecret, function (err, decoded) {
            if (err) {
              refreshCookieExpired = true;
              cookieContentSpl = "";
            } else {
              cookieContentSpl = decoded;
            }
            dataResponse.data = cookieContentSpl;
          });
          if (!refreshCookieExpired) {
            const cookieContentObj = {
              uid: cookieContentSpl.validatekey,
              email: cookieContentSpl.email,
              signedin: cookieContentSpl.signedin,
              sessionid: cookieContentSpl.sessionid,
            };
            sessionid = cookieContentSpl.sessionid;
            //check if Refresh Token is not black listed.
            const isRefreshTokenNotBlackListed = await query({
              query:
                "SELECT sessionid from signin_sessions_blacklist WHERE sessionid = ?",
              values: [sessionid],
            });
            if (isRefreshTokenNotBlackListed.length > 0) {
              console.log("refresh token blacklisted");
              dataResponse.data.signedin = false;
              res.status(200).json({ response: dataResponse });
              return;
            }
            accessCookieContent = jwt.sign(cookieContentObj, cookiesecret, {
              expiresIn: accessTokenExpirationTime,
            });
            res.setHeader("Set-Cookie", [
              cookie.serialize("spl", accessCookieContent, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development",
                maxAge: 60 * 60 * 24,
                sameSite: "strict",
                path: "/",
              }),
            ]);
            console.log("access token refreshed");
          }
        }
      }
    }
    try {
      res.status(200).json({ response: dataResponse });
      return;
    } catch (error) {
      res.status(200).json({ error: error.message });
      return;
    }
  }

  //log user in. Set Access and Refresh Tokens. Add session ID to db to associate with tokens for future refresh token blacklist check
  if (req.method === "POST") {
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    // const hashedPassword = await hashPassword(req.body.password.trim());
    try {
      const checkUser = await query({
        query:
          "SELECT userid, email,userpwd,validatekey from users WHERE email = ?",
        values: [email],
      });
      if (checkUser.length) {
        const storedPasswordHash = checkUser[0].userpwd;
        const userid = checkUser[0].userid;
        const validatekey = checkUser[0].validatekey;
        const passwordIsValid = await verifyPassword(
          password,
          storedPasswordHash
        );
        if (passwordIsValid) {
          var currentDate = new Date();
          const currentEpochTime = Math.floor(new Date().getTime() / 1000);
          const expTime = currentEpochTime + accessTokenExpirationTime;
          const addSignInSessionToDB = await query({
            query:
              "INSERT INTO signin_sessions (ip_address,userid,expires) VALUES (?,?,?)",
            values: [ip, userid, expTime],
          });
          sessionid = addSignInSessionToDB.insertId;
          const cookieContentObj = {
            uid: validatekey,
            email: email,
            signedin: true,
            sessionid: sessionid,
          };
          accessCookieContent = jwt.sign(cookieContentObj, cookiesecret, {
            expiresIn: accessTokenExpirationTime,
          });
          refreshCookieContent = jwt.sign(cookieContentObj, cookiesecret, {
            expiresIn: refreshTokenExpirationTime,
          });
          res.setHeader("Set-Cookie", [
            cookie.serialize("spl", accessCookieContent, {
              httpOnly: true,
              secure: process.env.NODE_ENV !== "development",
              maxAge: 60 * 60 * 24,
              sameSite: "strict",
              path: "/",
            }),
            cookie.serialize("splRefresh", refreshCookieContent, {
              httpOnly: true,
              secure: process.env.NODE_ENV !== "development",
              maxAge: 60 * 60 * 24,
              sameSite: "strict",
              path: "/",
            }),
          ]);
        }

        res.status(200).json({ response: passwordIsValid });
        return;
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
      return;
    }
  }
  //log user out. Remove cookie if not expired. If not expired. delete sessionid from db also.
  if (req.method === "PUT") {
    if (!req.headers.cookie) {
      res.status(200).json(errorObject);
      return;
    }
    var cookies = cookie.parse(req.headers.cookie);
    if (!cookies.spl) {
      res.status(200).json(errorObject);
      return;
    }
    //get sessionid
    if (cookies.spl) {
      let cookieLogOutExpired = false;
      jwt.verify(cookies.spl, cookiesecret, function (err, decoded) {
        if (err) {
          cookieContentSpl = "";
          cookieLogOutExpired = true;
        } else {
          cookieContentSpl = decoded;
          sessionid = cookieContentSpl.sessionid;
        }
      });
      if (!cookieLogOutExpired) {
        const removeSignInSessionFromDB = await query({
          query: "DELETE FROM signin_sessions WHERE sessionid = ?",
          values: [sessionid],
        });
      }
    }
    res.setHeader("Set-Cookie", [
      cookie.serialize("spl", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        maxAge: -1,
        sameSite: "strict",
        path: "/",
      }),
      cookie.serialize("splRefresh", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        maxAge: -1,
        sameSite: "strict",
        path: "/",
      }),
    ]);
    res.status(200).json({ response: true });
  }
}
