/**
 * Created by shzha on 2016/12/28.
 */
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

        if(options['useAJAX'] == true)
        {
            // Dummy AJAX request (Replace this with your AJAX code)
            // If you don't want to use AJAX, remove this
            dummy_submit_form($(this),'login');

            // Cancel the normal submission.
            // If you don't want to use AJAX, remove this
            return false;
        }
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

        if(options['useAJAX'] == true)
        {
            // Dummy AJAX request (Replace this with your AJAX code)
            // If you don't want to use AJAX, remove this
            dummy_submit_form($(this),'reg');

            // Cancel the normal submission.
            // If you don't want to use AJAX, remove this
            return false;
        }
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
            switch ($type)
            {
                case 'login':
                    $.ajax(
                        {
                            type: 'POST',
                            url: 'login.php',
                            data: $form.serialize(),
                            dataType: 'json'
                        })
                        .done(function (data) {
                            if(data.code < 300)
                            {
                                Cookies.set('username',$("#lg_username").val());
                                setTimeout(function() {form_success($form, data.message);}, 500);
                                setTimeout(function() {location.href = 'index.php';}, 1000);
                            }
                            else setTimeout(function() {form_failed($form, data.message);}, 500);
                        });
                    break;
                case 'reg':
                    var formData = new FormData($form[0]);
                    $.ajax(
                        {
                            type: 'POST',
                            url: 'login.php?reg=1',
                            data: formData,
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