<?php
/*	
 File: getOpera.php
 Author: Gioia Donati, Fabio Vitali, Angelo di Iorio
 Last change on: 1/07/16



 Copyright (c) 2016, [Nome Cognome], DASPLab, Department of Computer Science, University of Bologna

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted, provided that the above
    copyright notice and this permission notice appear in all copies.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
    MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
    SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
    WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
    OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
    CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

 */
error_reporting(E_ALL); ini_set('display_errors', 1);
$dir="../files";
$iterator=new DirectoryIterator($dir);
$operas=array();
foreach ($iterator as $opera){
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
