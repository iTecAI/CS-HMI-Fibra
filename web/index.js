var FINGERPRINT = null;
var USERID = null;
var CONNECTION = {};
var USER = {};

function r(request_type,path,params,body,success) {
    $.ajax({
        type:request_type.toUpperCase(),
        url:window.location.origin+path+'?'+$.param(params),
        data:body,
        success:success
    });
}

function toast(text,info) {
    var tst = $('<div class="toast"></div>')
    .text(text)
    .css({
        right:'-230px',
        height:'fit-content'
    })
    .append(
        $('<button>x</button>')
        .on('click',function(){
            $(this).parents('.toast').animate({right:'-230px'},200,function(){$(this).remove()});
        })
    );
    if (info != undefined) {
        tst
        .addClass('info-item')
        .attr('data-info',info)
        .attr('data-info-loc','bottom')
        .on('click',function(e){
            if (!$(e.target).hasClass('info-item')) {
                return;
            }
            $('.info-item-dialog').remove();
            var fthis = this;
            r(
                'get',
                '/info/',
                {infoName:$(this).attr('data-info')},{},function(data){
                    var infoElement = $('<div class="info-item-dialog"></div>')
                    .attr('id','#info-item-'+$(fthis).attr('id'))
                    .css({
                        width:window.innerWidth*0.4,
                        height:window.innerHeight*0.4
                    })
                    .html(data.content);
    
                    var pOffset = $(fthis).offset();
                    var pHeight = $(fthis).height();
                    var pWidth = $(fthis).width();
    
                    if ($(fthis).attr('data-info-loc') == 'bottom') {
                        var eTop = pOffset.top + pHeight;
                        var eLeft = pOffset.left + pWidth/2 - infoElement.width()/2;
                    } else if ($(fthis).attr('data-info-loc') == 'top') {
                        var eTop = pOffset.top - infoElement.height();
                        var eLeft = pOffset.left + pWidth/2 - infoElement.width()/2;
                    } else if ($(fthis).attr('data-info-loc') == 'left') {
                        var eTop = pOffset.top - pHeight/2 + infoElement.height()/2;
                        var eLeft = pOffset.left - infoElement.width();
                    } else if ($(fthis).attr('data-info-loc') == 'right') {
                        var eTop = pOffset.top - pHeight/2 + infoElement.height()/2;
                        var eLeft = pOffset.left + pWidth;
                    } else {
                        var eTop = 0;
                        var eLeft = 0;
                    }
    
                    if (eTop + infoElement.height() > window.innerHeight) {
                        $(infoElement).css('height',window.innerHeight-eTop);
                    }
                    if (eTop < 0) {
                        $(infoElement).css('height',eTop+infoElement.height());
                        eTop = 0;
                    }
                    if (eLeft + infoElement.width() > window.innerWidth) {
                        $(infoElement).css('width',window.innerWidth-eLeft);
                    }
                    if (eLeft < 0) {
                        $(infoElement).css('height',eLeft+infoElement.width());
                        eLeft = 0;
                    }
    
                    $(infoElement).css({
                        top:eTop+25+'px',
                        left:eLeft-20+'px'
                    });
                    $(infoElement).appendTo($('body'));
                }
            );
        });
    }
    tst.animate({right:'10px'},200);
    tst.appendTo($('body'));
}

function dequeue() {
    r(
        'post',
        '/user/events/dequeue',
        {fingerprint:FINGERPRINT},{},function(){}
    );
}

function refresh(data,force) {
    if (data.connection.update || force == true) {
        console.log(data);
        CONNECTION = data.connection;
        USER = data.user;
        $('#username input').val(USER.name);

        if (USER.events.length > 0) {
            var event = USER.events[0];
            if (event.type == 'toast') {
                toast(event.text,event.info);
                dequeue();
            }
        }
    }
}
function refresh_force(data) {
    refresh(data,true);
}

$(document).ready(function(){
    // Load cookies and create connection
    if (Cookies.get('fuid') == undefined) {
        Cookies.set('fuid',sha256((Math.random()*Date.now()+Math.random()).toString()));
    }
    FINGERPRINT = Cookies.get('fuid');
    r('post','/connections/new/',{fingerprint:FINGERPRINT},{},function(data){
        USERID = data.current_user;
    });
    r(
        'get',
        '/connections/self/',
        {fingerprint:FINGERPRINT},
        {},refresh_force
    );
    window.setInterval(function(){
        r(
            'get',
            '/connections/self/',
            {fingerprint:FINGERPRINT},
            {},refresh
        );
    },100);
    $('#username input').on('change',function(){
        r(
            'post',
            '/user/name/',
            {fingerprint:FINGERPRINT,name:$(this).val()},{},console.log
        );
    });
    $('.info-item').on('click',function(){
        $('.info-item-dialog').remove();
        var fthis = this;
        r(
            'get',
            '/info/',
            {infoName:$(this).attr('data-info')},{},function(data){
                var infoElement = $('<div class="info-item-dialog"></div>')
                .attr('id','#info-item-'+$(fthis).attr('id'))
                .css({
                    width:window.innerWidth*0.4,
                    height:window.innerHeight*0.4
                })
                .html(data.content);

                var pOffset = $(fthis).offset();
                var pHeight = $(fthis).height();
                var pWidth = $(fthis).width();

                if ($(fthis).attr('data-info-loc') == 'bottom') {
                    var eTop = pOffset.top + pHeight;
                    var eLeft = pOffset.left + pWidth/2 - infoElement.width()/2;
                } else if ($(fthis).attr('data-info-loc') == 'top') {
                    var eTop = pOffset.top - infoElement.height();
                    var eLeft = pOffset.left + pWidth/2 - infoElement.width()/2;
                } else if ($(fthis).attr('data-info-loc') == 'left') {
                    var eTop = pOffset.top - pHeight/2 + infoElement.height()/2;
                    var eLeft = pOffset.left - infoElement.width();
                } else if ($(fthis).attr('data-info-loc') == 'right') {
                    var eTop = pOffset.top - pHeight/2 + infoElement.height()/2;
                    var eLeft = pOffset.left + pWidth;
                } else {
                    var eTop = 0;
                    var eLeft = 0;
                }

                if (eTop + infoElement.height() > window.innerHeight) {
                    $(infoElement).css('height',window.innerHeight-eTop);
                }
                if (eTop < 0) {
                    $(infoElement).css('height',eTop+infoElement.height());
                    eTop = 0;
                }
                if (eLeft + infoElement.width() > window.innerWidth) {
                    $(infoElement).css('width',window.innerWidth-eLeft);
                }
                if (eLeft < 0) {
                    $(infoElement).css('height',eLeft+infoElement.width());
                    eLeft = 0;
                }

                $(infoElement).css({
                    top:eTop+'px',
                    left:eLeft+'px'
                });
                $(infoElement).appendTo($('body'));
                    }
                );
    });
    $(document).on('click',function(event){
        if (!($(event.target).parents('.info-item-dialog').length > 0 || $(event.target).hasClass('info-item-dialog') || $(event.target).hasClass('info-item'))) {
            $('.info-item-dialog').remove();
        }
    });
});
