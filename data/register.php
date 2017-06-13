<?php

//header('Content-Type:application/json');

$phone = $_REQUEST['phone'];
$uname = $_REQUEST['uname'];
$pwd = $_REQUEST['pwd'];

if(empty($uname) || empty($phone) || empty($pwd) ){
    echo "[]"; //若客户端提交信息不足，则返回一个空数组，
    return;    //并退出当前页面的执行
}

//访问数据库
require('init.php');

$sql = "insert into case_users values(null,'$uname','$pwd','$phone')";
$result = mysqli_query($conn, $sql);
if($result){
    $oid=mysqli_insert_id($conn);
}
$oid=mysqli_insert_id($conn);
echo $oid;
?>
