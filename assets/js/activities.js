/**
 * Created by shzha on 2016/12/29.
 */
(function ($) {
    $("#user-name").html(localStorage.username);
    $("#avt").attr('src', 'https://sm.moemoe.tech/'+localStorage.imgurl);
    loadpage();

    $('#content-list').delegate('likebtn', 'click', function () {
        $.ajax(
            {
                type: 'POST',
                url: 'https://sm.moemoe.tech/posts.php?method=thumb',
                data: {'ID': $(this).attr('data-id')},
                dataType: 'json'
            })
            .done(function (data) {
                if (data.code > 300) alert(data.message);
            });
        $(this).find('.thumbcount').html(parseInt($(this).find('.thumbcount').html()) + 1);
    });

    $('#content-list').delegate('img', 'click', function () {
        if ($(this).attr('href') !== undefined) {
            var win = window.open($(this).attr('href'), '_blank');
        }
    });

    $("#sendbtn").click(function () {
        location.href = 'sendpost.html';
    });

    function append_item($id, $username, $userpic, $content, $pic, $thumb, $time) {
        console.log('called!');
        if ($userpic == '') $userpic = 'assets/img/default.png';

        if ($pic == '') picpayload = '';
        else picpayload = '\
<p>\
<img class="list-img data-avt" src="https://sm.moemoe.tech/' + $pic + '" href="https://sm.moemoe.tech/' + $pic + '" style="height: 80px;">\
</p>';

        payload = '\
<li>\
<div class="po-avt-wrap">\
<img class="po-avt data-avt" src="https://sm.moemoe.tech/' + $userpic + '">\
</div>\
<div class="po-cmt">\
<div class="po-hd">\
<p class="po-name"><span class="data-name">' + $username + '</span></p>\
<div class="post">\
<p>' + $content + '</p>' + picpayload + '\
</div>\
<p class="time">' + $time + '</p>\
</div>\
<div class="r"></div>\
<likebtn style="cursor: pointer;" data-id="' + $id + '">\
<div class="cmt-wrap">\
<div class="like">\
<img src="assets/img/l.png">\
</likebtn>\
<div class="thumbcount" style="display: inline;">' + $thumb + '</div>\
</div>\
</div>\
</div>\
</li>\
';
        $("#content-list").append(payload);
    }

    function loadpage() {
        $.ajax(
            {
                type: 'GET',
                url: 'https://sm.moemoe.tech/posts.php?method=get',
                dataType: 'json'
            })
            .done(function (data) {
                $.each(data, function (id, piece) {
                    append_item(piece.ID, piece.username, piece.userpic, piece.content, piece.postpic, piece.thumb, piece.time);
                    console.log(piece.username, piece.userpic, piece.content, piece.postpic, piece.thumb, piece.time, ' loaded!');
                })
            });
    }
})(jQuery);
