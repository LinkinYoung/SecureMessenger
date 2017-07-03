/**
 * Created by shzha on 2016/12/28.
 */
(function ($) {
    var current_username = Cookies.get('username');
    var current_userimgurl = Cookies.get('imgurl');
    var current_friend = '';
    var current_friendimgurl = 'assets/img/steam.png';
    var todelete = '';

    $('#friend-list').delegate('btn', 'click', function () {
        if(current_friend == $(this).parent().find(".username").html()) return;
        $("#chatbox-list").empty();
        current_friend = $(this).parent().find(".username").html();
        current_friendimgurl = $(this).parent().parent().find("img").attr("src");
        $("#current_chatname").html("你正在与 " + current_friend + " 进行交易");
        console.log("Change to" + current_friend + ", img: " + current_friendimgurl);
    });

    $("#send_btn").click(function () {
        $.ajax(
            {
                type: 'POST',
                url: 'message.php?method=send',
                data: {'content': $("#input_msg").val(), 'to': current_friend},
                dataType: 'json'
            })
            .done(function (data) {
                if (data.code > 300) alert(data.message);
            });
        $("#input_msg").val('');
    });

    $("#input_msg").on('keydown', function (e) {
        if(e.keyCode  == 13)
            $("#send_btn").click();
    });

    $("#add_friend_btn").click(function () {
        $('#addModal').modal('toggle');
    });
    
    $("#addcomfirm").click(function () {
        if($("#newfriend").val()!='')
        {
            $.ajax(
                {
                    type: 'POST',
                    url: 'friends.php?method=addfriend',
                    data: {'username': $("#newfriend").val()},
                    dataType: 'json'
                })
                .done(function (data) {
                    if (data.code > 300) alert(data.message);
                });
            $("#newfriend").val("");
        }
        refresh_friendlist();
    });

    $('#friend-list').delegate('delbtn', 'click', function () {
        $('#delModal').modal('toggle');
        todelete = $(this).parent().find(".username").html();
        console.log("Ready to delete: "+todelete);
    });

    $("#delcomfirm").click(function () {
        $.ajax(
            {
                type: 'POST',
                url: 'friends.php?method=deletefriend',
                data: {'username': todelete},
                dataType: 'json'
            })
            .done(function (data) {
                if (data.code > 300) alert(data.message);
            });
        $("#newfriend").val("");
        refresh_friendlist();
    });

    function append_msg($type, $msg, $extmsg) {
        switch ($type) {
            case 'me':
                dir = 'right';
                imgurl = current_userimgurl;
                break;
            default:
                imgurl = current_friendimgurl;
                dir = 'left';
        }
        if(imgurl == '') imgurl = 'assets/img/default.png';
        payload = '\
<li class="media">\
<div class="media-body">\
<div class="media">\
<a class="pull-' + dir + '">\
<img class="media-object img-circle " src="' + imgurl + '">\
</a>\
<div class="media-body text-' + dir + '">\
' + $msg + '<br>\
<small class="text-muted">' + $extmsg + '</small>\
<hr>\
</div>\
</div>\
</div>\
</li>\
';
        $("#chatbox-list").append(payload);
        setTimeout(function () {
            $("#chatbox-list").scrollTop(100000)
        }, 100);
    }

    function append_fiend($name, $imgurl) {
        if($imgurl == '') $imgurl = 'assets/img/default.png';
        payload = '\
<li class="media">\
<div class="media-body">\
<div class="media">\
<btn class="pull-left" href="#">\
<img class="media-object img-circle" style="max-height:40px;"\
 src="' + $imgurl + '"/>\
</btn>\
<div class="media-body">\
<btn>\
<h5 class="username">' + $name + '</h5>\
</btn>\
<delbtn>\
<a href="#" class="text-muted del_friend_btn" style="text-decoration: none; font-size: smaller;">发好人卡</a>\
</delbtn>\
</div>\
</div>\
</div>\
</li>\
';
        $("#friend-list").append(payload);
    }

    function refresh_friendlist() {
        $("#friend-list").empty();
        $.ajax(
            {
                type: 'GET',
                url: 'friends.php?method=getfriends',
                dataType: 'json'
            })
            .done(function (data) {
                $.each(data, function (id, piece) {
                    append_fiend(piece.username, piece.pic);
                })
            });
    }

    function chatfresh() {
        setInterval(function () {
            $.ajax(
                {
                    type: 'POST',
                    url: 'message.php?method=get',
                    data: {'with': current_friend},
                    dataType: 'json'
                })
                .done(function (data) {
                    $.each(data, function (id, piece) {
                        if (!$.isEmptyObject(piece)) {
                            if (piece.fromuser == current_username) type = 'me';
                            else type = 'others';
                            append_msg(type, piece.content, piece.time);
                        }
                    })
                });
        }, 500);
    }

    function chatreset() {
        $.ajax(
            {
                type: 'GET',
                url: 'message.php?method=reset',
                dataType: 'json'
            });
    }

    chatreset();
    refresh_friendlist();
    append_msg('others', '⁽⁽٩(๑˃̶͈̀ ᗨ ˂̶͈́)۶⁾⁾ 欢迎使用本系统！ ', '2016-03-31 00:00:00');
    chatfresh();

})(jQuery);
