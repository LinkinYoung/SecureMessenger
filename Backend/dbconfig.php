<?php
/**
 * Created by PhpStorm.
 * User: shzha
 * Date: 2016/12/28
 * Time: 4:27
 */
$db_username = 'chat';
$db_password = 'KvtL7ELkblOk98me';
$db_database = 'chat';
$db_host = 'localhost';

try{
    $DBH = new PDO("mysql:host=$db_host;dbname=$db_database;", $db_username, $db_password,
        array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"));
} catch (PDOException $e) {
    print 'Database Error. Please contact supporter!';
    print $e;
    die();
}

