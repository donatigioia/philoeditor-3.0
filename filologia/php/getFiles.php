<?PHP
error_reporting(E_ALL); ini_set('display_errors', 1);
////////////////////////////
////////////////////////////
//IL CODICE INIZIA A RIGA 75	
////////////////////////////
////////////////////////////
function updateInfodoc($dir)
{
	foreach ($dir as $item)
	{
		 if(substr($item->getFileName(),0,2)=== "00"){
		   return $item->getPath()."/".$item->getFileName()."/infoDoc.json";
		}
	}
}
function deepDir($dir = null, $func = null, $ignore=0,$infoDoc) { //Prova ad eseguire a mano la funzione deepDir su una directory assumendo di averle passato NULL come $func.
	$id=0;
	if ($func === null) { //non ho passato una funzione: userò semplicemente i nomi dei file nel JSON.

		$func = function($info) {
			return $info->getFileName() ;
		} ;
	}

	$files = array() ; //questo sarà il JSON finale che viene ritornato
	$iterator = new DirectoryIterator($dir); //DirectoryIterator è una classe di PHP. Prende una directory e costruisce un array di oggetti di tipo DirEntity.
	if (updateInfodoc($iterator)) //need to update infodoc
		$infoDoc=updateInfodoc($iterator);
	foreach ( $iterator as $item ) {
		$filename = $item->getFileName() ; //per prima cosa prende il nome del file
		if( substr( $filename ,0,1 ) != '.') { //se il file non inizia per . (non è un file nascosto). Guardati la funzione substr di PHP se non capisci questa riga.
			if(substr($filename,0,2)!== "00"){
				$roba = $func($item, $item->isDir(), $ignore,$infoDoc) ; //roba ora contiene la "rappresentazione JSON" del file. Se ho usato la funzione null, conterrà 
										//semplicemente il nome del file.
				if ($item->isDir() ) { //easy: se è una directory vado ricorsivamente sulle sottodirectory.
					$content = deepDir($dir.DIRECTORY_SEPARATOR.$filename, $func, $ignore,$infoDoc) ;
					$roba['content'] = $content ; //e metto la sottodirectory nel campo content.
				}
				$files[] = $roba ; //L'operatore []= vuol dire push. Quindi se v è un vettore scrivere v[]=5 vuol dire "pusha 5 dentro v".
			}
		}
	}
	return $files;
}

//OK. Cerca di capire fino a qui e per ora non preoccuparti della funzione convert. Diciamo che la parte importante è questa.
//Della funzione convert ti basta sapere che ritorna un array informativo sul file che gli hai passato. L'array informativo contiene informazioni sul percorso,
//sull'autore e sull'ordine.
/* 
		dir:  01 - Nome directory
    file: Nome file - versione . estensione
*/

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



$dir = '../files' ; //dir ora contiene la cartella su cui creare il JSON
$dirContent = deepDir($dir, $convert,1,"") ; //la funzione deepDir converte una directory nella struttura dati corrispondente (che diventerà poi il JSON finale).
//la funzione deepDir prende in input due parametri: $dir (la directory su cui lavorare), $convert (la funzione da usare sui singoli file) e un booleano che non so ancora cosa faccia XD.
//Il senso del parametro convert è questo: alla fine la deepDir prende una directory e la trasforma in un JSON. Il punto è: cosa deve fare con i singoli elementi?
//Se ad esempio ho una directory dir0 che contiene
//file1, file2, file3, file4 e dir1
//E dir1 contiene a sua volta
//file5 file6 file7
//Una rappresentazione JSON sensata potrebbe essere {"dir0":"["file1","file2","file3","file4","dir1":["file5","file6","file7"]]"}.
//In questo caso la funzione convert restituisce semplicemente i nomi dei file che poi vengono messi nel json. Convert al posto di "file1" poteva restituire a sua volta
//una struttura fatta come {"filename":"file1","owner":"root","size":"20mb"}. Per dire una cazzata.
//Quindi in sostanza deepDir si occupa di costruire il json "ad albero" corrispondente alla directory, "convert" si occupa di cosa mettere nei singoli file.
//Per capire bene ti consiglio di passare "null" al posto di $convert e guardare come cambia il JSON (ricorda che se passi NULL come funzione viene usata semplicemente getFileName.)
$return = stripslashes(json_encode($dirContent)) ; //la funzione stripslashes toglie l'escape dei caratteri (ad esempio se c'è "Ciao\ belli come state\?" diventa "Ciao belli come state?". Quindi questo comando crea un json senza escape.
echo $return ;

?>

