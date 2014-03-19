(function(){CKEDITOR.dialog.add('youtube',
   function(editor)
   {return{title:editor.lang.youtube.title,minWidth:CKEDITOR.env.ie&&CKEDITOR.env.quirks?200:250,minHeight:240,
   onShow:function(){this.getContentElement('general','content').getInputElement().setValue('')},
   onOk:function(){
					var splitUrl = function(name, href) {
						  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
						  var regexS = "[\\?&]"+name+"=([^&#]*)";
						  var regex = new RegExp( regexS );
						  var results = regex.exec( href );
						  if( results == null )
						    return "";
						  else
						    return decodeURIComponent(results[1].replace(/\+/g, " "));
					};
                   val = this.getContentElement('general','content').getInputElement().getValue();
				   var param = splitUrl("v", val);
				   if (param != "")
						val = param;
					else 
						val = val.replace("http://youtu.be",  "");
               var text='<iframe title="YouTube video player" class="youtube-player" type="text/html" width="280" height="190" src="http://www.youtube.com/embed/'
               + val
               +'?rel=0" frameborder="0"></iframe>';
   this.getParentEditor().insertHtml(text)},
   contents:[{label:editor.lang.common.generalTab,id:'general',elements:
   [{type:'html',id:'pasteMsg',html:'<div style="white-space:normal;width:140px;"><img style="margin:5px auto;" src="'
   +CKEDITOR.getUrl(CKEDITOR.plugins.getPath('youtube')
   +'images/youtube_large.png')
   +'"><br />'+editor.lang.youtube.pasteMsg
   +'</div>'},{type:'html',id:'content',style:'width:180px;height:90px',html:'<input size="40" style="'+'border:1px solid black;'+'background:white">',focus:function(){this.getElement().focus()}}]}]}})})();