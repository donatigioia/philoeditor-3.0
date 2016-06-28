<?php

$file = '../data/hidden/users.json' ;
$data=json_decode(file_get_contents("php://input"));
$pwd=$data->pwd;
$username=$data->user;
$users = json_decode(@file_get_contents($file),true) ;
if (!$users)
{ 
	http_response_code(500);
	$res=array("result"=>"error");
	echo json_encode($res);
	exit();
}
$user = check_password($users, $username, $pwd) ; 
if ($user !== null) {
	session_start() ;
	$_SESSION['user'] = $user ;
	setcookie("user", base64_encode (json_encode($user)), 0, '/');
	$result["result"] = "ok";
	$result['user'] = $user ;
} else {
	session_start() ;
	unset($_COOKIE['user']) ;
	http_response_code(401);
	setcookie("user", null,0, '/');
	$result["result"]="wrong_login";
}
	
echo json_encode($result);

function check_password($u, $n, $p) {
	$users = search_key($u, 'name', $n) ; 
	if (count($users) != 1) {
		return null ;
	} else if (md5($users[0]['pwd']) == $p ){
		$return = $users[0] ;
		unset($return['pwd']) ; 
		return $return ;
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
