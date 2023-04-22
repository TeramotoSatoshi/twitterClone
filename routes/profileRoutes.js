const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("../schemas/UserSchema");

// GETメソッド
router.get("/", (req, res, next) => {
    let payLoad = {
        pageTitle: req.session.user.username,
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user), // JSON 文字列に変換
        profileUser: req.session.user
    };
    res.status(200).render("profilePage", payLoad);
});

// GETメソッド
router.get("/:username",async (req, res, next) => {

    let payLoad = await getPayload(req.params.username, req.session.user);
    res.status(200).render("profilePage", payLoad);
});

// GETメソッド
router.get("/:username/replies",async (req, res, next) => {

    let payLoad = await getPayload(req.params.username, req.session.user);
    payLoad.selectedTab = "replies"
    res.status(200).render("profilePage", payLoad);
});

// GETメソッド
router.get("/:username/following",async (req, res, next) => {

    let payLoad = await getPayload(req.params.username, req.session.user);
    payLoad.selectedTab = "following"
    res.status(200).render("followersAndFollowing", payLoad);
});

// GETメソッド
router.get("/:username/followers",async (req, res, next) => {

    let payLoad = await getPayload(req.params.username, req.session.user);
    payLoad.selectedTab = "followers"
    res.status(200).render("followersAndFollowing", payLoad);
});

// 投稿取得
async function getPayload(username,userLoggedIn) {

    let user = await User.findOne({ username: username })

    if(user == null) {
        user = await User.findById(username);
        if(user == null) {
            return {
                pageTitle: "User Not Found",
                userLoggedIn: userLoggedIn,
                userLoggedInJs: JSON.stringify(userLoggedIn)
            }
        }
    }

    return {
        pageTitle: username,
        userLoggedIn: userLoggedIn,
        userLoggedInJs: JSON.stringify(userLoggedIn),
        profileUser: user
    }
}

// routerをどこでも使えるようにする
module.exports = router;
