$("#postTextarea").keyup((event) => {
    var textBox = $(event.target);
    var value = textBox.val().trim();

    var submitButton = $("#submitPostButton");

    if (submitButton.length == 0) return alert("No submit button found");

    if ((value = "")) {
        submitButton.prop("disabled", true);
        return;
    }
    submitButton.prop("disabled", false);
});

$("#submitPostButton").click(() => {
    var button = $(event.target);
    var textBox = $("#postTextarea");

    var data = {
        content: textBox.val(),
    };

    $.post("/api/posts", data, (postData) => {
        var html = createPostHtml(postData);
        $(".postsContainer").append(html);
        textBox.val("");
        button.prop("disabled", true);
    });
});

// いいねボタン押下イベント
$(document).on("click", ".likeButton" ,(event) => {
    let button = $(event.target);
    let postId = getPostIdFormElement(button);
    console.log(postId);
});

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
    let posted = postData.postedBy;
    if(posted._id === undefined) {
        return console.log("User Object not populated");
    }

    let displayName = posted.firstName + " " + posted.lastName;
    let timestamp = timeDifference(new Date(), new Date(postData.createdAt));

    return (
        `<div class="post" data-id='${postData._id}'>
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
                                <button>
                                    <i class="far fa-comment"></i>
                                </button>
                            </div>
                            <div class="postButtonContainer">
                                <button>
                                    <i class="fas fa-retweet"></i>
                                </button>
                            </div>
                            <div class="postButtonContainer">
                                <button class="likeButton">
                                    <i class="far fa-heart"></i>
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

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if(elapsed/1000 < 30) return "Just Now"
        return Math.round(elapsed/1000) + ' seconds ago';
    }

    else if (elapsed < msPerHour) {
        return Math.round(elapsed/msPerMinute) + ' minutes ago';
    }

    else if (elapsed < msPerDay ) {
        return Math.round(elapsed/msPerHour ) + ' hours ago';
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' months ago';
    }

    else {
        return Math.round(elapsed/msPerYear ) + ' years ago';
    }
}
