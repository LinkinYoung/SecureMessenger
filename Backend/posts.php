<?php
/**
 * Created by PhpStorm.
 * User: shzha
 * Date: 2016/12/28
 * Time: 16:51
 */
session_start();
include 'dbconfig.php';

switch($_GET['method'])
{
    case 'get':
        try {
            $stmt = $DBH->prepare('
SELECT posts.ID, friends.dest AS username, users.pic AS userpic,
       posts.pic AS postpic, posts.content, posts.thumb, posts.time 
FROM posts 
LEFT JOIN friends ON friends.dest = posts.username 
LEFT JOIN users ON friends.dest = users.username 
WHERE friends.src = ?
UNION SELECT posts.ID, posts.username, users.pic, posts.pic, 
             posts.content, posts.thumb, posts.time 
FROM posts
LEFT JOIN users ON posts.username = users.username
WHERE posts.username = ?
ORDER BY ID DESC;');
            $stmt->execute([$_SESSION['username'], $_SESSION['username']]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
        } catch (PDOException $e) {
            jsonret(500, 'Database Error. Please contact supporter!');
            die();
        }
        break;
    case 'send':
        if(isset($_FILES['pic_upload']) and basename($_FILES['pic_upload']['name'])!='')
        {
            $uploaddir = 'G:/xampp/php7/htdocs/chat/assets/img/';
            $uploadfile = $uploaddir . basename($_FILES['pic_upload']['name']);
            move_uploaded_file($_FILES['pic_upload']['tmp_name'], $uploadfile);
            $picurl = 'assets/img/' . basename($_FILES['pic_upload']['name']);
        }
        else $picurl = '';
        $stmt = $DBH->prepare('INSERT INTO posts (username, content, pic) VALUES (?, ?, ?);');
        $stmt->execute([$_SESSION['username'],$_REQUEST['content'],$picurl]);
        if($stmt->rowCount() > 0)
            jsonret(200,'发送成功！');
        else jsonret(500,'发送失败！');
        break;
    case 'thumb':
        $stmt = $DBH->prepare('UPDATE posts SET thumb = thumb + 1 WHERE ID=?;');
        $stmt->execute([$_REQUEST['ID']]);
        if($stmt->rowCount() > 0)
            jsonret(200,'成功！');
        else jsonret(500,'失败！');
        break;
}
function jsonret($code, $message)
{
    echo json_encode(['code'=>$code, 'message'=>$message]);
    exit;
}