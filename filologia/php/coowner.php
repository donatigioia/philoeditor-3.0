<?php

//ini_set('display_errors', 1);
//ini_set('display_startup_errors', 1);
//error_reporting(E_ALL);

$file = '../data/hidden/users.json' ;
$users = json_decode(file_get_contents($file),true) ;

$fileDoc='../data/infoDoc.json';
$infoDoc = json_decode(file_get_contents($fileDoc),true) ;

$response=array();

$data=json_decode(file_get_contents("php://input"));
$user=$data->owner->name;
$doc=$data->document;
$newOwner=$data->coowner;
$id=$data->document->id;
$owner=check_owner($doc->authors,$user);
if($owner){//sono un autore del documento
	$coowner=check_owner($doc->authors,$newOwner);
	if(!$coowner){//coownern non è già autore del documento
		//controllo che coowner sia un utente registrato
		$regUser=check_user($users,$newOwner);
		if(!$regUser){//utente registrato
			$addOwner=search_key($infoDoc,'id',$doc->id);	
			foreach($infoDoc as $key=>$value){
				if($value['id'] == $id){
					$infoDoc[$key]['authors'][]=$newOwner;
				}
			}
			$c=file_put_contents($fileDoc, json_encode($infoDoc,JSON_PRETTY_PRINT));			
			$response["result"]="ok";			
		}
		else{
			$response["result"]="no_user";
		}
	}
	else{
		$response["result"]="already_owner";
	}
}
else
{
	$response["result"]="no_owner";
}

echo json_encode($response);

function check_owner($d,$u) {
	foreach ($d as $rec) {
		if($rec == $u){
			return 1;
		}
	}	
	return 0;   
}

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
