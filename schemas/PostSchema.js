const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ユーザースキーマ定義
const PostSchema = new Schema(
    {
        content: { type: String, trim: true },
        postedBy: { type: Schema.Types.ObjectId, ref: "User" }, // 外部キー, 参照モデル
        pinned: Boolean,
        likes: [ { type: Schema.Types.ObjectId, ref: "User" }],
        retweetUsers: [ { type: Schema.Types.ObjectId, ref: "User" }],
        retweetData: { type: Schema.Types.ObjectId, ref: "Post" },
        replyTo: { type: Schema.Types.ObjectId, ref: "Post" },
    },
    { timestamps: true }
);

// エクスポート
// Mongoose がモデルをコンパイル
// 第１引数：DBコレクション名（スキーマ）
let Post = mongoose.model("Post", PostSchema);
module.exports = Post;
