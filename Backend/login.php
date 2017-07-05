<?php
/**
 * Created by PhpStorm.
 * User: shzha
 * Date: 2017/07/02
 * Time: 3:50
 */
include 'dbconfig.php';
session_start();

// When register an account.
if (isset($_GET['reg'])) {
    // Save the icon file of the user.
    if (isset($_FILES['pic_upload']) and basename($_FILES['pic_upload']['name']) != '') {
        $filename = bin2hex(openssl_random_pseudo_bytes(15));
        $uploaddir = getcwd() . '/assets/img/';
        $uploadfile = $uploaddir . $filename;
        move_uploaded_file($_FILES['pic_upload']['tmp_name'], $uploadfile);
        $picurl = 'assets/img/' . $filename;
    } // When user didn't set a picture.
    else $picurl = '';

    try {
        // Generate password salt.
        $password_salt = bin2hex(openssl_random_pseudo_bytes(10));
        $user_password_hashed = hash('sha256', $_POST['password'] . $password_salt);

        // Save user register data.
        $stmt = $DBH->prepare('INSERT INTO users (username, password, salt, pic, mobile, status) VALUES (?, ?, ?, ?, ?, ?);');
        $stmt->execute([$_POST['username'], $user_password_hashed, $password_salt, $picurl, $_POST['tel'], 'inactive']);

        // When register success.
        if ($stmt->rowCount() > 0)
            jsonret(201, '注册成功！请登陆！');
    } catch (PDOException $e) {
        // Return the exception information.
        jsonret(501, 'Database Error. Please contact supporter!');
    }
    // When there is no database failure but still failed, the username might be taken.
    jsonret(411, '用户名已经被使用，请尝试其他用户名！');
    exit;
}


// When trying to login an account.
if (isset($_POST['username'])) {
    try {
        // Save the client data into session.
        $_SESSION['pubKey'] = $_POST['pubKey'];
        $_SESSION['deviceIP'] = $_POST['deviceIP'];
        $_SESSION['deviceName'] = $_POST['deviceName'];
        $_SESSION['devicePort'] = $_POST['devicePort'];

        // Get the password salt from the database.
        $stmt = $DBH->prepare("SELECT salt FROM users WHERE username= ?;");
        $stmt->execute([$_POST['username']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        // Calculate the hashed password.
        $password_salt = $result['salt'];
        $user_password_hashed = hash('sha256', $_POST['password'] . $password_salt);

        // Verification the username and hashed password.
        $stmt = $DBH->prepare('SELECT * FROM users WHERE username = ? AND password = ?;');
        $stmt->execute([$_POST['username'], $user_password_hashed]);

        if ($stmt->rowCount() > 0) {
            // When the username and the password meets.
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            $account_status = $data['status'];

            switch ($account_status) {
                case 'deactive':
                    jsonret(413, '账户被锁定！');
                    break;
                case 'inactive':
                    $_SESSION['mobile'] = $data['mobile'];
                    $_SESSION['username_onhold'] = $_POST['username'];
                    jsonret(412, '账户未激活！');
            }

            // Set user's avatar url.
            setcookie('imgurl', $data['pic']);

            // Store the client information.
            $stmt = $DBH->prepare("SELECT * FROM login_status WHERE username = ? AND PubKey = ? AND DeviceIP = ? AND DeviceName = ?;");
            /* Old SQL stmt.
            $stmt = $DBH->prepare("
    INSERT INTO login_status (username, PubKey, DeviceIP, DeviceName, DevicePort, status)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY
      UPDATE status = 'active';
      ")；
            */
            $stmt->execute([$_POST['username'], $_POST['pubKey'], $_POST['deviceIP'], $_POST['deviceName']]);

            if ($stmt->rowCount() > 0) {
                // When using the old device.
                // Update status to active.
                $stmt = $DBH->prepare("UPDATE login_status SET status = 'active', DevicePort = ?, updated_at = CURRENT_TIMESTAMP WHERE PubKey = ? AND DeviceIP = ?;");
                $stmt->execute([$_POST['devicePort'], $_POST['pubKey'], $_POST['deviceIP']]);
                if ($stmt->rowCount() <= 0)
                    jsonret(403, '设备登记错误！');
                $_SESSION['username'] = $_POST['username'];
                jsonret(200, '登录成功！');
            } else {
                // When meet a new device.
                $_SESSION['mobile'] = $data['mobile'];
                $_SESSION['username_onhold'] = $_POST['username'];
                jsonret(402, '新设备，将进行多步认证！');
            }
        } else
            // When not.
            jsonret(401, '用户名或密码错误！');


    } catch (PDOException $e) {
        // Handle the database exception.
        jsonret(501, 'Database Error. Please contact supporter!');
        die();
    }
}

function jsonret($code, $message)
{
    echo json_encode(['code' => $code, 'message' => $message]);
    exit;
}
