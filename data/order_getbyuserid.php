<?php
/**根据用户id查询订单数据**/
header('Content-Type:application/json');

$output = [];

@$userid = $_REQUEST['userid'];

if(empty($userid)){
    echo "[]"; //若客户端未提交用户id，则返回一个空数组，
    return;    //并退出当前页面的执行
}

//访问数据库
require('init.php');

$sql = "SELECT case_order.oid,case_order.userid,case_order.phone,case_order.addr,
case_order.totalprice,case_order.user_name,case_order.order_time,
case_orderdetails.did,case_orderdetails.dishcount,case_orderdetails.price,
case_dish.name,case_dish.img_sm

 from case_order,case_orderdetails,case_dish
WHERE case_order.oid = case_orderdetails.oid and case_orderdetails.did = case_dish.did and case_order.userid='$userid'";
$result = mysqli_query($conn, $sql);

$output['data'] = mysqli_fetch_all($result, MYSQLI_ASSOC);

echo json_encode($output);
?>
