(function (window, document, $) {

    var reloadPage = function(){
        window.location.reload(true); 
    };

    // Connect Toggles
    $('.toggle').each(function(){
        console.log("Found!");
        var link = this;
        $(link).click(function(){
            var targetStr = $(link).attr('data-toggle');
            var target = $('#' + targetStr);

            if(target.css('display') == 'none')
            {
                target.css('display', 'block');
            }
            else
            {
                target.css('display', 'none');
            }
            
            return false;
        });
    });

    // Add Labels
    $('.addLabel').each(function(){
        var button = this;
        $(button).click(function(){
            var storyId = $(button).attr('data-story');
            var labelName = $(button).attr('data-label');
            $.ajax({
                url: '/api/story/add-label?story=' + storyId.toString() + '&label=' + encodeURIComponent(labelName), 
                success: function(){
                    reloadPage();
                },
                error: function(){
                    alert('error - could not add label ' + labelName + ' to the story.');
                }
            });
        });

    });

}(this, this.document, jQuery));
