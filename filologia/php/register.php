<?php
$file = '../data/hidden/users.json' ;
$data=json_decode(file_get_contents("php://input")); // in data ho oggetto con campi del form 
$users = json_decode(file_get_contents($file),true) ; // in users ho oggetto con dati database.

if (!$users){
	http_response_code(501);
	exit;
}
$response=array();


$user_name=$data->userName;
$user=check_user($users,$user_name);

if(!$user){
	$response['result']="user_exist";
}
else{
	$nome=$data->nome;		
	$cognome=$data->cognome;
	$sesso=$data->gender;
	$pwd=$data->pwd1;
	$users[]=array("name" => $user_name, "pwd" => $pwd,"showAs"=>$nome." ".$cognome,"gender"=>$sesso);
//	print_r($users);

	var $ok=file_put_contents($file, json_encode($users,JSON_PRETTY_PRINT),true);		
	if(!$ok){
		http_response_code(501);
		exit;
	}
	else	
		$response["result"]="ok";
	
	$msg="Nuova registrazione su philoeditor da parte di ".$nome." ".$cognome." "."con nome utente"." ".$user_name." .";
	mail("donatigioia@gmail.com","Philoeditor:nuova registrazione",$msg);
}

	echo json_encode($response);


function check_user($users, $user_name) {
	$user_match = search_key($users, 'name', $user_name) ; 
	if (count($user_match) != 1) {//non c'è utente
		return 1;
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
