const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("../schemas/UserSchema");

// pugをview engineに設定
app.set("view engine", "pug");
app.set("views", "views");

// bodyParser設定、拡張Off（キーと値のみ取得する）
app.use(bodyParser.urlencoded({ extended: false }));

// GETメソッド
router.get("/", (req, res, next) => {
  // ページのステータスとレンダリングを行う
  res.status(200).render("login");
});

// POSTメソッド
router.post("/", async (req, res, next) => {
  let payload = req.body;
  if (req.body.logUsername && req.body.logPassword) {
    // すべて入力されている場合
    let user = await User.findOne({
      // ユーザー名またはメールアドレスが登録されているか確認
      $or: [{ username: req.body.logUsername }, { email: req.body.logUsername }],
    }).catch((error) => {
      // 既に登録されている場合はエラー
      console.log(error);
      payload.errorMessage = "入力内容を確認してください";
      res.status(200).render("login", payload);
    });

    if (user != null) {
      // ユーザー情報が取得できた場合
      // 入力されたパスワードが一致するか判別
      let result = await bcrypt.compare(req.body.logPassword, user.password);

      if (result === true) {
        // ユーザー情報取得
        req.session.user = user;
        return res.redirect("/");
      }
    }
    // それ以外はエラー
    payload.errorMessage = "ログイン情報が一致しません";
    return res.status(200).render("login", payload);
  }
  // それ以外はエラー
  payload.errorMessage = "有効な値を入力してください";
  res.status(200).render("login", payload);
});

// routerをどこでも使えるようにする
module.exports = router;
