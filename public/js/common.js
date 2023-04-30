// グローバル
let cropper;
let timer;
let selectedUsers = [];

// postTextareaにキーが押された時のアクションを割り当て
$("#postTextarea, #replyTextarea").keyup((event) => {
    let textBox = $(event.target);
    let value = textBox.val().trim();

    // モーダルであるか判別
    let isModal = textBox.parents(".modal").length == 1;
    let submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton");

    if (submitButton.length == 0) return alert("No submit button found");

    if (value == "") {
        // 取得値が空ならボタン非活性
        submitButton.prop("disabled", true);
        return;
    }
    submitButton.prop("disabled", false);
});

// userSearchTextBoxのキーが押された時のアクション
$("#userSearchTextBox").keydown((event) => {
    // タイマーリセット
    clearTimeout(timer);

    let textBox = $(event.target);
    let value = textBox.val();

    timer = setTimeout(() => {
        value = textBox.val().trim();

        // 空またはバックスペースの場合
        if (value == "" && (event.which == 8 || event.keyCode == 8)) {
            // 配列の最後の要素を削除
            selectedUsers.pop();
            // 検索結果再取得
            updateSelectedUsersHtml();
            // 検索結果削除
            $(".resultsContainer").html("");

            // 選択済みユーザがいない場合
            if (selectedUsers.length == 0) {
                $("#createChatButton").prop("disabled", true);
            }
            return;
        }

        if (value == "") {
            $(".resultsContainer").html("");
        } else {
            searchUsers(value);
        }
    }, 1000);
});

// submitPostButtonクリックイベント
$("#submitPostButton, #submitReplyButton").click((event) => {
    let button = $(event.target);

    // 親にモーダルがあるか判定
    let isModal = button.parents(".modal").length == 1;
    // リプライボタンまたは投稿ボタンの判定
    let textBox = isModal ? $("#replyTextarea") : $("#postTextarea");

    // テキスト内容を取得
    let data = {
        content: textBox.val(),
    };

    // モーダルなら
    if (isModal) {
        // ボタンId取得
        let id = button.data().id;
        if (id == null) return alert("ボタンIdがありません");
        data.replyTo = id;
    }

    // "/api/posts"に対してpostリクエストを送信
    $.post("/api/posts", data, (postData) => {
        if (postData.replyTo) {
            // リロード
            location.reload();
        } else {
            let html = createPostHtml(postData);
            $(".postsContainer").append(html);
            textBox.val("");
            button.prop("disabled", true);
            location.reload(); // 場所違うかも？
        }
    });
});

// 返信モーダル開くイベント
$("#replyModal").on("show.bs.modal", (event) => {
    let button = $(event.relatedTarget);
    let postId = getPostIdFormElement(button);
    // ボタンにID設定
    $("#submitReplyButton").data("id", postId);

    $.get("/api/posts/" + postId, (results) => {
        outputPosts(results.postData, $("#originalPostContainer"));
    });
});

// 返信モーダル閉じるイベント
$("#replyModal").on("hidden.bs.modal", () => {
    $("#originalPostContainer").html("");
});

// 削除モーダル開くイベント
$("#deletePostModal").on("show.bs.modal", (event) => {
    let button = $(event.relatedTarget);
    let postId = getPostIdFormElement(button);
    // ボタンIDに投稿ID設定
    $("#deletePostButton").data("id", postId);
});

// ピン止めモーダル開くイベント
$("#confirmPinModal").on("show.bs.modal", (event) => {
    let button = $(event.relatedTarget);
    let postId = getPostIdFormElement(button);
    // ボタンIDに投稿ID設定
    $("#pinPostButton").data("id", postId);
});

// ピン止めモーダル開くイベント
$("#unPinModal").on("show.bs.modal", (event) => {
    let button = $(event.relatedTarget);
    let postId = getPostIdFormElement(button);
    // ボタンIDに投稿ID設定
    $("#unPinPostButton").data("id", postId);
});

// 静的要素に紐づける
// 投稿削除ボタン押下イベント
$("#deletePostButton").click((event) => {
    let postId = $(event.target).data("id");
    //
    $.ajax({
        url: `/api/posts/${postId}`,
        type: "DELETE",
        success: (data, status, xhr) => {
            if (xhr.status != 202) {
                alert("投稿を削除できませんでした");
                return;
            }
            location.reload();
        },
    });
});

// ピン保存ボタン押下イベント
$("#pinPostButton").click((event) => {
    let postId = $(event.target).data("id");

    $.ajax({
        url: `/api/posts/${postId}`,
        type: "PUT",
        data: { pinned: true },
        success: (data, status, xhr) => {
            if (xhr.status != 204) {
                alert("投稿をピン止めできませんでした");
                return;
            }
            location.reload();
        },
    });
});

// ピン解除ボタン押下イベント
$("#unPinPostButton").click((event) => {
    let postId = $(event.target).data("id");

    $.ajax({
        url: `/api/posts/${postId}`,
        type: "PUT",
        data: { pinned: false },
        success: (data, status, xhr) => {
            if (xhr.status != 204) {
                alert("投稿をピン止めできませんでした");
                return;
            }
            location.reload();
        },
    });
});

// プロフィール画像が選択された時のイベント
$("#filePhoto").change(function () {
    // input.filesが存在し、かつ少なくとも1つのファイルが選択されている場合
    if (this.files && this.files[0]) {
        let reader = new FileReader();
        // ファイル読み込み完了時
        reader.onload = (e) => {
            let image = document.getElementById("imagePreview");
            image.src = e.target.result;

            // cropper変数を空にする
            if (cropper !== undefined) cropper.destroy();
            cropper = new Cropper(image, {
                aspectRatio: 1 / 1, // (正方形) アスペクト比
                background: false, // 背景が表示されず、クロッピング領域
            });
        };
        // ファイルをデータURLとして読み込む
        reader.readAsDataURL(this.files[0]);
    }
});

// 背景画像が選択された時のイベント
$("#coverPhoto").change(function () {
    // input.filesが存在し、かつ少なくとも1つのファイルが選択されている場合
    if (this.files && this.files[0]) {
        let reader = new FileReader();
        // ファイル読み込み完了時
        reader.onload = (e) => {
            let image = document.getElementById("coverPreview");
            image.src = e.target.result;

            // cropper変数を空にする
            if (cropper !== undefined) cropper.destroy();
            cropper = new Cropper(image, {
                aspectRatio: 3 / 1, // (正方形) アスペクト比
                background: false, // 背景が表示されず、クロッピング領域
            });
        };
        // ファイルをデータURLとして読み込む
        reader.readAsDataURL(this.files[0]);
    }
});

// プロフィール画像保存ボタン押下イベント
$("#imageUploadButton").click(() => {
    // トリミング領域取得
    let canvas = cropper.getCroppedCanvas();

    if (canvas == null) {
        alert("画像をアップロードできませんでした。再度試して下さい");
        return;
    }

    // CanvasからBlobオブジェクトを生成する(バイナリにする)
    canvas.toBlob((blob) => {
        // HTMLからフォームデータを作成しサーバーに送信できるようにする
        let formData = new FormData();
        formData.append("croppedImage", blob);

        $.ajax({
            url: "/api/users/profilePicture",
            type: "POST",
            data: formData,
            processData: false, // データを自動的に文字列に変換せずに送信
            contentType: false, // jQueryが自動的にContent-Typeヘッダーを設定しない
            success: () => location.reload(),
        });
    });
});

// 背景画像保存ボタン押下イベント
$("#coverPhotoButton").click(() => {
    // トリミング領域取得
    let canvas = cropper.getCroppedCanvas();

    if (canvas == null) {
        alert("画像をアップロードできませんでした。再度試して下さい");
        return;
    }

    // CanvasからBlobオブジェクトを生成する(バイナリにする)
    canvas.toBlob((blob) => {
        // HTMLからフォームデータを作成しサーバーに送信できるようにする
        let formData = new FormData();
        formData.append("croppedImage", blob);

        $.ajax({
            url: "/api/users/coverPhoto",
            type: "POST",
            data: formData,
            processData: false, // データを自動的に文字列に変換せずに送信
            contentType: false, // jQueryが自動的にContent-Typeヘッダーを設定しない
            success: () => location.reload(),
        });
    });
});

// チャット作成ボタン押下イベント
$("#createChatButton").click(() => {
    let data = JSON.stringify(selectedUsers);
    $.post("/api/chats", { users: data }, (chat) => {
        if (!chat || !chat._id) return alert("サーバーから返信がありませんでした");

        window.location.href = `/messages/${chat._id}`;
    });
});

// 動的要素に紐づける
// いいねボタン押下イベント
$(document).on("click", ".likeButton", (event) => {
    let button = $(event.target);
    let postId = getPostIdFormElement(button);
    if (postId === undefined) return;
    // いいね更新
    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: "PUT",
        success: (postData) => {
            button.find("span").text(postData.likes.length || "");
            if (postData.likes.includes(userLoggedIn._id)) {
                button.addClass("active");
            } else {
                button.removeClass("active");
            }
        },
    });
});

// リツイートボタン押下イベント
$(document).on("click", ".retweetButton", (event) => {
    let button = $(event.target);
    let postId = getPostIdFormElement(button);

    if (postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/retweet`,
        type: "POST",
        success: (postData) => {
            button.find("span").text(postData.retweetUsers.length || "");
            if (postData.retweetUsers.includes(userLoggedIn._id)) {
                button.addClass("active");
            } else {
                button.removeClass("active");
            }
        },
    });
});

// 投稿押下イベント
$(document).on("click", ".post", (event) => {
    let element = $(event.target);
    let postId = getPostIdFormElement(element);
    if (postId !== undefined && !element.is("button")) {
        window.location.href = "/posts/" + postId;
    }
});

// 投稿押下イベント
$(document).on("click", ".followButton", (event) => {
    let button = $(event.target);
    let userId = button.data().user;

    $.ajax({
        url: `/api/users/${userId}/follow`,
        type: "PUT",
        success: (data, status, xhr) => {
            if (xhr.status == 404) {
                alert("user not found");
                return;
            }
            // フォロワーの差分定義
            let difference = 1;
            // 配列が存在し、Idを含んでいれば
            if (data.following && data.following.includes(userId)) {
                button.addClass("following");
                button.text("フォロー中");
            } else {
                button.removeClass("following");
                button.text("フォローする");
                difference = -1;
            }

            let followersLabel = $("#followersValue");
            if (followersLabel.length != 0) {
                let followersText = parseInt(followersLabel.text());
                followersLabel.text(followersText + difference);
            }
        },
    });
});

// 通知クリックイベント
$(document).on("click", ".notification.active", (e) => {
    let container = $(e.target).closest(".notification ");
    let notificationId = container.data().id;
    let href = container.attr("href");
    // リンクを処理しない
    e.preventDefault();
    // マーキングが終了したときに起きるイベント
    let callback = () => (window.location = href);
    markNotificationsAsOpened(notificationId, callback);
});

// ID取得
function getPostIdFormElement(element) {
    // postクラスが存在する場合trueを返す
    let isRoot = element.hasClass(".post");
    // postクラスが存在する場合引数を返し、存在しない場合親にpostクラスを持つ要素を取得
    let rootElement = isRoot == true ? element : element.closest(".post"); // falseなら親要素取得（post）
    let postId = rootElement.data().id;
    if (postId === undefined) return alert("alert");
    return postId;
}

// 投稿作成イベント
function createPostHtml(postData, largeFont = false) {
    // 投稿データがなければアラート
    if (postData == null) return alert("投稿がありません");
    // リツイートデータ判定
    let isRetweet = postData.retweetData !== undefined;
    // リツイートデータであれば投稿者を取得
    let retweetedBy = isRetweet ? postData.postedBy.username : null;
    // リツイートデータであればリツイートデータ、違うなら投稿データそのものを取得
    postData = isRetweet ? postData.retweetData : postData;

    // 投稿者ID取得
    let posted = postData.postedBy;
    // 投稿者がいない場合
    if (posted._id === undefined) return console.log("User Object not populated");

    // 表示用ユーザー名取得
    let displayName = posted.firstName + " " + posted.lastName;
    // 表示用時間取得
    let timestamp = timeDifference(new Date(), new Date(postData.createdAt));
    // 投稿にいいねがあればいいねボタンをactiveにする
    let likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" : "";
    // 投稿にリツイートユーザがいればリツイートactiveにする
    let retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? "active" : "";
    // フォントサイズ大きく
    let largeFontClass = largeFont ? "largeFont" : "";

    let retweetText = "";
    // リツイートテキスト挿入
    if (isRetweet) {
        retweetText = `<span>
                            <i class="fas fa-retweet"></i>
                            Retweeted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a>
                       </span>`;
    }

    let replyFlag = "";
    if (postData.replyTo && postData.replyTo._id) {
        // リプライがある場合
        if (!postData.replyTo._id) {
            // リプライ投稿のIDなければアラート
            return alert("Reply to is not populated");
        } else if (!postData.replyTo.postedBy._id) {
            // リプライ投稿者のIDなければアラート
            return alert("Posted By is not populated");
        }

        let replyToUsername = postData.replyTo.postedBy.username;
        replyFlag = `<div class="replyFlag">
                        Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a>
                    </div>`;
    }

    let buttons = "";
    let pinnedPostText = "";

    if (postData.postedBy._id == userLoggedIn._id) {
        let pinnedClass = "";
        let dataTarget = "#confirmPinModal";
        if (postData.pinned === true) {
            pinnedClass = "active";
            dataTarget = "#unPinModal";
            pinnedPostText = "<i class='fas fa-thumbtack'></i> <span>Pinned post</span>";
        }

        buttons = `<button class="pinButton ${pinnedClass}" data-id="${postData._id}" data-toggle="modal" data-target="${dataTarget}"><i class='fas fa-thumbtack'></i></button>
                    <button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal"><i class='fas fa-times'></i></button>`;
    }

    return `<div class='post ${largeFontClass}' data-id='${postData._id}'>
            <div class="postActionContainer">
                ${retweetText}
            </div>
            <div class="mainContentContainer">
                <div class="userImageContainer">
                    <img src=${posted.profilePic}>
                </div>
                <div class="postContentContainer">
                    <div class="pinnedPostText">${pinnedPostText}</div>
                    <div class="header">
                        <a href='/profile/${posted.username}' class="displayName">${displayName}</a>
                        <span class="username">@${posted.username}</span>
                        <span class="date">${timestamp}</span>
                        ${buttons}
                    </div>
                    ${replyFlag}
                    <div class="postBody">
                        <span>${postData.content}</span>
                    </div>
                    <div class="postFooter">
                        <div class="postButtonContainer">
                            <button data-toggle='modal' data-target='#replyModal'>
                                <i class="far fa-comment"></i>
                            </button>
                        </div>
                        <div class="postButtonContainer green">
                            <button class="retweetButton ${retweetButtonActiveClass}">
                                <i class="fas fa-retweet"></i>
                                <span>${postData.retweetUsers.length || ""}</span>
                            </button>
                        </div>
                        <div class="postButtonContainer red">
                            <button class="likeButton ${likeButtonActiveClass}">
                                <i class="far fa-heart"></i>
                                <span>${postData.likes.length || ""}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

// 日付変換
function timeDifference(current, previous) {
    let msPerMinute = 60 * 1000;
    let msPerHour = msPerMinute * 60;
    let msPerDay = msPerHour * 24;
    let msPerMonth = msPerDay * 30;
    let msPerYear = msPerDay * 365;

    let elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if (elapsed / 1000 < 30) return "Just Now";
        return Math.round(elapsed / 1000) + " seconds ago";
    } else if (elapsed < msPerHour) {
        return Math.round(elapsed / msPerMinute) + " minutes ago";
    } else if (elapsed < msPerDay) {
        return Math.round(elapsed / msPerHour) + " hours ago";
    } else if (elapsed < msPerMonth) {
        return Math.round(elapsed / msPerDay) + " days ago";
    } else if (elapsed < msPerYear) {
        return Math.round(elapsed / msPerMonth) + " months ago";
    } else {
        return Math.round(elapsed / msPerYear) + " years ago";
    }
}

// 投稿作成
function outputPosts(results, container) {
    container.html("");

    // 配列でなければそのまま代入
    if (!Array.isArray(results)) {
        results = [results];
    }

    // 繰り返し処理
    results.forEach((result) => {
        let html = createPostHtml(result);
        container.append(html);
    });

    // 投稿がない場合
    if (results.length == 0) {
        container.append("<span class='noResults'>投稿がありません</span>");
    }
}

// リプライ作成

// リプライ投稿作成
function outputPostsWithReplies(results, container) {
    container.html("");

    if (results.replyTo !== undefined && results.replyTo._id !== undefined) {
        let html = createPostHtml(results.replyTo);
        container.append(html);
    }

    let mainPostHtml = createPostHtml(results.postData, true);
    container.append(mainPostHtml);

    // 繰り返し処理
    results.replies.forEach((result) => {
        let html = createPostHtml(result);
        container.append(html);
    });
}

// ユーザー出力
function outputUsers(results, container) {
    container.html("");
    results.forEach((result) => {
        // HTML作成(フォローボタンなし)
        let html = createUserHtml(result, true);
        container.append(html);
    });

    if (results.length == 0) {
        container.append("<span class='noResults'>結果が見つかりませんでした</span>");
    }
}

// ユーザHTML作成
function createUserHtml(userData, showFollowButton) {
    let name = userData.firstName + " " + userData.lastName;
    // フォロー中のユーザに含まれている場合True
    let isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);
    let text = isFollowing ? "フォロー中" : "フォローする";
    let buttonClass = isFollowing ? "followButton following" : "followButton";

    let followButton = "";
    if (showFollowButton && userLoggedIn._id != userData._id) {
        followButton = `<div class='followButtonContainer'>
                            <button class='${buttonClass}' data-user=${userData._id}>${text}</button>
                        </div>`;
    }

    return `<div class='user'>
                <div class='userImageContainer'>
                    <img src='${userData.profilePic}'>
                </div>
                <div class='userDetailsContainer'>
                    <div class='header'>
                        <a href='/profile/${userData.username}'>${name}</a>
                        <span class='username'>@${userData.username}</span>
                    </div>
                </div>
                ${followButton}
            </div>`;
}

// ユーザー検索
function searchUsers(searchTerm) {
    $.get("/api/users", { search: searchTerm }, (results) => {
        outputSelectableUsers(results, $(".resultsContainer"));
    });
}

// 検索ユーザー出力
function outputSelectableUsers(results, container) {
    container.html("");
    results.forEach((result) => {
        // ログインユーザまたはすでに選択されているユーザの場合処理終了
        if (result._id == userLoggedIn._id || selectedUsers.some((u) => u._id == result._id)) {
            return;
        }
        // HTML作成(フォローボタンなし)
        let html = createUserHtml(result, false);
        // DOMに挿入可能な形式に変換
        let element = $(html);
        element.click(() => userSelected(result));
        container.append(element);
    });

    if (results.length == 0) {
        container.append("<span class='noResults'>結果が見つかりませんでした</span>");
    }
}

// 検索ユーザーが選択された時の処理
function userSelected(user) {
    selectedUsers.push(user);
    updateSelectedUsersHtml();
    $("#userSearchTextBox").val("").focus();
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled", false);
}

// 選択済みユーザを検索ボックスに表示
function updateSelectedUsersHtml() {
    let element = [];
    selectedUsers.forEach((user) => {
        let name = user.firstName + " " + user.lastName;
        let userElement = $(`<span class='selectedUser'>${name}</span>`);
        element.push(userElement);
    });
    $(".selectedUser").remove();
    $("#selectUsers").prepend(element);
}

// チャット名取得
function getChatName(chatData) {
    let chatName = chatData.chatName;
    if (!chatName) {
        let otherChatUsers = getOtherChatUsers(chatData.users);
        let namesArray = otherChatUsers.map((user) => user.firstName + " " + user.lastName);
        chatName = namesArray.join(", ");
    }
    return chatName;
}

// 自分以外のユーザー取得
function getOtherChatUsers(users) {
    if (users.length == 1) return users;
    return users.filter((user) => user._id != userLoggedIn._id);
}

// メッセージ受信
function messageReceived(newMessage) {
    if ($(".chatContainer").length == 0) {
        // Show popup notification
    } else {
        addChatMessageHtml(newMessage);
    }
}

// 通知を開いたことをマークする
function markNotificationsAsOpened(notificationsId = null, callback = null) {
    if (callback == null) callback = () => location.reload();
    let url = notificationsId != null ? `/api/notifications/${notificationsId}/markAsOpened` : `/api/notifications/markAsOpened`;
    $.ajax({
        url: url,
        type: "PUT",
        success: () => callback(),
    });
}
