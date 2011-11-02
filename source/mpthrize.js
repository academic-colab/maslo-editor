/*
 *  Project: Adobe AIR Audio Player
 *  Description: Renders an MP3 player
 *  Author: Joe Nelson
 *  License: MIT
 *
 *  Built on https://github.com/zenorocha/jquery-boilerplate
 */

;(function ( $, window, document, undefined ) {
    
    // Create the defaults once
    var pluginName = 'AirAudio',
        defaults = { };

    // The actual plugin constructor
    function AirAudio( element, options ) {
        this.element = element;
        this.options = $.extend( {}, defaults, options) ;
        
        this._defaults = defaults;
        this._name = pluginName;
        
        this.init();
    }

    AirAudio.prototype.init = function () {
      mp3     = new air.Sound(new air.URLRequest(this.options['file']));
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
      btn.click(toggleSound)
      $(this.element).append(btn);
    };

    // A really lightweight plugin wrapper around the constructor, 
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new AirAudio( this, options ));
            }
        });
    }

})(jQuery, window, document);
