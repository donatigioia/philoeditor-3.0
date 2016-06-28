<?PHP
$fileStats=$_GET['path']."/00 - Metadata/stats.json";

$ok= file_get_contents($fileStats);
if(!$ok){
	http_response_code(500);
	exit;
}
else
	echo $ok;

