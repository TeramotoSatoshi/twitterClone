$(document).ready(() => {
    $.get("/api/notifications", async (data) => {
        outputNotificationsList(data, $(".resultsContainer"));
    });
});

$("#markNotificationAsRead").click(() => markNotificationsAsOpened());

// 通知HTML出力
function outputNotificationsList(notifications, container) {
    notifications.forEach((notification) => {
        let html = createNotificationHtml(notification);
        container.append(html);
    });

    if (notifications.length == 0) {
        container.append("<span class='noResults'>結果が見つかりませんでした</span>");
    }
}

// 通知HTML作成
function createNotificationHtml(notification) {
    let userFrom = notification.userFrom;
    let text = getNotificationText(notification);
    let href = getNotificationUrl(notification);
    let className = notification.opened ? "" : "active";
    return `<a href='${href}' class='resultListItem notification ${className}' data-id='${notification._id}'>
                <div class='resultsImageContainer'>
                    <img src='${userFrom.profilePic}'>
                </div>
                <div class='resultDetailContainer ellipsis'>
                    <span class='ellipsis'>${text}</span>
                </div>
            </a>`;
}

// 通知のテキスト取得
function getNotificationText(notification) {
    let userFrom = notification.userFrom;
    // 名前が定義されていない場合
    if (!(userFrom.firstName || userFrom.lastName)) {
        alert("送信者の名前が定義されていません");
    }
    let userFromName = `${userFrom.firstName} ${userFrom.lastName}`;
    let text;

    if (notification.notificationType == "retweet") {
        text = `${userFromName} があなたの投稿をリツイートしました`;
    } else if (notification.notificationType == "like") {
        text = `${userFromName} があなたの投稿をいいねしました`;
    } else if (notification.notificationType == "reply") {
        text = `${userFromName} があなたの投稿に返信しました`;
    } else if (notification.notificationType == "follow") {
        text = `${userFromName} があなたをフォローしました`;
    }
    return `<div class='ellipse'>${text}</div>`;
}

// 通知のリンク取得
function getNotificationUrl(notification) {
    let url = "#";
    if (notification.notificationType == "retweet" || notification.notificationType == "like" || notification.notificationType == "reply") {
        url = `/posts/${notification.entityId}`;
    } else if (notification.notificationType == "follow") {
        url = `/profile/${notification.entityId}`;
    }
    return url;
}
