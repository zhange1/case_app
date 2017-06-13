<?php
header('Content-Type:application/json');
$uname = $_REQUEST['uname'];
$pwd = $_REQUEST['pwd'];

if(empty($uname) || empty($pwd) ){
    echo "[]"; //若客户端提交信息不足，则返回一个空数组，
    return;    //并退出当前页面的执行
}

//访问数据库
require('init.php');

$sql = "SELECT userid FROM case_users WHERE uname='$uname' AND pwd='$pwd'";
$result = mysqli_query($conn, $sql);
$row=mysqli_fetch_assoc($result);
if($row){
    echo json_encode($row);
}else{
    echo 0;
}
?>