<?php
header('Content-Type:application/json');

@$phone = $_REQUEST['phone'];

if(empty($phone))
{
    echo '[]';
    return;
}

require('init.php');

$sql = "SELECT case_order.oid,case_order.addr,case_order.order_time,case_order.user_name,case_dish.img_sm,case_dish.did FROM case_dish,case_order WHERE case_order.phone=$phone AND case_order.did=case_dish.did";
$result = mysqli_query($conn,$sql);

$output = [];
while(true){
    $row = mysqli_fetch_assoc($result);
    if(!$row)
    {
        break;
    }
    $output[] = $row;
}

echo json_encode($output);

?>




