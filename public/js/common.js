// postTextareaにキーが押された時のアクションを割り当て
$("#postTextarea").keyup((event) => {
    let textBox = $(event.target);
    let value = textBox.val().trim();

    let submitButton = $("#submitPostButton");

    if (submitButton.length == 0) return alert("No submit button found");

    if ((value = "")) {
        submitButton.prop("disabled", true);
        return;
    }
    submitButton.prop("disabled", false);
});

// submitPostButtonクリックイベント
$("#submitPostButton").click(() => {
    let button = $(event.target);
    let textBox = $("#postTextarea");

    let data = {
        content: textBox.val(),
    };

    // "/api/posts"に対してpostリクエストを送信
    $.post("/api/posts", data, (postData) => {
        let html = createPostHtml(postData);
        $(".postsContainer").append(html);
        textBox.val("");
        button.prop("disabled", true);
    });
});

// いいねボタン押下イベント
$(document).on("click", ".likeButton" ,(event) => {
    let button = $(event.target);
    let postId = getPostIdFormElement(button);

    if(postId === undefined) return;

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

// ID取得
function getPostIdFormElement(element) {
    // postクラスが存在する場合trueを返す
    let isRoot = element.hasClass(".post");
    console.log("isRoot", isRoot);
    let rootElement = isRoot == true ? element : element.closest(".post"); // falseなら親要素取得（post）
    console.log("rootElement", rootElement.data());
    let postId = rootElement.data().id;
    if(postId === undefined) return alert("alert");
    return postId;
}

// 投稿作成イベント
function createPostHtml(postData) {

    // 投稿データがなければアラート
    if(postData == null) return alert("Post Object Is Null");

    // リツイートデータ判定
    let isRetweet = postData.retweetData !== undefined;
    // リツイートデータであれば投稿者を取得
    let retweetedBy = isRetweet ? postData.postedBy.username : null;
    // リツイートデータであればリツイートデータ、違うなら投稿データそのものを取得
    postData = isRetweet ? postData.retweetData : postData;

    console.log(isRetweet);// 後で消す

    // 投稿者ID取得
    let posted = postData.postedBy;
    // 投稿者がいない場合
    if(posted._id === undefined) return console.log("User Object not populated");

    // ユーザー名取得
    let displayName = posted.firstName + " " + posted.lastName;
    // 投稿された時間を取得
    let timestamp = timeDifference(new Date(), new Date(postData.createdAt));
    // データにいいねがあればactiveにする
    let likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" : "";
    // データにリツイートユーザがいればactiveにする
    let retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? "active" : "";

    let retweetText = "";
    if(isRetweet) {
        retweetText = `<span>
                            <i class="fas fa-retweet"></i>
                            Retweeted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a>
                       </span>`
    }
    console.log(retweetedBy);

    return (
        `<div class='post' data-id='${postData._id}'>
            <div class="postActionContainer">
                ${retweetText}
            </div>
            <div class="mainContentContainer">
                <div class="userImageContainer">
                    <img src=${posted.profilePic}>
                </div>
                <div class="postContentContainer">
                    <div class="header">
                        <a href='/profile/$(postedBy.username)' class="displayName">${displayName}</a>
                        <span class="username">${posted.username}</span>
                        <span class="date">${timestamp}</span>
                    </div>
                    <div class="postedBy">
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
