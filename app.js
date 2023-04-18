const express = require("express");
const app = express();
const port = "3000";
const middleWare = require("./middleWare");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("./database");
const session = require("express-session");

const server = app.listen(port, () => console.log("Server listening on port " + port));

// pugをview engineに設定
app.set("view engine", "pug");
app.set("views", "views");

// bodyParser設定、拡張Off（キーと値のみ取得する）
app.use(bodyParser.urlencoded({ extended: false }));

// public というディレクトリー内のイメージ、CSS ファイル、JavaScript ファイルを提供する
// express.static()に指定するパスは絶対パス
app.use(express.static(path.join(__dirname, "public")));

app.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: false,
    })
);

// Routesを読み込む
const loginRoute = require("./routes/loginRoutes");
const registerRoute = require("./routes/registerRoutes");
const logoutRoute = require("./routes/logout");
const postRoute = require("./routes/postRoutes");
const profileRoute = require("./routes/profileRoutes");

// Api roots
const postApiRoute = require("./routes/api/posts");
const userApiRoute = require("./routes/api/users");

// ミドルウェア関数を実行する
app.use("/login", loginRoute);
app.use("/register", registerRoute);
app.use("/logout", logoutRoute);
app.use("/posts",middleWare.requireLogin, postRoute);
app.use("/profile",middleWare.requireLogin, profileRoute);

app.use("/api/posts", postApiRoute);
app.use("/api/users", userApiRoute);

// ルートパスのGETリクエストに対するレスポンスの設定
app.get("/", middleWare.requireLogin, (req, res, next) => {
    let payLoad = {
        pageTitle: "Home",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user), // JSON 文字列に変換
    };

    // render()の第一引数は.ファイル名記述、渡したいデータ（DBから取得も可）→これをpugで読み込ませて表示
    res.status(200).render("home", payLoad);
});
