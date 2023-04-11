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
    .populate("retweetData")
    .sort({createdAt: -1}) // -1は降順
    .then(async results => {
        results = await User.populate(results, {path: "retweetData.postedBy"});
        res.status(200).send(results);
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});

// POSTメソッド
router.post("/", async (req, res, next) => {
    if (!req.body.content) {
        console.log("データが正しく送信されませんでした");
        return res.sendStatus(400);
    }

    let postData = {
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

// PUTメソッド
router.put("/:id/like", async (req, res, next) => {

    let postId = req.params.id;
    let userId = req.session.user._id;

    let isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

    let option = isLiked ? "$pull" : "$addToSet";
    // ユーザースキーマの配列フィールドに値を追加する({$addToSet: {フィールド名: 追加する値}}}) -- 値の重複を許さない
    // new: true → 更新後データを取得する
    req.session.user = await User.findByIdAndUpdate(userId, { [option]: {likes: postId}}, {new: true})
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    // 投稿スキーマの配列フィールドに値を追加する({$addToSet: {フィールド名: 追加する値}}) -- 値の重複を許さない
    var post = await Post.findByIdAndUpdate(postId, { [option]: {likes: userId}}, {new: true})
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    res.status(200).send(post);
});

// POSTメソッド
router.post("/:id/retweet", async (req, res, next) => {

    let postId = req.params.id;
    let userId = req.session.user._id;

    // Try and delete retweet
    let deletedPost = await Post.findOneAndDelete({ postedBy: userId, retweetData: postId })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    let option = deletedPost != null ? "$pull" : "$addToSet";

    let rePost = deletedPost;

    if(rePost == null) {
        rePost = await Post.create({ postedBy: userId, retweetData: postId})
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        })
    }

    req.session.user = await User.findByIdAndUpdate(userId, { [option]: {retweets: rePost._id}}, {new: true})
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    let post = await Post.findByIdAndUpdate(postId, { [option]: {retweetUsers: userId}}, {new: true})
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    // // ユーザースキーマの配列フィールドに値を追加する({$addToSet: {フィールド名: 追加する値}}}) -- 値の重複を許さない
    // // new: true → 更新後データを取得する
    // req.session.user = await User.findByIdAndUpdate(userId, { [option]: {likes: postId}}, {new: true})
    // .catch(error => {
    //     console.log(error);
    //     res.sendStatus(400);
    // })

    // // 投稿スキーマの配列フィールドに値を追加する({$addToSet: {フィールド名: 追加する値}}) -- 値の重複を許さない
    // let post = await Post.findByIdAndUpdate(postId, { [option]: {likes: userId}}, {new: true})
    // .catch(error => {
    //     console.log(error);
    //     res.sendStatus(400);
    // })

    res.status(200).send(post);
});

// routerをどこでも使えるようにする
module.exports = router;
