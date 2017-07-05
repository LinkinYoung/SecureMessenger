const remote = require('electron').remote;
const app = remote.app;
var express = require('express');
const server = require('http').createServer();
const receiver = require('socket.io')(server);
const sender = require('socket.io-client');
const cipher = require('jsrsasign');

(function ($) {
    // Read key pairs
    //--------------------------------------------
    var keyPaire = {
        prvKeyObj: {},
        pubKeyObj: {},
        pemPublic: "",
        pemPrivate: ""
    }
    try {
        keyPaire.pemPrivate = localStorage.pemPrivate;
        keyPaire.pemPublic = localStorage.pemPublic;
        keyPaire.prvKeyObj = cipher.KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(keyPaire.pemPrivate);
        keyPaire.pubKeyObj = cipher.KEYUTIL.getKey(keyPaire.pemPublic);
    } catch (fileerr) {
        alert("读取密钥对失败");
    }


    // p2p server and client
    //--------------------------------------------
    var chatList = [];
    server.on("error", (e) => {
        alert("端口被占用，请重启app");
    })
    server.listen(remote.getGlobal("port"));
    receiver.on('connection', function(socket){
        socket.on("hello", function (data) {
            chatList[data.username].socket = socket;
            chatList[data.username].session_key = cipher.Cipher.decrypt(data.session_key);
        })
        socket.on('disconnect', function(){
            incoming = null;
        });
        socket.on("message", receive_msg);
    });
    function makeConnection(target) {
        var session_key = new Date().getTime();
        Math.random();
        session_key = session_key + new Date().getTime();
        chatList[target.username].session_key = session_key;
        target.pubKeyObj = cipher.KEYUTIL.getKey(target.pubKey);

        var socket = sender.connect('http://' + target.deviceIP + ':' + target.devicePort);
        chatList[target.username].socket = socket;
        socket.emit("hello", {
            username: current_username,
            session_key: cipher.Cipher.encrypt(session_key, target.pubKeyObj)
        });
        socket.on('message', receive_msg);
        return socket;
    }

    // viewer
    //----------------------------------------------------
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
        if (jQuery.isEmptyObject(chatList[current_friend].socket)) {
            makeConnection(chatList[current_friend]);
        }
        chatList[current_friend].history.forEach(function(element) {
            append_msg(element.type, element.message, element.extmsg);
        }, this); 
        console.log("Change to" + current_friend + ", img: " + current_friendimgurl);
    });

    $("#send_btn").click(function () {
        var encripted_message = cipher.CryptoJS.AES.encrypt($("#input_msg").val(), chatList[current_friend].session_key);
        var msg_signature = new cipher.Mac({alg: "HmacSHA1", "pass": chatList[current_friend].session_key}).updateString($("#input_msg").val()).doFinal();
        chatList[current_friend].socket.emit("message", {
            from: current_username,
            content: encripted_message,
            signature: msg_signature
        })
        append_msg('me', $("#input_msg").val(), "假装有日期时间")
        chatList[current_friend].history.push({
            type: 'me',
            message: $("#input_msg").val(),
            extmsg: "假装有日期时间"
        })
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
                    url: 'https://sm.moemoe.tech/friends.php?method=addfriend',
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
                url: 'https://sm.moemoe.tech/friends.php?method=deletefriend',
                data: {'username': todelete},
                dataType: 'json'
            })
            .done(function (data) {
                if (data.code > 300) alert(data.message);
            });
        $("#newfriend").val("");
        refresh_friendlist();
    });
    function receive_msg(data) {
        var plain_message = cipher.CryptoJS.AES.decrypt(data.content, chatList[data.from].session_key);
        var msg_signature = new cipher.Mac({alg: "HmacSHA1", "pass": chatList[current_friend].session_key}).updateString(plain_message).doFinal();
        if (msg_signature != data.signature) {
            return false;
        }
        chatList[data.from].history.push({
            type: 'other',
            message: plain_message,
            extmsg: "fake date"
        })
        if (data.from == current_friend) {
            append_msg('other', data.content, 'Fake Date');
        }
    }

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
<img class="media-object img-circle " src="https://sm.moemoe.tech/' + imgurl + '">\
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
 src="https://sm.moemoe.tech/' + $imgurl + '"/>\
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
        $.ajax(
            {
                type: 'GET',
                url: 'https://sm.moemoe.tech/friends.php?method=getfriends',
                dataType: 'json'
            })
            .done(function (data) {
                $("#friend-list").empty();
                $.each(data, function (id, piece) {
                    append_fiend(piece.username, piece.pic);
                    chatList[piece.username] = piece;
                    chatList[piece.username].socket = {};
                    chatList[piece.username].history = [];
                })
            });
    }
    setInterval(function () { refresh_friendlist(); }, 1000);
    append_msg('others', '⁽⁽٩(๑˃̶͈̀ ᗨ ˂̶͈́)۶⁾⁾ 欢迎使用本系统！ ', '2016-03-31 00:00:00');

})(jQuery);
