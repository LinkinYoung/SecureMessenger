/**
 * Created by shzha on 2016/12/29.
 */
(function ($) {
    $("#contact-form").submit(function (e) {
        e.preventDefault();
        var formData = new FormData($(this)[0]);
        $.ajax(
            {
                type: 'POST',
                url: 'posts.php?method=send',
                data: formData,
                dataType: 'json',
                async: false,
                cache: false,
                contentType: false,
                processData: false
            })
            .done(function (data) {
                if (data.code < 300) {
                    alert('发送成功');
                    location.href = '../../activities.html';
                }
                else alert(data.message);
            });
    });
})(jQuery);