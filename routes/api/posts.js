const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const User = require("../../schemas/UserSchema");
const Post = require("../../schemas/PostSchema");

// bodyParser設定、拡張Off（キーと値のみ取得する）
app.use(bodyParser.urlencoded({ extended: false }));

// GETメソッド
router.get("/", async (req, res, next) => {
    let searchObj = req.query;
    if(searchObj.isReply !== undefined) {
        let isReply = searchObj.isReply == "true";
        // 存在チェック（trueなら存在するものを探す）
        searchObj.replyTo = { $exists: isReply };
        delete searchObj.isReply;
    }

    if(searchObj.search !== undefined) {
        searchObj.content = { $regex: searchObj.search, $options: "i" };
        delete searchObj.search;
    }

    if(searchObj.followingOnly !== undefined) {
        // 引数判定
        let followingOnly = searchObj.followingOnly == "true";

        if(followingOnly) {
            // フォローしているユーザー取得
            let objectIds = [];

            if(!req.session.user.following) {
                req.session.user.following = [];
            }
            req.session.user.following.forEach(user => {
                objectIds.push(user);
            })
            // 自身も追加
            objectIds.push(req.session.user._id);
            // searchObj.postedByフィールドの値がobjectIds配列の中に含まれるか確認
            searchObj.postedBy = { $in: objectIds };
        }

        // followingOnlyプロパティ削除
        delete searchObj.followingOnly;
    }

    let results = await getPosts(searchObj);
    res.status(200).send(results);
});

// GETメソッド
router.get("/:id", async(req, res, next) => {
    // :id部分がreq.params.idとして使用される
    let postId = req.params.id;
    let postData = await getPosts({_id: postId});
    postData = postData[0];

    let results = {
        postData: postData
    }

    // リプライがあれば取得
    if(postData.replyTo !== undefined) {
        results.replyTo = postData.replyTo;
    }

    // リプライ取得
    results.replies = await getPosts({ replyTo: postId });
    res.status(200).send(results);
});

// POSTメソッド
router.post("/", async (req, res, next) => {

    // エラーハンドリング
    if (!req.body.content) {
        console.log("データが正しく送信されませんでした");
        return res.sendStatus(400);
    }

    let postData = {
        content: req.body.content,
        postedBy: req.session.user,
    };

    if(req.body.replyTo) {
        postData.replyTo = req.body.replyTo;
    }

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

// PUTメソッド
router.put("/:id", async (req, res, next) => {
    if(req.body.pinned !== undefined) {
        // ユーザーによって投稿されたすべての投稿について、pinnedプロパティをfalseに設定
        await Post.updateMany({ postedBy: req.session.user }, { pinned: false })
        .catch(error => {
            console.log(error);
            res.sendStatus(400)
        })
    }
    console.log(req.body);
    Post.findByIdAndUpdate(req.params.id, req.body)
    .then(() => res.sendStatus(204))
    .catch(error => {
        console.log(error);
        res.sendStatus(400)
    })
});

// PUTメソッド
router.put("/:id/like", async (req, res, next) => {
    // :id部分がreq.params.idとして使用される
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

// DELETEメソッド
router.delete("/:id", (req, res, next) => {
    Post.findByIdAndDelete(req.params.id)
    .then(() => res.sendStatus(202))
    .catch(error => {
        console.log(error);
        res.sendStatus(400)
    })
});

// 投稿取得
async function getPosts(filter) {
    let results = await Post.find(filter) // DB検索
    .populate("postedBy") // 外部キーに指定した"Key"を指定する
    .populate("retweetData")
    .populate("replyTo") // 参照先のデータ取得
    .sort({createdAt: -1}) // -1は降順
    .catch(error => console.log(error))

    results = await User.populate(results, {path: "replyTo.postedBy"});
    return await User.populate(results, {path: "retweetData.postedBy"});
}

// routerをどこでも使えるようにする
module.exports = router;
