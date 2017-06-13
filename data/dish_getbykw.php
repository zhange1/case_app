<?php
header('Content-Type:application/json');

@$kw = $_REQUEST['kw'];

if(empty($kw))
{
    echo '[]';
    return;
}

require('init.php');

$sql = "SELECT did,name,price,img_sm,intro FROM case_dish WHERE name LIKE '%$kw%' OR detail LIKE '%$kw%'";
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




