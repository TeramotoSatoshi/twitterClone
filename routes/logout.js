const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("../schemas/UserSchema");

// bodyParser設定、拡張Off（キーと値のみ取得する）
app.use(bodyParser.urlencoded({ extended: false }));

// GETメソッド
router.get("/", (req, res, next) => {
    if (req.session) {
        req.session.destroy(() => {
            res.redirect("/login");
        });
    }
});

// routerをどこでも使えるようにする
module.exports = router;
