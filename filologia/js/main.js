/*	
 File: main.js
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
		
		var saveType;
		var versions;

		var current = {
			mode: 'view',
			edit:false,
			view: {},
			document: {},
			documents: [],
			user: {},
			stats: {},
			opera:{},
			operas:[],
		}		

		$(document).ready(function() {
			fixWindowSize() ;
			fixLoginMenu() ;
			google.load("visualization", "1", {packages:["corechart"], "callback" : function(){ }});
			loadOpera();
			loadFileList() ;
		});

/* ***************************************************************

                  EVENT CALLBACKS

*************************************************************** */		
		$("#esportaTei").on('click',function(){
			esportaTei();
		});
		$("#coownerBtn").click(function(){
			coowner();
		});	
		$("#conferma").on('click',function(){
			changePwd();
		});
		$("#signUp").click(function(){
			signUp();
		});
		
		$(".resetPwd").on('click',function(){	
			resetForm("#pwdForm","#errorPwd")
		});
		$(".resetLogin").on('click',function(){	
			resetForm("#loginForm","#errorLogin")
		});
		$(".resetSignUp").on('click',function(){
			resetForm("#formReg","#errorSignUp");		
		});
		$(".resetCoowner").on('click',function(){
			resetForm("#shareForm","#errorShare");
		});
		$(".resetMeta").on('click',function(){
			resetForm("#metaForm","#errorMeta");
		});
		
		$('.viewVersion').on('click', function() {
			viewVersion(this)
		})
		$('#join').on('click',function() {
			join()
		})
		$('#split').on('click',function() {
			split()
		})
		$('#save').on('click',function() {
			save(this)
		})
		$('#newSave').on('click',function() {
			save(this)

		})
		$('#docs').on('click','.tree-toggle',function () {
			$(this).parent().children('ul.tree').toggle(200);
		});
		
		$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
			if (this.id!=="showView" && this.id!=="showEdit")
			{
				return;
			}
			if (current.user || this.id=="showView"){
				prepareMainArea(e.target.id)
			}
			else{
				error("Per modificare il documento è necessario loggarsi")
				$("#showView").click();
			}
		})

		$("#loginForm").on('submit', function(event) {
			login(this) ;
		});
		$("#logoutButton").on('click', function() {
			logout() ;
		});
		$('#file').on('click', 'span.nochange, span.oldVersion, span.newVersion', function(e) {
			if(current.edit)
			{
					var sel = selection()
                			var n = e.currentTarget
                			if ($(n).closest('span.editing').length == 0) {
                        			current.edit=false
                        	        	endEditing( $('span.editing') )
                		}
			}

		})
	
		$('#file').on('dblclick', 'span.nochange, span.oldVersion, span.newVersion', function(e) {
			
			beginEditing(e) 
			return false
		})
		$('#statistics').on('shown.bs.modal', function () {
			computeStatistics() 
			drawTable(false)
			$('#showTable').tab('show')
		})
		$('#showTable').on('shown.bs.tab', function () {
			drawTable(false)
		})
		$('#showItems').on('shown.bs.tab', function () {
			drawItems(false) ;
		})
		$('#showChars').on('shown.bs.tab', function () {
			drawChars(false) ;
		})
		$('#showNetChars').on('shown.bs.tab', function () {
			drawNetChars(false) ;
		})
		$('#statOp').on('click', function () {
			loadStatistics() ;
		})
		$('#showTableBook').on('shown.bs.tab', function () {
			drawTable(true)
		})
		$('#showItemsBook').on('shown.bs.tab', function () {
			drawItems(true) ;
		})
		$('#showCharsBook').on('shown.bs.tab', function () {
			drawChars(true) ;
		})
		$('#showNetCharsBook').on('shown.bs.tab', function () {
			drawNetChars(true) ;
		})

/* ***************************************************************

                     TEI

*************************************************************** */		
		function esportaTei(){
			if(!current.document.path){
				error("Aprire un documento!")
				return;
			}
			if(!current.document.tei){
				error("Esportazione impossibile!File corrotto.")
			}
			var path=(current.opera.path).split('/');
			var newPath=[];
			newPath.push(path[1]);
			newPath.push(path[2]);
			newPath=newPath.join('/');
			$.ajax({
				url:newPath+"/00 - Metadata/TEI.xsl",
				method:'GET',
				success: function(templateXsl){
					if(current.mode=="view"){
                       		 	        $('#file p').contents().filter(function(){return this.nodeType === 3}).wrap('<span class="nochange"/>');
					}
					var doc=document.createElement("a");
					$(doc).html($("#file").html());
					$("span",doc).removeClass("visibile").removeClass("visibile2");
					var parser=new DOMParser();
					var xmlDoc=parser.parseFromString("<?xml version=\"1.0\" encoding=\"UTF-8\"?><!DOCTYPE xsl:stylesheet [ <!ENTITY nbsp \"&#160;\"> ]><home>"+$(doc).html()+"</home>","text/xml");
					var resp="<respStmt xml:id=\"$id\"><resp>$resp</resp><name>$name</name></respStmt>";
					var resps="";
					var change="<change when=\"$timestamp\" who=\"$id\"/>";
					var changes="";
					$.each(current.document.tei.editionStmts, function(i,k){
						resps+=resp.tpl({id:k.id,resp:k.resp,name:k.name});
					});
					$.each(current.document.tei.revisionDesc, function(i,k){
						changes+=change.tpl({timestamp:k.when,id:k.who});
					});
					var templateXsl=new XMLSerializer().serializeToString(templateXsl);
					var xslContent=templateXsl.tpl({resp:resps,
									publisher:current.document.tei.publicationStmt.publisher,
									pubplace:current.document.tei.publicationStmt.pubPlace,
									date:current.document.tei.publicationStmt.date,
									URL:current.document.tei.publicationStmt.license,
									encoding:current.document.tei.encodingDesc,
									change:changes,
									cap:current.document.label
									});
					var xslDoc= parser.parseFromString(xslContent,"text/xml");
					var xslt=Saxon.newXSLT20Processor();
					xslt.importStylesheet(xslDoc);
					var res=xslt.transformToDocument(xmlDoc);
					var blob=new Blob([new XMLSerializer().serializeToString(res)],{type:"text/xml;charset=utf-8"});
					var autori=current.document.authors.join();
					saveAs(blob,current.document.label+"_EdizioneDi_"+autori+".xml");
					if(current.mode == 'view')
						$('p .nochange').contents().unwrap();
				},
				error:function(e,f,g){
					error("Esportazione Tei fallita!")
				}
			});
		}

/* ***************************************************************

                     SETUP

*************************************************************** */		

		function ctrl(){
			if(!current.document.path){
				$("#share").addClass("disabled");
				$('#save').addClass('disabled') ;
				$('#newSave').addClass('disabled')
			}
			else{
				$("#share").removeClass("disabled");
				$("#share").attr("data-target","#coowner")
				$("#newSave").removeClass("disabled");
				if(current.user &&  ($.inArray(current.user.name,current.document.authors)>=0))
				{
					$("#save").removeClass("disabled");
				}
				else{
				      if(!$("#save").hasClass("disabled"))
						$("#save").addClass("disabled");	
				}
				if (current.document.tei)
					$("#esportaTei").removeClass("disabled");
				else if (!($("#esportaTei").hasClass("disabled")))
					$("#esportaTei").addClass("disabled");
			}	
		}

		function fixWindowSize() {
			$('.right').height($(document).height() - (30 +  $('.navbar').height() + $('.footer').height()))
			$('.left').height($(document).height() - (30 + $('.navbar').height() + $('.footer').height()))		
		}

		function showIf(sel,yesOrNo) {
			if (yesOrNo) 
				$('#file '+sel).removeClass('hide')
			else 
				$('#file '+sel).addClass('hide')
		} 
		
		function addIf(sel,cl,yesOrNo) {
			if ( yesOrNo ) {
				$('#file .'+sel).addClass(cl)
			} else {
				$('#file .'+sel).removeClass(cl)					
			}
		}

		function toggleAll() {
			
			$('.viewStyle').click() ;
			$('.viewStyle2').click() ;		
		}
		function prepareMainArea(modeName) {
			if (modeName== 'showEdit') {
				current.mode = 'edit'
				$('body').removeClass().addClass('oriz')
				$('#file p').contents().filter(function(){return this.nodeType === 3}).wrap('<span class="nochange"/>');
			} else {
				current.mode = 'view'
				$('body').removeClass().addClass('vert')
				$('p .nochange').contents().unwrap()
				checkReduce()
				$('#showView').click();
				$('#viewVert').click();
			}		
		}

		function viewVersion(el) {
			var version = el.attributes['data-version'].value
			var id=$(el).attr('id')
			$('.viewVersion').removeClass('active')
			$(el).addClass('active')
			$('body').removeClass().addClass(version)
			showIf('.oldVersion',id == 'versione1' || version == 'vert' || version=='oriz')
			showIf('.newVersion',id == 'versione2' || version == 'vert' || version=='oriz')
			checkReduce()	
		}
		function checkReduce() {
			if ( $('#file .oldVersion').is(':visible') && $('.newVersion').is(':visible') ) {
				$('#file .replace .newVersion').addClass('reduce')
			} else {
				$('#file .replace .newVersion').removeClass('reduce')					
			}
		}
		
		function viewStyle(item,style) {
			var myStyle = item.attributes['data-style'].value
			current.view[myStyle]= item.checked 
			addIf(myStyle,style, item.checked)		
		}

		function viewStyle2(item,style) {
			var myStyle = item.attributes['data-style'].value
			current.view[myStyle]= item.checked 
			addIf(myStyle,style, item.checked)		
		}

		function fixVersion(v1,v2){
			if($("#versone1").attr("data-version") != v1 && $("#versione1").attr("data-version") != v2){ 
				$("#versione1").attr("data-version",v1) 
				$("#versione1").text(v1) 
			}
			if($("#versione2").attr("data-version") != v1 && $("#versione2").attr("data-version") != v2){
				$("#versione2").attr("data-version",v2)
				$("#versione2").text(v2)
			}
		}
/* ***************************************************************

                     LOGIN , LOGOUT & SIGNUP

*************************************************************** */	


function changePwd(){
	event.preventDefault();
	var formContent=new Object();
	formContent.old=$("#pwdOld").val()
	formContent.new1=$("#pwdNew1").val()
	formContent.new2=$("#pwdNew2").val()
	if(!(formContent.old && formContent.new1 && formContent.new2)){
		errorForm("Compilare tutti i campi del form .","#errorPwd");
		return;
	}
	if(formContent.new1 == formContent.new2){
			var userstring = atob(cookiesMgr.get('user'))
			current.user = userstring!==""?JSON.parse(userstring):null ; 	
			if (current.user != null) {
				formContent.nome=current.user.name;
				var d=JSON.stringify(formContent);
				$.ajax({
					url:'php/changePwd.php',
					type:'post',
					data:d,
					success:function(data){
						var response=new Object();
						response=JSON.parse(data);
						if(response.result == "ok"){
							notify("Cambio password effettuato .");
							resetForm("#pwdForm","#errorPwd");
						}
						else if(response.result == "false" ){
							errorForm("Password errata","#errorPwd");
						}
					},
					error:function(e){
						errorForm("Server non disponibile","#errorPwd");

					}

				});
			}
	}
	else{
		errorForm("Conferma password diversa","#errorPwd");		
		$("#pwdNew2").parent().removeClass();
		$("#pwdNew2").next().remove();
		$("#pwdNew2").parent().addClass("form-group has-warning has-feedback");
		$("#pwdNew2").after("<span class=\"glyphicon glyphicon-warning-sign form-control-feedback\"aria-hidden=\"true\"></span>")
	}
	

}

function signUp(){
	event.preventDefault();
	var formContent=new Object();
	formContent.nome=$("#nome").val()
	formContent.cognome=$("#cognome").val()
	formContent.userName=$("#userName").val()
	formContent.gender=$("[name='gender']:checked").val()
	formContent.pwd1=$("#pwd1").val()
	formContent.pwd2=$("#pwd2").val()
	if(!(formContent.nome && formContent.cognome && formContent.userName && formContent.gender && formContent.pwd1)){
		errorForm("Compilare tutti i campi del form.","#errorSignUp")
		return;
	}
	if(formContent.pwd1 == formContent.pwd2){
		var d=JSON.stringify(formContent);
		$.ajax({
			url:'php/register.php',
			type:'post',
			data:d,
			success:function(data){
				var response=new Object();
				response=JSON.parse(data);
				if(response.result=="ok"){
					notify("Registrazione completata");		
					resetForm("#formReg","#errorSignUp");
				}
				else if(response.result=="user_exist"){
					errorForm("Errore registrazione:Nome utente già esistente!","#errorSignUp")
				}
				else{
					errorForm("Errore registrazione:Registrazione non riuscita!","#errorSignUp")
				}
			},
			error:function(e) {
				errorForm('Errore Registrazione:server non disponibile!',"#errorSignUp")
			}
		});
	}
	else
	{
		errorForm("Conferma password diversa!","#errorSignUp")
		$("#pwd2").parent().removeClass();
		$("#pwd2").next().remove();
		$("#pwd2").parent().addClass("form-group has-warning has-feedback");
		$("#pwd2").after("<span class=\"glyphicon glyphicon-warning-sign form-control-feedback\"aria-hidden=\"true\"></span>")
		
		
	}
}

	
function login(form) {
	event.preventDefault();
	var url = 'php/login.php';
	var send=$(form).serializeObject();
	send.pwd=md5(send.pwd);
	$.ajax({
		url: url,
		type: 'post',
		data: JSON.stringify(send),
		success: function(data) {
			resetForm("#loginForm","#errorLogin")
			fixLoginMenu() ;
		},
		error: function(e,t,h) {
			var r=JSON.parse(e.responseText);
			if (r.result==="wrong_login")
				errorForm("Errore Login: username o password errati","#errorLogin");
			else
				errorForm("Server non disponibile: riprovare più tardi","#errorLogin");
		}
	});	
}

function logout() {
	var goOn = confirm('Vuoi uscire?')
	if (goOn) {
		var url = 'php/logout.php';
		$.ajax({
			url: url,
			type: 'post',
			success: function(data) {
				fixLoginMenu() ;
			},
			error: function(e) {
				alert('È successo qualcosa, non sono riuscito ad uscire') ;
			}
		});	
	}
}

function fixLoginMenu() {
	var userstring = atob(cookiesMgr.get('user'))
	current.user = userstring!==""?JSON.parse(userstring):null ; 
	if (current.user != null) {
		var desinenza = (current.user.gender && current.user.gender=="f") ? "a":"o"
		$('#userNameShow').html("Benvenut"+desinenza+", "+current.user.showAs) ; 
		$('#loginMenu').hide() ;
		$('#logoutMenu').show() ;
	} else {
		$('#userNameShow').html('UserName') ; 
		$('#loginMenu').show() ;
		$('#logoutMenu').hide() ;
	}		
}

/* ***************************************************************

                     LOADING & SAVING

*************************************************************** */	
	function loadOpera(){
		$.ajax({
			method:'GET',
			url:'php/getOpera.php',
			success:function(d){
				var res=JSON.parse(d);
				current.operas=res;	
			},
			error:function(e){
				error("opere non caricate");
			}
		});	
	}

	function fixOperaMenu(title){
		var metTemplate=".$MET.visibile span, button.$MET.visibile{$CSS}";
		var catTemplate=".$CAT.visibile2 span{$CSS} button.$CAT.visibile2{$CSS}";
		if (current.opera.header && current.opera.header.title == title){
			return;
		}
		$.each (current.operas,function(i,k){
			if(k.header.title == title){
				current.opera=k;
			}
		});			
		$("#viewMetodologie").empty();
		$("#viewCategorie").empty();
		$("#editMetodologie").empty();
		$("#editCategorie").empty();
		

		$.each(current.opera.style.categories.items,function(i,k){
			var viewButton="<div class=\"checkbox\"><label> <input type=\"checkbox\" class=\"viewStyle2\" data-style=\'"+k.className+"\'><span class=\""+k.className+" visibile2\"><span>"+k.label+"</span></span></label></div>"
			var editButton="<div class=\"button\"><button class=\"btn btn-white addCategoria "+k.className+" visibile2\" data-style=\'"+k.className+"\'><span>"+k.label+"</span></button></div>"
			$("#viewCategorie").append(viewButton);
			$("#editCategorie").append(editButton);
			
		});
		$.each(current.opera.style.methodologies.items,function(i,k){
			var viewButton="<div class=\"checkbox\"><label><input type=\"checkbox\" class=\"viewStyle\" data-style=\""+k.className+"\"><span class=\""+k.className+" visibile\"><span>"+k.label+"</span></span></label></div>"
			var editButton="<div class=\"button\"><button class=\"btn btn-white addMetodologia  "+k.className+" visibile\" data-style=\'"+k.className+"\'><span>"+k.label+"</span></button></div>"
			$("#viewMetodologie").append(viewButton);
			$("#editMetodologie").append(editButton);
			
		});
		
		$('.viewStyle').on('click',function() {
			viewStyle(this,'visibile')
		});
		$('.viewStyle2').on('click',function() {
			viewStyle2(this,'visibile2')
		});
		$('.addCategoria').on('click',function() {
			addCategoria(this.attributes['data-style'].value,'visibile2')
		})
		$('.addMetodologia').on('click',function() {
			addMetodologia(this.attributes['data-style'].value,'visibile')
		})
	
		var newCss="";
		$.each(current.opera.style.categories.items,function(i,k){
			cTemplate=catTemplate.tpl({CAT:k.className,CSS:k.css});
			newCss +=cTemplate;
		});		
		$.each(current.opera.style.methodologies.items,function(i,k){
			mTemplate=metTemplate.tpl({MET:k.className,CSS:k.css});
			newCss +=mTemplate;
		});		
		$("#stili").html(newCss);
	}

function coowner(){
	if(!current.document.hasOwnProperty("authors")){
		errorForm("Aprire un documento di cui sei autore","#errorShare");
		return;
	}	
	var formCoowner=new Object();
	formCoowner.coowner=$("#coownerName").val();
	formCoowner.owner=current.user;
	formCoowner.document=current.document;
	formCoowner.path=current.opera.path;
	if(formCoowner.owner){
		var d=JSON.stringify(formCoowner);
		$.ajax({
			url:'php/coowner.php',
			type:'post',
			data:d,
			success:function(data){
				var response=new Object();
				response=JSON.parse(data);
				if(response.result=="ok"){
					notify("successo");		
					$('#coownerForm')[0].reset();
					$("#errorShare").hide();
					$('#shareForm').modal('toggle')
					loadFileList();
				}
				else if(response.result=="no_user"){
					errorForm("utente inesistente","#errorShare");
				}

				else if(response.result =="already_owner"){
					errorForm("l'utente è già proprietario del documento","#errorShare");
				}
				else if(response.result=="no_owner"){
					errorForm("Non sei proprietario del documento","#errorShare");
				}
			},
			error:function(e) {
				errorForm('Errore Registrazione:server non disponibile!',"#errorShare")
			}
		});
	} 
}

function load(pos,el) {
		var f = current.documents[pos]
		var opera=$(el).closest("[opera]")[0].attributes["opera"].value;
		fixOperaMenu(opera);
		$.ajax({
			method: 'GET',
			url: f.path+"?timestamp="+(1*new Date()),
			success: function(d) {
				$('#file').html(d)				
				$('#title').html($('#file h1'))
				$('#file').addClass('view')
				$(current.mode == 'view'?"#viewVert":"#viewOriz").click(); 
				$('.viewStyle').prop('checked',false).click() ;
				$('.viewStyle2').prop('checked',false).click() ;
				current.document = current.documents[pos] ; 
				fixLoginMenu() ;
				prepareMainArea(current.mode)
				fixVersion(current.document.versions[0],current.document.versions[1]);
				computeStatistics()
				$("#statOp").attr("data-target","#statisticsBook");
				ctrl();
			},
			error: function(a,b,c) {
				alert('Non ho potuto caricare il file '+f+' a causa di un errore') ;
			}
		});
	}	

function save(e) {
	if(!current.document.path){
		error("Aprire un documento");
		return;
	}
	if ( $(e).attr("id")=="save" && $.inArray(current.user.name,current.document.authors)<0)
	{
		error("Impossibile sovrascrivere un documento di cui non si è proprietari");
		return;
	}
	saveType= $(e).attr("id");
	versions=new Object();		
	versions.old=$("#versione1").attr("data-version");
	versions.new=$("#versione2").attr("data-version");
	var found=false;
	if(current.document.tei){ 
		$("#publFrom").val(current.document.tei.publicationStmt.publisher);				
		$("#publPlace").val(current.document.tei.publicationStmt.license);				
		$("#publLic").val(current.document.tei.publicationStmt.pubPlace);				
		$("#codif").val(current.document.tei.encodingDesc);
		$.each(current.document.tei.editionStmts,function(i,k){
			if(k.id==current.user.name){
				$("#desc").val(k.resp);
			}
		});
	}
	$('#metadata').modal('toggle')
	$("#metaForm").unbind();
	$("#metaForm").submit(function(){  
		event.preventDefault(); 
		$("#metadata").modal("toggle"); 
		computeStatistics()
		if(!current.document.tei)
			current.document.tei=new Object();
		current.document.tei.encodingDesc=$("#codif").val();
		if(!current.document.tei.revisionDesc)
			current.document.tei.revisionDesc=[];
		current.document.tei.revisionDesc.push({when:new Date().toTei(), who:"#"+current.user.name});
		if(!current.document.tei.sourceDesc)
			current.document.tei.sourceDesc=[];
		if(!current.document.tei.publicationStmt)
			current.document.tei.publicationStmt={};
		current.document.tei.publicationStmt.publisher=$("#publFrom").val();
		current.document.tei.publicationStmt.pubPlace=$("#publPlace").val();
		current.document.tei.publicationStmt.date=new Date().getFullYear();
		current.document.tei.publicationStmt.license=$("#publLic").val();
		if(!current.document.tei.editionStmts)
			current.document.tei.editionStmts=[];
		var found=false;
		$.each(current.document.tei.editionStmts,function(i,k){
			if(k.id==current.user.name){
				k.resp=$("#desc").val();
				found=true;
			}
		});
		if(!found)		
			current.document.tei.editionStmts.push({resp:$("#desc").val(), name:current.user.showAs,id:current.user.name});	
		$('#file span').removeClass('visibile').removeClass('visibile2').removeClass('editing')
		var content = $('#title').html()+'\r'+$('#file').html()
		$.ajax({
			method: 'POST',
			url: "php/save.php",
			data: {document: current.document, data: content, stats:JSON.stringify(current.stats.current),type:saveType,versioni:versions,path:current.opera.path},
			success: function(d) {
				loadFileList() ;
				$('.viewStyle').click() ;
                      	     	$('.viewStyle').click() ;
				$('.viewStyle2').click() ;
                              	$('.viewStyle2').click() ;
				alert("Testo salvato")
			},
			error: function(a,b,c) {
				alert('Non ho potuto salvare il testo')
			}
		});
		resetForm("#metaForm","#errorMeta");
	});
}
				
		function compare(el,file1,file2,pos,v1,v2) {
			fixVersion(v1,v2);
			var url = file1
			var content1, content2, loadedFiles=0
			var opera=$(el).closest("[opera]")[0].attributes["opera"].value;
			fixOperaMenu(opera);
			$.ajax({
				method: 'GET',
				url: url+"?timestamp="+(1*new Date()),
				success: function(d) {
					content1 = d
					loadedFiles++
					if (loadedFiles==2) diffAndShow(content1,content2,pos)
				},
				error: function(a,b,c) {
					alert('Non ho potuto caricare il file '+url)
				}
			});
			url = file2
			$.ajax({
				method: 'GET',
				url: url+"?timestamp="+(1*new Date()),
				success: function(d) {
					content2 = d
					loadedFiles++
					if (loadedFiles==2) diffAndShow(content1,content2,pos)
				},
				error: function(a,b,c) {
					alert('Non ho potuto caricare il file '+url)
				}
			});
		}
		
		function loadFileList() {
			$.ajax({
				method: 'GET',
				url: 'php/getFiles.php',
				success: function(d) {
					var x = JSON.parse(d)
					current.documents = [] 
					var data = showFileList(x,true)
					$('#list').empty()
					$('#list').append(data) ;
					$('#list .leaf').parent().hide();				
				},
				error: function(a,b,c) {
					alert('Nessun documento da mostrare')
				}
			});		
		}

	function showFileList(x,l) {
		var sortFunction = function c(a,b) { return a.order - b.order }
		var data = ""
		var compare = []
		for (var i in x) if (x.hasOwnProperty(i) ) {
			if (x[i].content) {		
				if (x[i].content.length - 2 >0){
					var numEd=countEd(x[i].content)
						var editions='<span class=\"label label-success\">'+numEd+'</span>'	
				}
				else 
					var editions = ''
				if(l)
					data += '<li opera=\''+x[i].label+'\'><label class="tree-toggle nav-header">'+x[i].label +'</label>\n<ul class="nav nav-list tree">\n'
				else
					data += '<li><label class="tree-toggle nav-header">'+x[i].label + ' ' + editions+'</label>\n<ul class="nav nav-list tree">\n'		
			        data += showFileList(x[i].content.sort(sortFunction),false) ;
				data += '</ul></li>' ;
			}
			 else {
				if (x[i].version) 
					compare.push(x[i])
				else {
					var pos = current.documents.length
					current.documents.push(x[i]) ; 
					data += "\t<li class='leaf'><a href='#' onclick='load(\""+pos+"\","+ "this)'>Edizione di "+x[i].authors+"</a></li>\n" ;
				}
			}
		}	
		if (compare.length > 0) {
			var pos = current.documents.length
			current.documents.push(compare[0]) ;
			var nestedCompare=JSON.parse(JSON.stringify(compare)); 
			$(compare).each (function(i,k){
				$(nestedCompare).each (function (x,y){
					var compare2=[];
					compare2.push(k);
					if(k.version!=y.version){
						compare2.push(y);
						var version=compare2.getValueFromKey('version')
						version.sort(function(a,b){return a-b});
						compare2.sort(function(a,b){return a.version-b.version});
						var versions = version.join(' e ')			
						var paths = compare2.getValueFromKey('path').join('", "')
						data = "\t<li class='leaf'><a href='#' onclick='compare(this,\""+paths+"\","+pos+",\""+version[0]+"\",\""+version[1]+"\")'><i>Confronta "+versions+"</i></a></li>\n" + data ;
					}	
				});
				nestedCompare.shift();
			});
	      }
	      return data ; 
	}

/* ***************************************************************

   DIFF-ING

 *************************************************************** */		

function diffAndShow(content1, content2, pos) {
	var c = WikEdDiffTool.diff(content1,content2)
		c = c.replace(/\n/g,'<br/>') ;
	var p = $.parseHTML('<div><p>'+c+'</p></div>')
		p = fixDiff(p)
		var t = p.shift() ; 
	$('#title h1').html($(t).html())
		$('#file').empty()
		$('#file').append(p)
		$('#file').addClass('view')
		$(current.mode == 'view'?"#viewVert":"#viewOriz").click(); 
	$('.viewStyle').prop('checked',false).click() ;
	$('.viewStyle2').prop('checked',false).click() ;
	current.document = current.documents[pos] ; 
	fixLoginMenu() ;
	prepareMainArea('showView')
	computeStatistics()
	ctrl();
}

function fixDiff(x) {
	$('p',x).contents().filter(function() { 
			return this.nodeType === 3 && this.textContent.trim() != ''
			}).wrap('<span class="nochange"/>')

	var newnew = $('p > .newVersion+.newVersion',x)
		var oldold = $('p > .oldVersion+.oldVersion',x)
		while ( newnew.length + oldold.length > 0 ) {
			newnew.each(function(i,n) { 
					var y = $(n).prev().html()
					$(n).prev().html(y+$(n).html()+' ') 
					$(n).remove() ;
					})

			oldold.each(function(i,n) { 
					var y = $(n).prev().html()
					$(n).prev().html(y+$(n).html()+' ') 
					$(n).remove() ;
					})
			newnew = $('p > .newVersion+.newVersion',x)
				oldold = $('p > .oldVersion+.oldVersion',x)
		}

	$('p > .oldVersion+.newVersion+.oldVersion',x).each(function(i,n) { 
			$(n).after('<span class="replace"></span>') ;
			var x = $(n).next() ;
			var y = $(n).prev().prev().html()
			$(n).prev().prev().html(y+$(n).html()+' ')
			var n1 = $(n).prev()
			var n2 = $(n).prev().prev()
			x.append(n1) ;
			x.append(n2) ;
			$(n).remove()
			})
	$('p > .newVersion+.oldVersion+.newVersion',x).each(function(i,n) { 
			$(n).after('<span class="replace"></span>') ;
			var x = $(n).next() ;
			var y = $(n).prev().prev().html()
			$(n).prev().prev().html(y+$(n).html()+' ')
			var n1 = $(n).prev()
			var n2 = $(n).prev().prev()
			x.append(n2) ;
			x.append(n1) ;
			$(n).remove()
			})
	$('p > .oldVersion+.newVersion',x).each(function(i,n) { 
			$(n).after('<span class="replace"></span>') ;
			var x = $(n).next() ;
			var n1 = $(n).prev()
			x.append($(n)) ;
			x.append(n1) ;
			})
	$('p > .newVersion+.oldVersion',x).each(function(i,n) { 
			$(n).after('<span class="replace"></span>') ;
			var x = $(n).next() ;
			var n1 = $(n).prev()
			x.append(n1) ;
			x.append($(n)) ;
			})

	$('p > .newVersion',x).each(function(i,n) { 
			$(n).after('<span class="replace insert visibile"></span>') ;
			var x = $(n).next() ;
			x.append($(n)) ;
			x.append('<span class="oldVersion">&nbsp;</span>')
			})
	$('p > .oldVersion',x).each(function(i,n) { 
			$(n).after('<span class="replace delete visibile"></span>') ;
			var x = $(n).next() ;
			x.append('<span class="newVersion">&nbsp;</span>')
			x.append($(n)) ;
			})
	var newBr = $('.replace',x).has('.newVersion br').each(function(i,n) {
			var newVersion = $('.newVersion',n).contents()
			var oldVersion = $('.oldVersion',n).contents()
			var newVersionBr = $('.newVersion br',n)[0]
			var oldVersionBr = $('.oldVersion br',n)[0]

			var newVersionBeforeBr = 0
			while (newVersion[newVersionBeforeBr] !== newVersionBr) newVersionBeforeBr++;
			var oldVersionBeforeBr = 0
			while (oldVersion[oldVersionBeforeBr] !== oldVersionBr) oldVersionBeforeBr++;

			$(n).after($(n).clone()) ; 
			var o = $(n).next() ;
			$(n).after('<br/>') ;

			for (var i=newVersion.length-1 ; i >= newVersionBeforeBr; i--) {
			var item = $('.newVersion',n).contents()[i]
			if (item) item.remove() ;
			}
			for (var i = oldVersion.length-1 ; i>=oldVersionBeforeBr; i--) {
			var item = $('.oldVersion',n).contents()[i]
				if (item) item.remove() ;
			}
			for (var i=newVersionBeforeBr; i>=0; i--) {
				var item = $('.newVersion',o).contents()[i]
					if (item) item.remove() ;
			}
			for (var i=oldVersionBeforeBr; i>=0; i--) {
				var item = $('.oldVersion',o).contents()[i]
					if (item) item.remove() ;
			}
	})

	$('.nochange',x).contents().unwrap()
		$('br+br',x).remove()
		$('.replace',x).unwrap()
		var v = $(x).html().split(/<br>/)
		var r = ""
		for (var i=0; i<v.length; i++) {
			v[i] = "<p id='n"+i+"'>"+v[i]+"</p>\n"
		}			
	return $.parseHTML(v.join('')) ; 		
}

/* ***************************************************************

   EDITING

 *************************************************************** */		

function join(){
	var s=document.getSelection()
		if(($(s.anchorNode).closest('.replace').length == 0)||($(s.focusNode).closest('.replace').length == 0)){

			error("<strong>Errore selezione!</strong> Selezionare da una nota a una nuova nota")	
		}
		else if(s.anchorNode.parentNode.parentNode === s.focusNode.parentNode.parentNode){
			 if(s.anchorNode.parentNode == s.focusNode.parentNode)
                        {
                                error("<strong>Errore Selezione</strong>Selezionare da una nota ad un'altra nota");
                        } 
                        else{   
                                s.anchorNode.parentNode.remove()
                                $(s.focusNode).unwrap()
				if( $(s.focusNode).prev().hasClass("replace") && $(s.focusNode).next().hasClass("replace")){
					$(s.focusNode).removeClass().addClass("nochange");
                                	$(s.focusNode).text($(s.focusNode).text().replace('\n','')); 
				}
				else if( $(s.focusNode).prev().hasClass("nochange") && $(s.focusNode).next().hasClass("nochange")){
					$($(s.focusNode).prev()).append($(s.focusNode).html())
					$($(s.focusNode).prev()).append($(s.focusNode).next().html())
					$(s.focusNode).next().remove();
                                	$(s.focusNode).prev().text($(s.focusNode).prev().text().replace('\n','')); 
					$(s.focusNode).remove();
				}
				else if( $(s.focusNode).prev().hasClass("nochange") && $(s.focusNode).next().hasClass("replace")){
					$($(s.focusNode).prev()).append($(s.focusNode).html())
                                	$(s.focusNode).prev().text($(s.focusNode).prev().text().replace('\n','')); 
					$(s.focusNode).remove();
				}
				else{
					$($(s.focusNode).next()).prepend($(s.focusNode).html())
                                	$(s.focusNode).next().text($(s.focusNode).next().text().replace('\n','')); 
					$(s.focusNode).remove();
                       		 }
		      }
		}	
		else{	
			var r=s.getRangeAt(0)
				var c=(s.getRangeAt(0).cloneContents())
				$(c).children(":first-child")[0].innerHTML=(s.anchorNode.parentNode.parentNode).innerHTML
				$(c).children(":last-child")[0].innerHTML=(s.focusNode.parentNode.parentNode).innerHTML
				var newV="";
			var oldV="";
			$(c).children().each(function(i,e){
					if($(e).hasClass("replace")){
					$(e).children().each(function(j,x){
							if($(x).hasClass("newVersion")){
							newV+=$(x).text()
							}
							else{
							oldV+=$(x).text()
							}
							});

					}
					else {
					newV+=$(e).text()
					oldV+=$(e).text();
					}
					});
			var tnew ="<span class='newVersion'>"+newV+"</span>"
				var told ="<span class='oldVersion'>"+oldV+"</span>"
				var t= $.parseHTML("<span class='replace'>"+tnew+told+"</span>")
				$(r.startContainer.parentNode.parentNode).before(t)
				r.startContainer.parentNode.parentNode.remove()	
				r.endContainer.parentNode.parentNode.remove()
				r.deleteContents()

		}
}


function split() {
	if(!current.document.path){
		error("Nessun documento aperto");
		return;
	}
	var newText = " <span class='$0'>\n \
		       <span class='newVersion'>$1</span>\n \
		       <span class='oldVersion'>$2</span>\n \
		       </span> "

	 var s = getSelection();
	if(s.isCollapsed)
		return;
	if(($(s.anchorNode).closest('#file').length == 0))
		return;
	if (s.anchorNode == s.focusNode) {
		var min = Math.min(s.anchorOffset, s.focusOffset)
			var max = Math.max(s.anchorOffset, s.focusOffset)
			var e = $(s.anchorNode).closest('.replace')
			if (e.length > 0) {
				var c = e.attr('class')
					var a1 = $('.newVersion', e).text()
					var a2 = $('.oldVersion', e).text()
					var t = a1.substring(min,max)
					var i = a2.indexOf(t)
					if (t!='' && i!=-1) {
						var prima = ''
						var dopo = ''
						if (min > 0) 
							prima = newText.tpl([ c, a1.substring(0,min), a2.substring(0,i)])
								if (max < a1.length) 
									dopo = newText.tpl([ c, a1.substring(max,100000), a2.substring(i+t.length,10000)])
										t="<span class=\"nochange\">"+t+"</span>";
										e.replaceWith(prima + t + dopo)
					}
			} else {
				var t = $.parseHTML("<span class='oldVersion'></span>")
					var r = s.getRangeAt(0)
					r.surroundContents(t[0])
					$(t).wrap("<span class='replace'></span>")
					$(t).before($(t).clone().removeClass('oldVersion').addClass('newVersion'))
					var nochange=r.startContainer;
					var contents=$(nochange).contents()
					contents.unwrap()
					$.each(contents,function(i,e){
						if(e.nodeType==3)
							$(e).wrap("<span class=\"nochange\"></span>")
					});
			}
	} else if ($(s.focusNode).closest('.replace')[0] === $(s.anchorNode).closest('.replace')[0]) {
		var e = $(s.anchorNode).closest('.replace')					
			if (s.anchorNode.parentElement.attributes['class'].value.indexOf('oldVersion') != -1) {
				nodes= {
					old: {node: s.anchorNode, offset: s.anchorOffset, text:s.anchorNode.textContent}, 
     					new: {node:s.focusNode, offset: s.focusOffset, text:s.focusNode.textContent}
				}
			} else {
				nodes= {
					new: {node: s.anchorNode, offset: s.anchorOffset, text:s.anchorNode.textContent}, 
     					old: {node:s.focusNode, offset: s.focusOffset, text:s.focusNode.textContent}
				}
			}
		var prima = newText.tpl([e.attr('class'), nodes.new.text.substring(0,nodes.new.offset), nodes.old.text.substring(0,nodes.old.offset)])
			var dopo = newText.tpl([e.attr('class'), nodes.new.text.substring(nodes.new.offset,1000000), nodes.old.text.substring(nodes.old.offset,1000000)])
			e.replaceWith(prima + dopo)		
	}
	else{
		error("<strong>Errore separazione!</strong> I due elementi sono già separati.")
	}
}

function addCategoria(style) {
	var sel=getSelection();
	if (sel) {
		if ($(sel.anchorNode).closest('span.replace').length >0 ) {
			if($(sel.anchorNode).closest('span.replace').hasClass(style)){
				$(sel.anchorNode).closest('span.replace').removeClass(style)
				$(sel.anchorNode).closest('span.replace').removeClass("visibile2")
				$(sel.anchorNode).closest('span.replace').removeAttr("data-responsible")
			}
			else{
				$(sel.anchorNode).closest('span.replace').removeClass(function (index,css){
					var s=css.split(" ");
					for (i in current.opera.style.categories.items)
					{
						var op=current.opera.style.categories.items[i].className;
						for (j in s){
							if (op===s[j]) 
								return s[j];
						}
					}
				});
				$(sel.anchorNode).closest('span.replace').addClass(style);
				$(sel.anchorNode).closest('span.replace').attr("data-responsible",current.user.name);		
				if(!$(sel.anchorNode).closest('span.replace').is("visibile2"))
					$(sel.anchorNode).closest('span.replace').addClass("visibile2");
			}
		} 
		else if (sel.anchorNode === sel.focusNode && sel.type=='Range') {
			startEditing(sel,'replace',style,false,"visibile2") 
		}
	}
}

function addMetodologia(style) {
	var sel=getSelection();
	if (sel) { 
		if ($(sel.anchorNode).closest('span.replace').length >0 ) { 
			if($(sel.anchorNode).closest('span.replace').hasClass(style)){
				$(sel.anchorNode).closest('span.replace').removeClass(style)
				$(sel.anchorNode).closest('span.replace').removeClass("visibile")
				$(sel.anchorNode).closest('span.replace').removeAttr("data-responsible")

			}
			else{ 
				$(sel.anchorNode).closest('span.replace').removeClass(function (index,css){
					var s=css.split(" ");
					for (i in current.opera.style.methodologies.items)
					{
						var op=current.opera.style.methodologies.items[i].className;
						for (j in s){
							if (op===s[j] || s[j]==="insert" || s[j]==="delete")
								return s[j];
						}
					}
				});
				$(sel.anchorNode).closest('span.replace').addClass(style);
				$(sel.anchorNode).closest('span.replace').attr("data-responsible",current.user.name);		
				if(!$(sel.anchorNode).closest('span.replace').is("visibile"))
					$(sel.anchorNode).closest('span.replace').addClass("visibile");
			}
		} 
		else if (sel.anchorNode === sel.focusNode && sel.type=='Range') {
			startEditing(sel,'replace',style) 
		}
	}
}
function beginEditing(e) {
	if (current.mode == 'edit') {
		if (e.altKey) {
			var sel = selection()
				startEditing(sel,'insert','',true)
		} else {
			current.edit=true;
			var n = $(e.currentTarget) ;
			$(n).addClass('editing').attr('contentEditable',true).focus() 
				$(n).keydown(handleKey )
		}
	} 		
}

function startEditing(sel, type, style,collapseSelection,vis="visibile") {
	current.edit=true;
	if (collapseSelection) {
		var start = sel.anchorOffset
			var end = sel.anchorOffset			
	} else {
		var start = Math.min(sel.anchorOffset,sel.focusOffset)
			var end = Math.max(sel.anchorOffset,sel.focusOffset)
	}

	var r = document.createRange()
		var node = sel.anchorNode
		r.setStart(node,start);
	r.setEnd(node,end)
		var span = document.createElement('span')
		if( style == "insert"){
			span.setAttribute('class','newVersion')
		}
		else{
			span.setAttribute('class','oldVersion')
		}
	r.surroundContents(span)
		var s = $(span).wrap("\r<span class='"+type+" "+vis+" "+style+"' data-responsible='"+current.user.name+"'>\r</span>\r").parent()
		if ( style == "insert"){
			$(s).append("\r<span class='oldVersion editing'>"+"~"+"</div>")
		}
		else{
			$(s).prepend("\r<span class='newVersion editing'>"+"~"+"</div>")
		}
	$('span.editing', s).attr('contentEditable',true).focus();
	$('span.editing', s).keydown(handleKey )
}
function endEditing(e) {
	var f = $(e).closest('.replace')
		$(e).removeClass('editing').removeAttr('contentEditable').focusout() 

		if (f.length>0 && f[0].textContent.trim() != "" ) {
			$(e).text($(e).text().replace('~',''))			
			if (($(e).html().trim().length == 0) && ($(e).hasClass('newVersion')) ) {
				f.addClass('delete visibile') 
					e.html('&nbsp;')
			} else if ($('.oldVersion',f).html().trim().length == 0) {
				f.addClass('insert visibile')
					$('.oldVersion',f).html('&nbsp;')
			}
		}
		else {
			f.html("")
		}

}


/* ***************************************************************

   STATISTICHE

 *************************************************************** */		

function computeStatistics() {
	$("#statCap").attr("data-target","#statistics");
	var stats = {}
	var totitems=0;
	var totchars=0;
	stats.chars={}
	stats.items={}
	stats.total = $('#file').text().length - $('#file .oldVersion').text().length
	$.each(current.opera.style.categories.items,function(i,k){
		stats.chars[k.label]=$('#file .'+k.className+' .newVersion').text().length
		stats.items[k.label]=$('#file .'+k.className).length
		totchars+=stats.chars[k.label]
		totitems+=stats.items[k.label]
	});
	stats.unmodified = stats.total - totchars
	stats.totalItems = totitems
	current.stats.current = stats ; 
}

function loadStatistics() {
	$.ajax({
		url: 'php/getStats.php',
		data: {'path':current.opera.path},
		type: 'get',
		success: function(data) {
			current.stats.whole =JSON.parse(data);
			drawTable(true)
			$('#showTableBook').tab('show')
		},
		error: function(e) {
			error("Aprire un documento dell'opera desiderata");
		}
	});	
}

function drawTable(wholeBook) {
	if (wholeBook) {
		$("#tableBook tbody").html("");
		$("#tableLeg").html("");
		$("#tableLeg").append("<th class=\"col-md-4 col-sm-4\">Capitolo</th>");
		$("#tableLeg").append("<th class=\"col-md-1 col-sm-1\">&nbsp;</th>");
		$.each(current.opera.style.categories.items, function(i,k){
			$("#tableLeg").append("<th class=\"col-md-1 col-sm-1 text-center\">"+k.abbr+"</th>");
		});
		$("#tableLeg").append("<th class=\"col-md-1 col-sm-1\">Non modif</th>");
		$("#tableLeg").append("<th class=\"col-md-1 col-sm-1\">Totali</th>");
		var data = current.stats.whole
		var id=0;
		var chapterTpl = "$0 <br/>($1)" ;
		var t = $('#theTableRow').html()
		var p= $('#theTableContent').html()
		var keys = Object.keys(data).sort() 
		for (var j= 0; j<keys.length; j++) { 
			for (var i in data[keys[j]]) { 
				var table = ''
				var stats = data[keys[j]][i] ;
				var chapterData=new Object;
				$.each(current.documents, function(index,el){
					if (el.path.includes(current.opera.header.title)) //right opera
					{
						if(el.id == i){
							chapterData.capitolo=el.label;
							chapterData.autore=el.authors;
						}
					}
				});
				var chapter = chapterTpl.tpl([chapterData.capitolo, chapterData.autore]) ;
				var q=t.tpl({chapter:chapter,index:id,unmodified:stats.unmodified,totalItems:stats.totalItems,total:stats.total});
				$("#tableBook tbody").append(q);
				$.each(current.opera.style.categories.items, function(i,k){
					var v = p.tpl({
						catItems:stats.items[k.label], catChars:stats.chars[k.label]
					}) ;
					table += v
				});
				$('#gHead'+id).after(table);
				id=id+1;
			}
		}			
	}
	else 
	{
		var stats = current.stats.current
		var t = $('#theTable').html()
		t=t.tpl({unmodified:stats.unmodified,totalItems:stats.totalItems,total:stats.total});
		$('#table').html(t) 
		$.each(current.opera.style.categories.items,function(i,k){
		        var p=$('#theTableEntry').html()
		        p=p.tpl({cl:k.label,catItems:stats.items[k.label],catChars:stats.chars[k.label]});
			$("#tHead").after(p);
		});
	}
}

function drawChars(wholeBook) {
	if (wholeBook) {
		var data = current.stats.whole
		var chapterTpl = "$0 \n($1)" ;
		var content=[];
		content.push('Categoria');
		$.each(current.opera.style.categories.items,function(i,k){
			content.push(k.label);
		});
		content.push('Non modificati');
		content.push({role:'annotation'});	
		var table = [content];
			var keys = Object.keys(data).sort()
				for (var j= 0; j<keys.length; j++) {
					for (var i in data[keys[j]]) {
						var stats = data[keys[j]][i] ;
						var chapterData=new Object;
						 $.each(current.documents, function(index,el){
						 	if (el.path.includes(current.opera.header.title)) //right opera
						 	{
                                               			 if(el.id == i){
                                                	        	chapterData.capitolo=el.label;
                                                	        	chapterData.autore=el.authors;
                                                			 }
						 	}
                                       		 });
						var chapter = chapterTpl.tpl([chapterData.capitolo, chapterData.autore]) ;
						var p =[];
						p.push(chapter);
						$.each(current.opera.style.categories.items,function(i,k){
							p.push(parseInt(stats.chars[k.label]));	
						});
						p.push(parseInt(stats.unmodified));
						p.push(parseInt(stats.total));
						table.push(p)
					}
				}			
		var data = google.visualization.arrayToDataTable(table);
		var options = {
			bar: { groupWidth: '75%' },
    			 legend: 'none',
    			 isStacked: true,
		};
		var chart = new google.visualization.ColumnChart($('#chartCharsBook')[0]);
		chart.draw(data, options);
	} else {
		var stats = current.stats.current
		var googleArray=new Array();
		googleArray.push(['Tipo','Interventi']);
		$.each(current.opera.style.categories.items, function(i,k){
				googleArray.push([k.label,stats.chars[k.label]])
		});
		googleArray.push(['Non modificati',stats.unmodified]);
		var data = google.visualization.arrayToDataTable(googleArray);

		var options = {
				// title:' Caratteri coinvolti'
			      is3D: false,
			      legend: { position: 'top', maxLines: 4}, 
			      slices: [
        			      {color: '#ffff99', textStyle: {color: 'black'} },
     				      {color: '#99ffff', textStyle: {color: 'black'}},
     				      {color: '#dd5050'},
      				      {color: '#808020'}, 
     				      {color: '#a0a0a0'}
      			     ]

		};
		var chart = new google.visualization.PieChart($('#chartChars')[0]);
		chart.draw(data, options);
	}
}

function drawNetChars(wholeBook) {
	if (wholeBook) {
		var data = current.stats.whole
		var chapterTpl = "$0 \n($1)" ;
		var content=[];
		content.push('Categoria');
		$.each(current.opera.style.categories.items,function(i,k){
			content.push(k.label);
		});
		content.push({role:'annotation'});	
		var table = [content];
			var keys = Object.keys(data).sort()
				for (var j= 0; j<keys.length; j++) {
					for (var i in data[keys[j]]) {
						var stats = data[keys[j]][i] ;
						var chapterData=new Object;
						$.each(current.documents, function(index,el){
							if (el.path.includes(current.opera.header.title)) //right opera
							{
                                               			 if(el.id == i){
                                                	        	chapterData.capitolo=el.label;
                                                		        chapterData.autore=el.authors;
                                        		        }
                                	        	}
						});
						var chapter = chapterTpl.tpl([chapterData.capitolo, chapterData.autore]) ;
						var p =[];
						p.push(chapter);
						$.each(current.opera.style.categories.items,function(i,k){
							p.push(parseInt(stats.chars[k.label]));	
						});
						p.push(parseInt(stats.total));
						table.push(p)
					}
				}			
		var data = google.visualization.arrayToDataTable(table);
		var options = {
			 bar: { groupWidth: '75%' },
    			 legend: 'none',
    			 isStacked: true,
		};
		var chart = new google.visualization.ColumnChart($('#chartNetCharsBook')[0]);
		chart.draw(data, options);
	} else {
		var stats = current.stats.current
                var googleArray=new Array();
                googleArray.push(['Tipo','Interventi']);
                $.each(current.opera.style.categories.items, function(i,k){
                                googleArray.push([k.label,stats.chars[k.label]])
                });
			var data = google.visualization.arrayToDataTable(googleArray);

		var options = {
			//			title: 'Caratteri coinvolti',
is3D: false,
      legend: { position: 'top', maxLines: 4}, 
      slices: [
      {color: '#ffff99', textStyle: {color: 'black'} },
      {color: '#99ffff', textStyle: {color: 'black'}},
      {color: '#dd5050'},
      {color: '#808020'}
      ]
		};

		var chart = new google.visualization.PieChart($('#chartNetChars')[0]);
		chart.draw(data, options);
	}
}

function drawItems(wholeBook) {
	if (wholeBook) {
		var data = current.stats.whole
		var chapterTpl = "$0 \n($1)" ;
		var content=[];
		content.push('Categoria');
		$.each(current.opera.style.categories.items,function(i,k){
			content.push(k.label);
		});
		content.push({role:'annotation'});	
		var table = [content];
		var keys = Object.keys(data).sort()
			for (var j= 0; j<keys.length; j++) {
				for (var i in data[keys[j]]) {
					var stats = data[keys[j]][i] ;
					var chapterData=new Object;
					 $.each(current.documents, function(index,el){
						 if (el.path.includes(current.opera.header.title)) //right opera
						 {
                                        	       	if(el.id == i){
                                        	               	chapterData.capitolo=el.label;
                                        	       	        chapterData.autore=el.authors;
                                       		        }
                                       		} 
					});
					var chapter = chapterTpl.tpl([chapterData.capitolo, chapterData.autore]) ;
					var p =[];
					p.push(chapter);
					$.each(current.opera.style.categories.items,function(i,k){
						p.push(parseInt(stats.items[k.label]));	
					});
					p.push(parseInt(stats.total));
					table.push(p)
				}
			}			
		
		var data = google.visualization.arrayToDataTable(table);
		var options = {
bar: { groupWidth: '75%' },
     legend: 'none',
     isStacked: true,
		};
		var chart = new google.visualization.ColumnChart($('#chartItemsBook')[0]);
		chart.draw(data, options);
	} else {
		var stats = current.stats.current
                var googleArray=new Array();
                googleArray.push(['Tipo','Interventi']);
                $.each(current.opera.style.categories.items, function(i,k){
                                googleArray.push([k.label,stats.items[k.label]])
                });
			var data = google.visualization.arrayToDataTable(googleArray);

		var options = {
			//			title: 'Interventi complessivi',
is3D: false,
      legend: { position: 'top', maxLines: 4}, 
      slices: [
      {color: '#ffff99', textStyle: {color: 'black'} },
      {color: '#99ffff', textStyle: {color: 'black'}},
      {color: '#dd5050'},
      {color: '#808020'}
      ]
		};

		var chart = new google.visualization.PieChart($('#chartItems')[0]);
		chart.draw(data, options);
	}
}


/* ***************************************************************

   COOKIE MANAGEMENT

 *************************************************************** */		

var cookiesMgr = (function() {
		var today = new Date();
		var expiry = new Date(today.getTime() + 30 * 86400 * 1000);   // plus 30 days
		var expires = "; expires=" + expiry.toGMTString() ;
		var maxExpires = "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" ; 
		var path = "; path=/" ;

		return {
get: function (k) {
var y = encodeURIComponent(k).replace(/[\-\.\+\*]/g, "\\$&")
var x = document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + y + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")
var z = decodeURIComponent(x)
try{
return JSON.parse(z);
} catch(e){
return z;
}
return null;
},
set: function (k, v) {
if (typeof v !== 'string')
	v = JSON.stringify(v) ;
document.cookie = encodeURIComponent(k) + "=" + encodeURIComponent(v) + expires + path;
     },
remove: function (k) {
		document.cookie = encodeURIComponent(k) + maxExpires +  path;
	},
keys: function () {
	      var k = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
	      for (i = 0; i < k.length; i++) { 
		      k[i] = decodeURIComponent(k[i]) 
	      }
	      return k;
      }
};
})() ;

/* ***************************************************************

   UTILITY

 *************************************************************** */		
		function countEd(x){
			var c=0;
			for(i in x){
				if( x[i].authors)
					c=c+1;
			}
			return c;	
		}	
	
		function resetForm(idForm,idError){
			if(idForm=="#formReg"){
				$(idForm+" div").removeClass("form-group has-success has-error has-error has-warning has-feedback")
				$(idForm+" span.glyphicon").remove();
				
				$('#signUpForm').modal('toggle')
			}
			else if(idForm=="#loginForm"){
				$('#login').modal('toggle')
			}
			else if(idForm=="#pwdForm"){
				$(idForm+" div").removeClass("form-group has-success has-error has-error has-warning has-feedback")
				$(idForm+" span.glyphicon").remove();
				$('#account').modal('toggle')
			}
			$(idForm)[0].reset();
			$(idError).hide();
		}

		$.fn.serializeObject = function() {
		    var o = {};
		    var a = this.serializeArray();
		    $.each(a, function() {
			if (o[this.name] !== undefined) {
			    if (!o[this.name].push) {
				o[this.name] = [o[this.name]];
			    }
			    o[this.name].push(this.value || '');
			} else {
			    o[this.name] = this.value || '';
			}
		    });
		    return o;
		};
		
		function check(e){
			$(e).parent().removeClass();
			$(e).next().remove();
			if( $(e).val()!= ""){
				$(e).parent().addClass("form-group has-success has-feedback");
				$(e).after("<span class=\"glyphicon glyphicon-ok form-control-feedback\"aria-hidden=\"true\"></span>")
			}
			else{
				$(e).parent().addClass("form-group has-error has-feedback");
				$(e).after("<span class=\"glyphicon glyphicon-remove form-control-feedback\"aria-hidden=\"true\"></span>")
			}
		}

		function errorForm(strErr,id){
			$(id).html(strErr);
			$(id).show();
		}
		function notify(str){
			$("#notifica").html(str)
			$("#notifica").show()
			setTimeout(function(){
				$("#notifica").fadeOut("slow");
			},3000)
		}	
	
		function error(strErr){ 
			$("#errore").html(strErr)
			$("#errore").show()
			setTimeout(function(){
				$("#errore").fadeOut("slow");
			},5000)
		}

		function selection() {
			if (window.getSelection) {
				return window.getSelection();
			} else if (document.getSelection) {
				return document.getSelection();
			} else if (document.selection) {
				return document.selection.createRange().text;
			}
		}
			
			
		function handleKey(event) {
			if ( event.which == 13 ) {
				endEditing(this)		
				event.preventDefault();
			}
		}
		
		NodeList.prototype.indexOf = function(n) { 
			var i=-1; 
			while (this.item(i) !== n) {i++} ; 
			return i 
		}		

		String.prototype.tpl = function(o) { 
			var r = this ; 
			for (var i in o) { 
				r = r.replace(new RegExp("\\$"+i, 'g'),o[i]) 
			} 
			return r 
		}
		
		Array.prototype.getValueFromKey = function(key) { 
			var ret = [] ; 
			for (var i in this) { 
				if (this[i][key]) 
					ret.push(this[i][key] ) 
			}
			return ret 
		}
		
		Date.prototype.toTei=function(){
			var year=this.getFullYear();
			var month=this.getMonth();
			if (month<10) month="0"+month;
			var date=this.getDate();
			if (date<10) date="0"+date;
			return year+"-"+month+"-"+date;
		}
		$.fn.isAfter = function(sel){
		  return this.prevAll(sel).length !== 0;
		}
		$.fn.isBefore= function(sel){
		  return this.nextAll(sel).length !== 0;
		}
		
		$.fn.enable = function() {
		    $(this).prop("disabled",false);
		}
		$.fn.disable = function() {
		    $(this).prop("disabled",true);
		}
