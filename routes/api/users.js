const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const upload = multer( { dest: "uploads/"})
const User = require("../../schemas/UserSchema");
const Post = require("../../schemas/PostSchema");

// bodyParser設定、拡張Off（キーと値のみ取得する）
app.use(bodyParser.urlencoded({ extended: false }));

// GETメソッド
router.get("/", async (req, res, next) => {
    let searchObj = req.query;

    if(req.query.search !== undefined) {
        searchObj =  {
            $or: [
                { firstName: { $regex: req.query.search, $options: "i" }},
                { lastName: { $regex: req.query.search, $options: "i" }},
                { username: { $regex: req.query.search, $options: "i" }},
            ]
        }
    }
    User.find(searchObj)
    .then(results => res.status(200).send(results))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});

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
        res.status(200).send(results);
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});

// プロフィール画像アップロード
// upload.single("croppedImage")は、アップロードされたファイルを解析するためにmulterに使用されるミドルウェア関数
// "croppedImage"は、アップロードされたファイルのフィールド名
router.post("/profilePicture", upload.single("croppedImage"), async (req, res, next) => {
    // ファイルが空の場合
    if(!req.file) {
        console.log("ファイルをアップロードできませんでした")
        return res.sendStatus(400);
    }

    // {アップロードされたファイルの元の名前}
    let filePath = `/uploads/images/${req.file.filename}.png`;
    // ファイルが一時的に保存されている場所
    let tempPath = req.file.path;
    // ファイルが保存される場所
    let targetPath = path.join(__dirname, `../../${filePath}`);

    // 一時ファイルを保存先に移動
    fs.rename(tempPath, targetPath, async error => {
        if(error != null) {
            console.log(error);
            return res.sendStatus(400);
        }

        req.session.user = await User.findByIdAndUpdate(req.session.user._id, {profilePic: filePath},{ new: true});
        res.sendStatus(200);
    })
});

// プロフィール画像アップロード
// upload.single("croppedImage")は、アップロードされたファイルを解析するためにmulterに使用されるミドルウェア関数
// "croppedImage"は、アップロードされたファイルのフィールド名
router.post("/coverPhoto", upload.single("croppedImage"), async (req, res, next) => {
    // ファイルが空の場合
    if(!req.file) {
        console.log("ファイルをアップロードできませんでした")
        return res.sendStatus(400);
    }

    // {アップロードされたファイルの元の名前}
    let filePath = `/uploads/images/${req.file.filename}.png`;
    // ファイルが一時的に保存されている場所
    let tempPath = req.file.path;
    // ファイルが保存される場所
    let targetPath = path.join(__dirname, `../../${filePath}`);

    // 一時ファイルを保存先に移動
    fs.rename(tempPath, targetPath, async error => {
        if(error != null) {
            console.log(error);
            return res.sendStatus(400);
        }

        req.session.user = await User.findByIdAndUpdate(req.session.user._id, {coverPhoto: filePath},{ new: true});
        res.sendStatus(200);
    })
});

// routerをどこでも使えるようにする
module.exports = router;
