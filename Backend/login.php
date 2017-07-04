<?php
/**
 * Created by PhpStorm.
 * User: shzha
 * Date: 2016/12/28
 * Time: 3:50
 */
session_start();

if (isset($_GET['reg'])) {
    include 'dbconfig.php';

    if(isset($_FILES['pic_upload']) and basename($_FILES['pic_upload']['name'])!='')
    {
        $uploaddir = 'G:/xampp/php7/htdocs/chat/assets/img/';
        $uploadfile = $uploaddir . basename($_FILES['pic_upload']['name']);
        move_uploaded_file($_FILES['pic_upload']['tmp_name'], $uploadfile);
        $picurl = 'assets/img/' . basename($_FILES['pic_upload']['name']);
    }
    else $picurl = '';

    try {
        $stmt = $DBH->prepare('INSERT INTO user (username, password, pic) VALUES (?, ?, ?);');
        $stmt->execute([$_POST['username'], sha1($_POST['password']), $picurl]);
        if ($stmt->rowCount() > 0)
            jsonret(201, '注册成功！请重新登陆！');
    } catch (PDOException $e) {
        jsonret(500, 'Database Error. Please contact supporter!');
    }
    jsonret(400, '用户名已经被使用，请尝试其他用户名！');
    exit;
}

if (isset($_POST['username'])) {
    include 'dbconfig.php';
    try {
        $stmt = $DBH->prepare('SELECT * FROM user WHERE username = ? AND password = ?;');
        $stmt->execute([$_POST['username'], sha1($_POST['password'])]);
        if ($stmt->rowCount() > 0)
            $_SESSION['username'] = $_POST['username'];
        else
            jsonret(400, '用户名或密码错误！');
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        setcookie('imgurl', $data['pic']);
    } catch (PDOException $e) {
        jsonret(500, 'Database Error. Please contact supporter!');
        die();
    }
    jsonret(200, '登录成功！');
}

function jsonret($code, $message)
{
    echo json_encode(['code' => $code, 'message' => $message]);
    exit;
}
