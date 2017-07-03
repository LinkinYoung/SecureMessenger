<?php
/**
 * Created by PhpStorm.
 * User: shzha
 * Date: 2016/12/20
 * Time: 15:19
 */
session_start();
if(!isset($_SESSION['username']))
{
    header('Location: login.php');
    exit;
}
else
{
    header('Location: chat.php');
    exit;
}