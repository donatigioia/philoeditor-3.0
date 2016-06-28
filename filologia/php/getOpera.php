<?php
/*function fixPath($path)
{
	$found=false;
	$newV=array();
	foreach ($path as $i=>$x)
	{
		if ($found)
			$newV[]=$x;
		else if ($x==="filologia"){
			$found=true;
			$newV[]=$x;
		}
	}
	return("/".implode("/",$newV));
}
*/
error_reporting(E_ALL); ini_set('display_errors', 1);
$dir="../files";
$iterator=new DirectoryIterator($dir);
$operas=array();
foreach ($iterator as $opera){//per ogni opera
	if( substr( $opera->getFileName() ,0,1 ) != '.'){
		$metadir=$opera->getPath()."/".$opera->getFileName()."/00 - Metadata";
		$style=json_decode(file_get_contents($metadir."/style.json"));
		$header=json_decode(file_get_contents($metadir."/header.json"));
		$o=array("header"=>$header,"style"=>$style,"path"=>$opera->getPath()."/".$opera->getFileName());
		$operas[]=$o;
	}
}
echo json_encode($operas);
?>
