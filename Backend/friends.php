<?php
/**
 * Created by PhpStorm.
 * User: shzha
 * Date: 2016/12/28
 * Time: 7:01
 */
session_start();
if (empty($_SESSION['username']))
    jsonret(499, '非法请求！');

include 'dbconfig.php';
switch ($_GET['method']) {
    case 'addfriend':
        try {
            // Determine the existence of the target user.
            $stmt = $DBH->prepare('SELECT * FROM users WHERE username = ?;');
            $stmt->execute([$_REQUEST['username']]);
            if ($stmt->rowCount() > 0) {
                // When exist
                // Determine if already become friends.
                $stmt = $DBH->prepare('SELECT * FROM friends WHERE `src` = ? AND `dest` = ?;');
                $stmt->execute([$_SESSION['username'], $_REQUEST['username']]);
                if ($stmt->rowCount() > 0)
                    jsonret(422, '已经成为好友！');

                // Add relationship between each other.
                $stmt = $DBH->prepare('INSERT INTO friends (src, dest) VALUES (?, ?);');
                $stmt->execute([$_SESSION['username'], $_REQUEST['username']]);
                if ($stmt->rowCount() <= 0)
                    throw new Exception('insert error');
                $stmt->execute([$_REQUEST['username'], $_SESSION['username']]);
                if ($stmt->rowCount() <= 0)
                    throw new Exception('insert error');
            } else
                jsonret(421, '用户不存在！');
        } catch (PDOException $e) {
            jsonret(501, 'Database Error. Please contact supporter!');
            die();
        }
        jsonret(200, '添加成功！');
        break;
    case 'getfriends':
        try {
            // Update online status. (Heartbeat)
            $stmt = $DBH->prepare("UPDATE login_status SET `status` = 'active', `updated_at` = CURRENT_TIMESTAMP WHERE username = ? AND PubKey = ? AND DeviceIP = ?;");
            $stmt->execute([$_SESSION['username'], $_SESSION['pubKey'], $_SESSION['deviceIP']]);

            // Set those who goes offline as inactive.
            $stmt = $DBH->exec("UPDATE login_status SET `status` = 'inactive' WHERE updated_at < (CURRENT_TIMESTAMP - 5);");

            $stmt = $DBH->prepare("
SELECT friends.dest AS username, users.pic AS pic, login_status.status AS status, login_status.DeviceIP AS deviceIP, 
       login_status.DevicePort AS devicePort, login_status.PubKey AS pubKey
FROM friends 
    LEFT JOIN users ON friends.dest = users.username 
    LEFT JOIN login_status ON friends.dest = login_status.username AND login_status.status = 'active'
WHERE friends.src = ?
ORDER BY login_status.status DESC, friends.dest ASC;
");
            $stmt->execute([$_SESSION['username']]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            jsonret(501, 'Database Error. Please contact supporter!');
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
            jsonret(599, $e->getMessage());
        }
        jsonret(200, '删除成功！');
}

function jsonret($code, $message)
{
    echo json_encode(['code' => $code, 'message' => $message]);
    exit;
}