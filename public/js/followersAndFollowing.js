$(document).ready(() => {
    if(selectedTab === "followers") {
        loadFollowers();
    } else {
        loadFollowing();
    }
})

// フォロワー取得
function loadFollowers(){
    $.get(`/api/users/${profileUserId}/followers`, results => {
        outputUsers(results.followers, $(".resultContainer"));
     });
}

// フォロー中取得
function loadFollowing(){
    $.get(`/api/users/${profileUserId}/following`, results => {
        outputUsers(results.following, $(".resultContainer"));
     });
}
