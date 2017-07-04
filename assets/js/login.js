const remote = require('electron').remote;
const app = remote.app;
const fs = require('fs');
const cipher = require('jsrsasign');
const os = require('os');

(function($) {
    "use strict";

    // Options for Message
    //----------------------------------------------
    var options = {
        'btn-loading': '<i class="fa fa-spinner fa-pulse"></i>',
        'btn-success': '<i class="fa fa-check"></i>',
        'btn-error': '<i class="fa fa-remove"></i>',
        'msg-success': 'All Good! Redirecting...',
        'msg-error': 'Wrong login credentials!',
        'useAJAX': true,
    };

    // Key paire and device info
    //----------------------------------------------
    var keyPaire = {
        prvKeyObj: {},
        pubKeyObj: {},
        pemPublic: "",
        pemPrivate: ""
    }
    var deviceInfo = {
        name: os.hostname(),
        port: remote.getGlobal("port")
    }

    // Login Form
    //----------------------------------------------
    // Validation
    $("#login-form").validate({
        rules: {
            lg_username: "required",
            lg_password: "required",
        },
        errorClass: "form-invalid"
    });

    // Form Submission
    $("#login-form").submit(function() {
        remove_loading($(this));

        var username = $("#lg_username").val();
        var password = $("#lg_password").val();
        var userPath = app.getPath("userData") + '/document/' + username;
        try {
            keyPaire.pemPrivate = fs.readFileSync(userPath + '/private.pem', 'utf8');
            keyPaire.pemPublic = fs.readFileSync(userPath + '/public.pem', 'utf8');
            keyPaire.prvKeyObj = cipher.KEYUTIL.getKeyFromEncryptedPKCS8PEM(keyPaire.pemPrivate, password);
            keyPaire.pubKeyObj = cipher.KEYUTIL.getKey(keyPaire.pemPublic);
            localStorage.pemPrivate = cipher.KEYUTIL.getPEM(keyPaire.prvKeyObj, "PKCS8PRV");
            localStorage.pemPublic = keyPaire.pemPublic;
        } catch (e) {
            alert(e.message);
            try {
                try {
                    fs.mkdirSync(userPath);
                } catch (direxists) {

                }
                var privFile = fs.openSync(userPath + '/private.pem', 'w');
                var pubFile = fs.openSync(userPath + '/public.pem', 'w');
                keyPaire = cipher.KEYUTIL.generateKeypair("EC", "secp256r1");
                keyPaire.pemPrivate = cipher.KEYUTIL.getPEM(keyPaire.prvKeyObj, "PKCS8PRV", password);
                fs.writeSync(privFile, keyPaire.pemPrivate);
                keyPaire.pemPublic = cipher.KEYUTIL.getPEM(keyPaire.pubKeyObj);
                fs.writeSync(pubFile, keyPaire.pemPublic);
                localStorage.pemPrivate = cipher.KEYUTIL.getPEM(keyPaire.prvKeyObj, "PKCS8PRV");
                localStorage.pemPublic = keyPaire.pemPublic;
            } catch (error) {
                alert("创建密钥失败" + error.message);
            }
        }
        $("#lg_pubKey").val(keyPaire.pemPublic);
        $("#lg_deviceName").val(deviceInfo.name);
        $("#lg_devicePort").val(deviceInfo.port);

        
        dummy_submit_form($(this),'login');
        return false;
    });

    // Register Form
    //----------------------------------------------
    // Validation
    $("#register-form").validate({
        rules: {
            reg_username: "required",
            reg_password: {
                required: true,
                minlength: 5
            },
            reg_password_confirm: {
                required: true,
                minlength: 5,
            },
            reg_email: {
                required: true,
                email: true
            },
            reg_agree: "required",
        },
        errorClass: "form-invalid",
        errorPlacement: function( label, element ) {
            if( element.attr( "type" ) === "checkbox" || element.attr( "type" ) === "radio" ) {
                element.parent().append( label ); // this would append the label after all your checkboxes/labels (so the error-label will be the last element in <div class="controls"> )
            }
            else {
                label.insertAfter( element ); // standard behaviour
            }
        }
    });

    var files;

    $('input[type=file]').on('change', prepareUpload);

    function prepareUpload(event)
    {
        files = event.target.files;
    }

    // Form Submission
    $("#register-form").submit(function() {
        remove_loading($(this));

        var username = $("#reg_username").val();
        var password = $("#reg_password").val();
        var userPath = app.getPath("userData") + '/document/' + username;
        try {
                try {
                    fs.mkdirSync(userPath);
                } catch (direxists) {

                }
                var privFile = fs.openSync(userPath + '/private.pem', 'w');
                var pubFile = fs.openSync(userPath + '/public.pem', 'w');
                keyPaire = cipher.KEYUTIL.generateKeypair("EC", "secp256r1");
                keyPaire.pemPrivate = cipher.KEYUTIL.getPEM(keyPaire.prvKeyObj, "PKCS8PRV", password);
                fs.writeSync(privFile, keyPaire.pemPrivate);
                keyPaire.pemPublic = cipher.KEYUTIL.getPEM(keyPaire.pubKeyObj);
                fs.writeSync(pubFile, keyPaire.pemPublic);
                localStorage.pemPrivate = cipher.KEYUTIL.getPEM(keyPaire.prvKeyObj, "PKCS8PRV");
                localStorage.pemPublic = keyPaire.pemPublic;
        } catch (error) {
            alert("创建密钥失败" + error.message);
        }
        $("#reg_pubKey").val(keyPaire.pemPublic);
        $("#reg_deviceName").val(deviceInfo.name);
        $("#reg_devicePort").val(deviceInfo.port);

        dummy_submit_form($(this),'reg');
        return false;
    });

    // Loading
    //----------------------------------------------
    function remove_loading($form)
    {
        $form.find('[type=submit]').removeClass('error success');
        $form.find('.login-form-main-message').removeClass('show error success').html('');
    }

    function form_loading($form)
    {
        $form.find('[type=submit]').addClass('clicked').html(options['btn-loading']);
    }

    function form_success($form, $msg)
    {
        $form.find('[type=submit]').addClass('success').html(options['btn-success']);
        $form.find('.login-form-main-message').addClass('show success').html($msg);
    }

    function form_failed($form, $msg)
    {
        $form.find('[type=submit]').addClass('error').html(options['btn-error']);
        $form.find('.login-form-main-message').addClass('show error').html($msg);
    }

    // Dummy Submit Form (Remove this)
    //----------------------------------------------
    // This is just a dummy form submission. You should use your AJAX function or remove this function if you are not using AJAX.
    function dummy_submit_form($form, $type)
    {
        if($form.valid())
        {
            form_loading($form);
            var mixedData = new FormData($form[0]);
            switch ($type)
            {
                case 'login':
                    $.ajax(
                        {
                            type: 'POST',
                            url: 'https://sm.moemoe.tech/login.php',
                            data: mixedData,
                            dataType: 'json'
                        })
                        .done(function (data) {
                            if(data.code < 300)
                            {
                                Cookies.set('username',$("#lg_username").val());
                                setTimeout(function() {form_success($form, data.message);}, 500);
                                setTimeout(function() {location.href = 'chat.html';}, 1000);
                            }
                            else setTimeout(function() {form_failed($form, data.message);}, 500);
                        });
                    break;
                case 'reg':
                    $.ajax(
                        {
                            type: 'POST',
                            url: 'https://sm.moemoe.tech/login.php?reg=1',
                            data: mixedData,
                            dataType: 'json',
                            async: false,
                            cache: false,
                            contentType: false,
                            processData: false
                        })
                        .done(function (data) {
                            if(data.code < 300)
                            {
                                setTimeout(function() {form_success($form, data.message);}, 500);
                                setTimeout(function() {$("#goto_login_button").click();}, 1000);
                            }
                            else setTimeout(function() {form_failed($form, data.message);}, 500);
                        });
                    break;
            }

        }
    }

})(jQuery);