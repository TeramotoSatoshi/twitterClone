const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("../schemas/UserSchema");

// pugをview engineに設定
app.set("view engine", "pug");
app.set("views", "views");

// bodyParser使用、拡張Off（キーと値のみ取得する）
app.use(bodyParser.urlencoded({ extended: false }));

// Get
router.get("/", (req, res, next) => {
    res.status(200).render("register");
});

// Post
router.post("/", async (req, res, next) => {
    // 変数に代入
    var firstName = req.body.firstName.trim();
    var lastName = req.body.lastName.trim();
    var username = req.body.username.trim();
    var email = req.body.email.trim();
    var password = req.body.password;

    var payload = req.body;

    if (firstName && lastName && username && email && password) {
        // すべて入力されている場合
        var user = await User.findOne({
            // ユーザー名またはメールアドレスが登録されているか確認
            $or: [{ username: username }, { email: email }],
        }).catch(error => {
            // 既に登録されている場合
            payload.errorMessage = "入力内容を確認してください";
            res.status(200).render("register", payload);
        });

        if (user == null) {
            // No user found
            var data = req.body;
            data.password = await bcrypt.hash(password, 10);
            User.create(data).then(user => {
                req.session.user = user;
                return res.redirect("/");
            });
        } else {
            // User found
            if (email == user.email) {
                payload.errorMessage = "メールアドレスはすでに使用されています";
            } else {
                payload.errorMessage = "ユーザー名はすでに使用されています";
            }
            res.status(200).render("login", payload);
        }
    } else {
        payload.errorMessage = "有効な値を入力してください";
        res.status(200).render("login");
    }
});

// routerをどこでも使えるようにする
module.exports = router;
