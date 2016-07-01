<?PHP
/*	
 File: getFiles.php
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


function updateInfodoc($dir)
{
	foreach ($dir as $item)
	{
		 if(substr($item->getFileName(),0,2)=== "00"){
		   return $item->getPath()."/".$item->getFileName()."/infoDoc.json";
		}
	}
}
function deepDir($dir = null, $func = null, $ignore=0,$infoDoc) {
	$id=0;
	if ($func === null) { 

		$func = function($info) {
			return $info->getFileName() ;
		} ;
	}

	$files = array() ; 
	$iterator = new DirectoryIterator($dir); 
	if (updateInfodoc($iterator)) 
		$infoDoc=updateInfodoc($iterator);
	foreach ( $iterator as $item ) {
		$filename = $item->getFileName() ; 
		if( substr( $filename ,0,1 ) != '.') { 
			if(substr($filename,0,2)!== "00"){
				$roba = $func($item, $item->isDir(), $ignore,$infoDoc) ; 
									
				if ($item->isDir() ) { 
					$content = deepDir($dir.DIRECTORY_SEPARATOR.$filename, $func, $ignore,$infoDoc) ;
					$roba['content'] = $content ; 
				}
				$files[] = $roba ;
			}
		}
	}
	return $files;
}



$convert = function($info, $isDir = false, $ignore=0,$infoDoc) {
	$file  = preg_split('/\./',$info->getFileName()) ;
	$parts = preg_split('/\s*-\s*/',$file[0]) ;
	$path  = $info->getPathName() ;
	$pathParts = preg_split('/\//',$path) ;
	$pathParts = array_slice( $pathParts, $ignore, NULL, true) ;
	$path = join('/',$pathParts) ; 
	if ($isDir) {
		$ret = array(
			'order' => $parts[0],
			'label' => $parts[1],
			'path'  => $path
		) ;
	} else {
		$doc=json_decode(file_get_contents($infoDoc),true);
		$ret=$doc[$file[0]-1];
	}
	return $ret ;	
} ;

function p($s) {
	echo ('<xmp>') ;
	print_r($s) ;
	echo ('</xmp>') ;
}



$dir = '../files' ; 
$dirContent = deepDir($dir, $convert,1,"") ;
$return = stripslashes(json_encode($dirContent)) ; 
echo $return ;

?>

