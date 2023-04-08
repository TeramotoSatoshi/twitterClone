const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const User = require("../../schemas/UserSchema");
const Post = require("../../schemas/PostSchema");

// bodyParser設定、拡張Off（キーと値のみ取得する）
app.use(bodyParser.urlencoded({ extended: false }));

// GETメソッド
router.get("/", (req, res, next) => {
    Post.find() // DB検索
    .populate("postedBy") // 外部キーに指定した"Key"を指定する
    .sort({createdAt: -1}) // -1は降順
    .then(results => res.status(200).send(results))
    .catch(error => {
        console.log(error);
        res.sentStatus(400);
    })
});

// POSTメソッド
router.post("/", async (req, res, next) => {
    if (!req.body.content) {
        console.log("データが正しく送信されませんでした");
        return res.sendStatus(400);
    }

    var postData = {
        content: req.body.content,
        postedBy: req.session.user,
    };

    Post.create(postData)
        .then(async newPost => {
            newPost = await User.populate(newPost, { path: "postedBy" });
            res.status(201).send(newPost);
        })
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        });
});

// routerをどこでも使えるようにする
module.exports = router;
