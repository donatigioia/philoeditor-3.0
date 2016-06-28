<?php
$file = '../data/hidden/users.json' ;
$data=json_decode(file_get_contents("php://input")); 
$users = json_decode(file_get_contents($file),true) ; 

$response=array();

$pwd_old=$data->old;
$user_name=$data->nome;
$pwd_new=$data->new1;
$user = change_password($users, $user_name, $pwd_old,$pwd_new) ; 
if($user){
	foreach($users as $key=>$value){
		if(in_array($user_name,$value)){
			unset($users[$key]);
		}
	}
	$users[]=$user;
	
	file_put_contents($file,json_encode($users,JSON_PRETTY_PRINT));
	$response['result']="ok";	

}
else{
	$response['result']="false";
}

echo json_encode($response); 

function change_password($u, $n, $p,$pn) {
	$users = search_key($u, 'name', $n) ; 
	if (count($users) != 1) {
		return null ;
	} else if ($users[0]['pwd'] == $p ){
		$users[0]['pwd']=$pn;			
		return $users[0] ;
	} else {
		return null ;
	}
}

function search_key($array,$key,$value) {
	$return = array() ;
	foreach ($array as $rec) {
		if (isset($rec[$key]) && $rec[$key] == $value) {
			array_push($return, $rec) ;
		};
	}
	return $return ;
}

?>
