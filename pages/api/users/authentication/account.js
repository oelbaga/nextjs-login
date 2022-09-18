import cookie from "cookie";
import { jsonwebtoken } from "jsonwebtoken";
import { query } from "../../../../lib/db";
import { hashPassword, verifyPassword } from "../../../../lib/pwd.js";
const cookiesecret = process.env.SIGN_COOKIES_SECRET;

export default async function handler(req, res) {
  if (req.method === "GET") {
    let dataResponse = {
      data: "",
    };
    let errorObject = {
      error: {
        code: 1,
        message: "Login data doesn't appear to be set.",
      },
    };
    const jwt = require("jsonwebtoken");
    if (!req.headers.cookie) {
      res.status(200).json(errorObject);
      return;
    }
    var cookies = cookie.parse(req.headers.cookie);
    if (!cookies.spl) {
      res.status(200).json(errorObject);
      return;
    }
    let cookieContentSpl;
    if (cookies.spl) {
      jwt.verify(cookies.spl, cookiesecret, function (err, decoded) {
        if (err) {
          cookieContentSpl = "";
        } else {
          cookieContentSpl = decoded;
        }
        dataResponse.data = cookieContentSpl;
      });
    }

    try {
      res.status(200).json({ response: dataResponse });
      return;
    } catch (error) {
      res.status(200).json({ error: error.message });
      return;
    }
  }
  if (req.method === "POST") {
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    const hashedPassword = await hashPassword(req.body.password.trim());
    try {
      const checkUser = await query({
        query: "SELECT email,userpwd from users WHERE email = ?",
        values: [email],
      });
      if (checkUser.length) {
        const storedPasswordHash = checkUser[0].userpwd;
        const passwordIsValid = await verifyPassword(
          password,
          storedPasswordHash
        );
        if (passwordIsValid) {
          const jwt = require("jsonwebtoken");
          const cookieContentObj = {
            email: email,
            signedin: true,
          };
          const cookieContent = jwt.sign(cookieContentObj, cookiesecret, {
            expiresIn: 60 * 60,
          });
          res.setHeader("Set-Cookie", [
            cookie.serialize("spl", cookieContent, {
              httpOnly: true,
              secure: process.env.NODE_ENV !== "development",
              maxAge: 60 * 60 * 24,
              sameSite: "strict",
              path: "/",
            }),
            cookie.serialize("splRefresh", cookieContent, {
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
}
