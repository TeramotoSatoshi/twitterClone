// postTextareaにキーが押された時のアクションを割り当て
$("#postTextarea, #replyTextarea").keyup((event) => {
    let textBox = $(event.target);
    let value = textBox.val().trim();

    // モーダルであるか判別
    let isModal = textBox.parents(".modal").length == 1;
    let submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton");

    if (submitButton.length == 0) return alert("No submit button found");


    if ((value == "")) {
        // 取得値が空ならボタン非活性
        submitButton.prop("disabled", true);
        return;
    }
    submitButton.prop("disabled", false);
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
    if(isModal) {
        // ボタンId取得
        let id = button.data().id;
        if(id == null) return alert("ボタンIdがありません");
        data.replyTo = id;
    }

    // "/api/posts"に対してpostリクエストを送信
    $.post("/api/posts", data, (postData) => {
        if(postData.replyTo) {
            // リロード
            location.reload();
        } else {
            let html = createPostHtml(postData);
            $(".postsContainer").append(html);
            textBox.val("");
            button.prop("disabled", true);
        }
    });
});

// モーダル開くイベント
$("#replyModal").on("show.bs.modal", event => {
    let button = $(event.relatedTarget);
    let postId = getPostIdFormElement(button);
    // ボタンにID設定
    $("#submitReplyButton").data("id", postId);

    $.get("/api/posts/" + postId, results => {
        outputPosts(results.postData, $("#originalPostContainer"));
     });
})

// モーダル閉じる
$("#replyModal").on("hidden.bs.modal", () => $("#originalPostContainer").html(""))

// 削除モーダル開くイベント
$("#deletePostModal").on("show.bs.modal", event => {
    let button = $(event.relatedTarget);
    let postId = getPostIdFormElement(button);
    // ボタンIDに投稿ID設定
    $("#deletePostButton").data("id", postId);
})

// 静的要素に紐づける形
$("#deletePostButton").click((event) => {
    let postId = $(event.target).data("id");
    //
    $.ajax({
        url: `/api/posts/${postId}`,
        type: "DELETE",
        success: (data, status, xhr) => {
            if(xhr.status != 202) {
                alert("投稿を削除できませんでした");
                return;
            }
            location.reload();
        }
    })
})

// 動的要素に紐づける形
// いいねボタン押下イベント
$(document).on("click", ".likeButton", event => {
    let button = $(event.target);
    let postId = getPostIdFormElement(button);
    if(postId === undefined) return;
    // いいね更新
    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: "PUT",
        success: (postData) => {
            button.find("span").text(postData.likes.length || "");
            if(postData.likes.includes(userLoggedIn._id)) {
                button.addClass("active");
            } else {
                button.removeClass("active");
            }
        }
    })
});

// リツイートボタン押下イベント
$(document).on("click", ".retweetButton" ,(event) => {
    let button = $(event.target);
    let postId = getPostIdFormElement(button);

    if(postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/retweet`,
        type: "POST",
        success: (postData) => {
            button.find("span").text(postData.retweetUsers.length || "");
            if(postData.retweetUsers.includes(userLoggedIn._id)) {
                button.addClass("active");
            } else {
                button.removeClass("active");
            }
        }
    })
});

// 投稿押下イベント
$(document).on("click", ".post", event => {
    let element = $(event.target);
    let postId = getPostIdFormElement(element);
    if(postId !== undefined && !element.is("button")) {
        window.location.href = "/posts/" + postId;
    }
});

// ID取得
function getPostIdFormElement(element) {
    // postクラスが存在する場合trueを返す
    let isRoot = element.hasClass(".post");
    // postクラスが存在する場合引数を返し、存在しない場合親にpostクラスを持つ要素を取得
    let rootElement = isRoot == true ? element : element.closest(".post"); // falseなら親要素取得（post）
    let postId = rootElement.data().id;
    if(postId === undefined) return alert("alert");
    return postId;
}

// 投稿作成イベント
function createPostHtml(postData, largeFont = false) {

    // 投稿データがなければアラート
    if(postData == null) return alert("投稿がありません");
    // リツイートデータ判定
    let isRetweet = postData.retweetData !== undefined;
    // リツイートデータであれば投稿者を取得
    let retweetedBy = isRetweet ? postData.postedBy.username : null;
    // リツイートデータであればリツイートデータ、違うなら投稿データそのものを取得
    postData = isRetweet ? postData.retweetData : postData;

    // 投稿者ID取得
    let posted = postData.postedBy;
    // 投稿者がいない場合
    if(posted._id === undefined) return console.log("User Object not populated");

    // 表示用ユーザー名取得
    let displayName = posted.firstName + " " + posted.lastName;
    // 表示用時間取得
    let timestamp = timeDifference(new Date(), new Date(postData.createdAt));
    // 投稿にいいねがあればいいねボタンをactiveにする
    let likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" : "";
    // 投稿にリツイートユーザがいればリツイートactiveにする
    let retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? "active" : "";
    // フォントサイズ大きく
    let largeFontClass = largeFont? "largeFont" : "";

    let retweetText = "";
    // リツイートテキスト挿入
    if(isRetweet) {
        retweetText = `<span>
                            <i class="fas fa-retweet"></i>
                            Retweeted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a>
                       </span>`
    }

    let replyFlag = "";
    if(postData.replyTo && postData.replyTo._id) {
        // リプライがある場合
        if(!postData.replyTo._id) {
            // リプライ投稿のIDなければアラート
            return alert("Reply to is not populated");
        } else if(!postData.replyTo.postedBy._id) {
            // リプライ投稿者のIDなければアラート
            return alert("Posted By is not populated");
        }

        let replyToUsername = postData.replyTo.postedBy.username;
        replyFlag = `<div class="replyFlag">
                        Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a>
                    </div>`;
    }

    let buttons = "";
    if(postData.postedBy._id == userLoggedIn._id) {
        buttons = `<button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal"><i class='fas fa-times'></i></button>`
    }

    return (
        `<div class='post ${largeFontClass}' data-id='${postData._id}'>
            <div class="postActionContainer">
                ${retweetText}
            </div>
            <div class="mainContentContainer">
                <div class="userImageContainer">
                    <img src=${posted.profilePic}>
                </div>
                <div class="postContentContainer">
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
        </div>`
    );
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
        if(elapsed/1000 < 30) return "Just Now"
        return Math.round(elapsed/1000) + ' seconds ago';
    } else if (elapsed < msPerHour) {
        return Math.round(elapsed/msPerMinute) + ' minutes ago';
    } else if (elapsed < msPerDay ) {
        return Math.round(elapsed/msPerHour ) + ' hours ago';
    } else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';
    } else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' months ago';
    } else {
        return Math.round(elapsed/msPerYear ) + ' years ago';
    }
}

// 投稿作成
function outputPosts(results, container) {
    container.html("");

    // 配列でなければそのまま代入
    if(!Array.isArray(results)) {
        results = [results];
    }

    // 繰り返し処理
    results.forEach(result => {
        let html = createPostHtml(result);
        container.append(html);
    });

    // 投稿がない場合
    if (results.length == 0) {
        container.append("<span class='noResults'>投稿がありません</span>")
    }
}

function outputPostsWithReplies(results, container) {
    container.html("");

    if(results.replyTo !== undefined && results.replyTo._id !== undefined) {
        let html = createPostHtml(results.replyTo);
        container.append(html);
    }

    let mainPostHtml = createPostHtml(results.postData, true);
    container.append(mainPostHtml);

    // 繰り返し処理
    results.replies.forEach(result => {
        let html = createPostHtml(result);
        container.append(html);
    });
}
