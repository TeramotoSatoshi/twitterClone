const express = require("express");
const app = express();
const port = "3000";
const middleWare = require("./middleWare");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("./database");
const session = require("express-session");

const server = app.listen(port, () => console.log("Server listening on port " + port));
const io = require("socket.io")(server, { pingTimeout: 60000 });

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
const uploadRoute = require("./routes/uploadRoutes");
const searchRoute = require("./routes/searchRoutes");
const messageRoute = require("./routes/messageRoutes");
const notificationRoute = require("./routes/notificationRoutes");

// Api ルート
const postApiRoute = require("./routes/api/posts");
const userApiRoute = require("./routes/api/users");
const chatApiRoute = require("./routes/api/chats");
const messageApiRoute = require("./routes/api/messages");
const notificationApiRoute = require("./routes/api/notifications");

// ミドルウェア関数を実行する
app.use("/login", loginRoute);
app.use("/register", registerRoute);
app.use("/logout", logoutRoute);
app.use("/posts", middleWare.requireLogin, postRoute);
app.use("/profile", middleWare.requireLogin, profileRoute);
app.use("/uploads", uploadRoute);
app.use("/search", middleWare.requireLogin, searchRoute);
app.use("/messages", middleWare.requireLogin, messageRoute);
app.use("/notifications", notificationRoute);

app.use("/api/posts", postApiRoute);
app.use("/api/users", userApiRoute);
app.use("/api/chats", chatApiRoute);
app.use("/api/messages", messageApiRoute);
app.use("/api/notifications", notificationApiRoute);

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

// 接続を受け取る
io.on("connection", (socket) => {
    // クライアントからsetupを受信したら実行
    socket.on("setup", (userData) => {
        // userData._idルームに参加
        socket.join(userData._id);
        // connectedをクライアントに送信
        socket.emit("connected");
    });

    socket.on("join room", (room) => socket.join(room));
    // ルーム内のすべてのクライアントに送信
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
    socket.on("notification received", (room) => socket.in(room).emit("notification received"));

    // メッセージを通知する
    socket.on("new message", (newMessage) => {
        let chat = newMessage.chat;
        if (!chat) return console.log("Chat.users not defined");
        chat.users.forEach((user) => {
            if (user._id == newMessage.sender._id) return;
            socket.in(user._id).emit("message received", newMessage);
        });
    });
});
