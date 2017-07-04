<?php
/**
 * Created by PhpStorm.
 * User: shzha
 * Date: 2016/12/28
 * Time: 4:28
 */
session_start();
include 'dbconfig.php';

switch($_GET['method'])
{
    case 'get':
        if(empty($_REQUEST['with']))
        {
            echo "[]";
            unset($_SESSION['lastmsgid']);
            exit;
        }
        $stmt = $DBH->prepare('SELECT * FROM message WHERE fromuser = ? AND touser = ?
                               UNION SELECT * FROM message WHERE touser = ? AND fromuser = ?
                               ORDER BY ID ASC;');
        $stmt->execute([$_REQUEST['with'], $_SESSION['username'],$_REQUEST['with'], $_SESSION['username']]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $last = end($data);
        if(isset($_SESSION['lastuser']) and $_SESSION['lastuser'] != $_REQUEST['with'])
            unset($_SESSION['lastmsgid']);
        if(isset($_SESSION['lastmsgid']))
        {
            if($last['ID'] <= $_SESSION['lastmsgid'] )
                $data = [];
            else $data = [$last];
        }
        $_SESSION['lastmsgid'] = $last['ID'];
        $_SESSION['lastuser'] = $_REQUEST['with'];
        echo json_encode($data);
        exit;
        break;
    case 'send':
        $stmt = $DBH->prepare('INSERT INTO message (fromuser, touser, content) VALUES (?, ?, ?);');
        $stmt->execute([$_SESSION['username'],$_REQUEST['to'],$_REQUEST['content']]);
        if($stmt->rowCount() > 0)
            jsonret(200,'发送成功！');
        else jsonret(500,'发送失败！');
        break;
    case 'reset':
        unset($_SESSION['lastmsgid']);
        jsonret(200,'OK');
}

function jsonret($code, $message)
{
    echo json_encode(['code'=>$code, 'message'=>$message]);
    exit;
}