// DOMが全てロードされてDOMにアクセスできる準備が出来た段階で実行
$(document).ready(() => {
    $.get("/api/posts", results => {
       outputPosts(results, $(".postsContainer"));
    });
})

// 投稿作成
function outputPosts(results, container) {
    container.html("");

    results.forEach(result => {
        let html = createPostHtml(result);
        container.append(html);
    });

    if (results.length == 0) {
        container.append("<span class='noResults'>投稿がありません</span>")
    }
}
