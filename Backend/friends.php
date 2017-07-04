<?php
/**
 * Created by PhpStorm.
 * User: shzha
 * Date: 2016/12/28
 * Time: 7:01
 */
session_start();
if (!isset($_SESSION['username'])) {
    header('Location: login.php');
    exit;
}

include 'dbconfig.php';
switch ($_GET['method']) {
    case 'addfriend':
        try {
            $stmt = $DBH->prepare('SELECT * FROM user WHERE username = ?;');
            $stmt->execute([$_REQUEST['username']]);
            if ($stmt->rowCount() > 0)
            {
                $stmt = $DBH->prepare('SELECT * FROM friends WHERE `src` = ? AND `dest` = ?;');
                $stmt->execute([$_SESSION['username'], $_REQUEST['username']]);
                if ($stmt->rowCount() > 0)
                    jsonret(400, '已经成为好友！');
                $stmt = $DBH->prepare('INSERT INTO friends (src, dest) VALUES (?, ?);');
                $stmt->execute([$_SESSION['username'], $_REQUEST['username']]);
                if ($stmt->rowCount() <= 0)
                    throw new Exception('insert error');
                $stmt->execute([$_REQUEST['username'], $_SESSION['username']]);
                if ($stmt->rowCount() <= 0)
                    throw new Exception('insert error');
            }
            else
                jsonret(400, '用户不存在！');
        } catch (PDOException $e) {
            jsonret(500, 'Database Error. Please contact supporter!');
            die();
        }
        jsonret(200, '添加成功！');
        break;
    case 'getfriends':
        try {
            $stmt = $DBH->prepare('SELECT dest AS username, pic FROM friends LEFT JOIN user ON friends.dest = user.username WHERE src = ?;');
            $stmt->execute([$_SESSION['username']]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            jsonret(500, 'Database Error. Please contact supporter!');
            die();
        }
        //var_dump($data);
        echo json_encode($data);
        break;
    case 'deletefriend':
        try {
            $stmt = $DBH->prepare('DELETE FROM friends WHERE `src` = ? AND `dest` = ?;');
            $stmt->execute([$_SESSION['username'], $_REQUEST['username']]);
            if ($stmt->rowCount() <= 0)
                throw new Exception('del error');
            $stmt->execute([$_REQUEST['username'], $_SESSION['username']]);
            if ($stmt->rowCount() <= 0)
                throw new Exception('del error');
        } catch (Exception $e) {
            jsonret(500, $e->getMessage());
        }
        jsonret(200,'删除成功！');
}

function jsonret($code, $message)
{
    echo json_encode(['code' => $code, 'message' => $message]);
    exit;
}