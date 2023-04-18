const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const User = require("../../schemas/UserSchema");
const Post = require("../../schemas/PostSchema");

// bodyParser設定、拡張Off（キーと値のみ取得する）
app.use(bodyParser.urlencoded({ extended: false }));

// PUTメソッド
router.put("/:userId/follow", async (req, res, next) => {
    // :id部分がreq.params.idとして使用される
    let userId = req.params.userId;

    // 対象ユーザー取得
    let user = await User.findById(userId)

    // Nullチェック
    if(user == null) return res.sendStatus(404);

    // フォロワーにセッションユーザーがいるか取得
    let isFollowing = user.followers && user.followers.includes(req.session.user._id);


    let option = isFollowing ? "$pull" : "$addToSet";

    req.session.user = await User.findByIdAndUpdate(req.session.user._id, { [option]: {following: userId}}, {new: true})
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    User.findByIdAndUpdate(user._id, { [option]: {followers: req.session.user._id}})
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    res.status(200).send(req.session.user);
});

// GETメソッド
router.get("/:userId/followers", async (req, res, next) => {
    User.findById(req.params.userId)
    .populate("followers")
    .then(results => {
        res.status(200).send(results)
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});

// GETメソッド
router.get("/:userId/following", async (req, res, next) => {
    User.findById(req.params.userId)
    .populate("following")
    .then(results => {
        res.status(200).send(results)
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});

// routerをどこでも使えるようにする
module.exports = router;
