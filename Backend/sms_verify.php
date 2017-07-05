<?php
/**
 * Created by PhpStorm.
 * User: shzha
 * Date: 2017/7/5
 * Time: 5:26
 */
include 'dbconfig.php';
include 'ali/TopSdk.php';
session_start();

if (empty($_SESSION['username_onhold']) || empty($_SESSION['mobile']))
    jsonret(499, '非法请求！');

if (empty($_POST['code'])) {
    // Send SMS
    // Generate SMS Verification code.
    $sms_code = rand(100000, 999999);
    $_SESSION['sms_code'] = $sms_code;
    $mobile = $_SESSION['mobile'];

    // Init Alibaba SDK.
    $c = new TopClient;
    $c->appkey = '23710111';
    $c->secretKey = 'de9167c7617062120863dd4cfd116bed';

    // Init AliDayu SDK.
    $req = new AlibabaAliqinFcSmsNumSendRequest;
    try {
        $req->setExtend("");
        $req->setSmsType("normal");
        $req->setSmsFreeSignName("北邮易班");
        $req->setSmsParam("{code:'$sms_code'}");
        $req->setRecNum($mobile);
        $req->setSmsTemplateCode("SMS_75770083");
        // Send SMS.
        //$resp = $c->execute($req);
    } catch (Exception $e) {
        jsonret(502, "短信服务故障！");
    }
    // Return Phone number and status.
    echo json_encode(['code' => 210, 'message' => "短信已发送！$sms_code", 'mobile' => substr($mobile, 0, 3) . '****' . substr($mobile, 7, 4)]);
} else {
    if ($_POST['code'] == $_SESSION['sms_code']) {
        $_SESSION['username'] = $_SESSION['username_onhold'];
        unset($_SESSION['username_onhold']);
        unset($_SESSION['mobile']);
        unset($_SESSION['sms_code']);

        try {
            // Save user active data.
            $stmt = $DBH->prepare("UPDATE users SET status = 'active' WHERE username = ?;");
            $stmt->execute([$_SESSION['username']]);

            // Save the new client info.
            $stmt = $DBH->prepare("INSERT INTO login_status (username, PubKey, DeviceIP, DeviceName, DevicePort, status) VALUES (?, ?, ?, ?, ?, ?);");
            $stmt->execute([$_SESSION['username'], $_SESSION['pubKey'], $_SESSION['deviceIP'], $_SESSION['deviceName'], $_SESSION['devicePort'], 'active']);
        } catch (PDOException $e) {
            // Return the exception information.
            jsonret(501, 'Database Error. Please contact supporter!');
        }
        jsonret(200, '验证通过！');
    }
    else jsonret(403,'短信验证码错误！');
}

function jsonret($code, $message)
{
    echo json_encode(['code' => $code, 'message' => $message]);
    exit;
}
