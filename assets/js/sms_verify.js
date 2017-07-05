const remote = require('electron').remote;
const app = remote.app;
const fs = require('fs');
const cipher = require('jsrsasign');
const os = require('os');
const ip = require("ip");

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

    $.ajax(
        {
            type: 'GET',
            url: 'https://sm.moemoe.tech/sms_verify.php',
            dataType: 'json'
        })
        .done(function (data) {
                if(data.code < 300)
                {
                    var form = $('#sms-form');
                    $('#mobile').val(data.mobile);
                    setTimeout(function() {form_success(form, data.message);}, 500);
                }
                else setTimeout(function() {form_failed(form, data.message);}, 500);
            }
        );

    // Login Form
    //----------------------------------------------
    // Validation
    $("#sms-form").validate({
        rules: {
            code: "required",
        },
        errorClass: "form-invalid"
    });

    // Form Submission
    $("#sms-form").submit(function() {
        remove_loading($(this));
        dummy_submit_form($(this),'sms');
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
                case 'sms':
                    $.ajax(
                        {
                            type: 'POST',
                            url: 'https://sm.moemoe.tech/sms_verify.php',
                            data: $form.serialize(),
                            dataType: 'json'
                        })
                        .done(function (data) {
                            if(data.code < 300)
                            {
                                setTimeout(function() {form_success($form, data.message);}, 500);
                                setTimeout(function() {location.href = 'chat.html';}, 1000);
                            }
                            else setTimeout(function() {form_failed($form, data.message);}, 500);
                        }
                    );
            }

        }
    }

})(jQuery);