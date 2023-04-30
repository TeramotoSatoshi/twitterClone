const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("../schemas/UserSchema");

// GETメソッド
router.get("/:id", (req, res, next) => {
    let payLoad = {
        pageTitle: "Thread",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user), // JSON 文字列に変換
        postId: req.params.id,
    };
    res.status(200).render("postPage", payLoad);
});

// routerをどこでも使えるようにする
module.exports = router;
