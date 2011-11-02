function mpthrize(div, path) {
   mp3     = new air.Sound(new air.URLRequest(path));
   channel = null;
   btn     = $('<input type="button" value="Play" />');
   toggleSound = function() {
      air.trace('toggle sound')
      if(channel) {
         channel.stop();
         channel = null;
      } else {
         channel = mp3.play();
         channel.addEventListener(air.Event.SOUND_COMPLETE,
            function(e) { channel = null; btn.attr('value', 'Play'); }); 
      }
      btn.attr('value', channel ? 'Stop' : 'Play');
   }
   btn.click('click', toggleSound);
   div.append(btn);
}
