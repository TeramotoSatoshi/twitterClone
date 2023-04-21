const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("../schemas/UserSchema");

// GETメソッド
router.get("/", (req, res, next) => {
    let payLoad = createPayload(req.session.user);
    res.status(200).render("searchPage", payLoad);
});

// GETメソッド
router.get("/:selectedTab", (req, res, next) => {
    let payLoad = createPayload(req.session.user);
    payLoad.selectedTab = req.params.selectedTab;
    res.status(200).render("searchPage", payLoad);
});

function createPayload(userLoggedIn) {
   return {
        pageTitle: "Search",
        userLoggedIn: userLoggedIn,
        userLoggedInJs: JSON.stringify(userLoggedIn), // JSON 文字列に変換
    }
}
// routerをどこでも使えるようにする
module.exports = router;
