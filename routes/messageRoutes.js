const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("../schemas/UserSchema");

// GETメソッド
router.get("/", (req, res, next) => {
    res.status(200).render("inboxPage", {
        pageTitle: "inbox",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user), // JSON 文字列に変換
    });
});

// GETメソッド
router.get("/new", (req, res, next) => {
    res.status(200).render("newMessage", {
        pageTitle: "New Message",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user), // JSON 文字列に変換
    });
});

// routerをどこでも使えるようにする
module.exports = router;
