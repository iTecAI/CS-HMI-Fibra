var FINGERPRINT = null;
var USERID = null;
var CONNECTION = {};
var USER = {};
var ORIGIN = [window.innerWidth/2,window.innerHeight/2];
var CONVERSION = 1;

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
    //if (data.connection.update || force == true) {
    if (true) {
        CONNECTION = data.connection;
        USER = data.user;
        $('#username input').val(USER.name);

        if (USER.events.length > 0) {
            var event = USER.events[0];
            if (event.type == 'toast') {
                toast(event.text,event.info);
            }

            dequeue();
        }

        r(
            'get',
            '/server/',
            {},{},function(data){
                CONVERSION = Number(data.conversion_rate);
                $('#amt-dollars > span > span').text(USER.dollars);
                $('#amt-fibra > span > span').text(USER.funds);
                $('#conv-val > span').text(CONVERSION);
            }
        );

        var inv = USER.inventory;
        var invids = [];
        for (var i=0;i<inv.length;i++){
            invids.push(inv[i].id);
            if (
                $(
                    '#inv-item-'+inv[i].id).length == 0 
                    || (
                        $('#inv-item-'+inv[i].id).attr('data-for-sale') != inv[i].for_sale.toString() 
                        && $('#inv-item-'+inv[i].id).attr('data-for-sale') != undefined
                    )
                    || (
                        $('#inv-item-'+inv[i].id).attr('data-price') != inv[i].price.toString() 
                        && $('#inv-item-'+inv[i].id).attr('data-price') != undefined
                    )|| (
                        $('#inv-item-'+inv[i].id).attr('data-name') != inv[i].name.toString() 
                        && $('#inv-item-'+inv[i].id).attr('data-name') != undefined
                    )
            ) {
                $('<div class="inv-item"></div>')
                .attr({
                    id:'inv-item-'+inv[i].id,
                    'data-id':inv[i].id,
                    'data-for-sale':inv[i].for_sale,
                    'data-name':inv[i].name,
                    'data-price':inv[i].price
                })
                .append(
                    $('<input class="inv-item-name">')
                    .val(inv[i].name)
                    .on('change',function(){
                        r(
                            'post',
                            '/user/items/edit/'+$(this).parents('.inv-item').attr('data-id')+'/',
                            {
                                fingerprint:FINGERPRINT,
                                key:'name',
                                value:$(this).val()
                            },{},function(){}
                        );
                    })
                    )
                .append(
                    $('<input class="inv-item-price">')
                    .val(inv[i].price)
                    .on('change',function(){
                        r(
                            'post',
                            '/user/items/edit/'+$(this).parents('.inv-item').attr('data-id')+'/',
                            {
                                fingerprint:FINGERPRINT,
                                key:'price',
                                value:$(this).val()
                            },{},function(){}
                        );
                    })
                )
                .append(
                    $('<input class="inv-item-for-sale" type="checkbox">')
                    .prop('checked',inv[i].for_sale)
                    .on('change',function(){
                        r(
                            'post',
                            '/user/items/edit/'+$(this).parents('.inv-item').attr('data-id')+'/',
                            {
                                fingerprint:FINGERPRINT,
                                key:'for_sale',
                                value:$(this).prop('checked')
                            },{},function(){}
                        );
                    })
                )
                .append($('<div class="for-sale-title"><span>For Sale</span></div>'))
                .appendTo($('#in-content'));
            }
        }

        var located = [];
        var inv_els = $('.inv-item').toArray();
        for (var e=0;e<inv_els.length;e++) {
            if (!invids.includes($(inv_els[e]).attr('data-id')) || located.includes($(inv_els[e]).attr('data-id'))) {
                $('#'+$(inv_els[e]).attr('id')).remove()
            } else {
                located.push($(inv_els[e]).attr('data-id'));
            }
        }

        r(
            'get',
            '/user/all/',{},{},function(data){
                var ks = Object.keys(data);
                var all_items = [];
                for (var u=0;u<ks.length;u++) {
                    var items = data[ks[u]].for_sale;
                    if (items.length > 0) {
                        for (var i=0;i<items.length;i++) {
                            var item = items[i];
                            all_items.push(item.id);
                            if ($('#mp-item-'+item.id).length == 0) {
                                $('<div></div>')
                                .addClass('mp-item')
                                .attr('id','mp-item-'+item.id)
                                .attr('data-id',item.id)
                                .attr('data-suid',item.seller)
                                .attr('data-price',item.price)
                                .append(
                                    $('<div></div>')
                                    .addClass('mp-item-content')
                                    .append(
                                        $('<span class=\'mp-item-title\'></span>')
                                        .text(item.name)
                                    )
                                    .append(' - <span class=\'mp-dollar\'>≋</span>')
                                    .append(
                                        $('<span class=\'mp-item-cost\'></span>')
                                        .text(item.price)
                                    )
                                    .append('<br>Sold By: ')
                                    .append(
                                        $('<span class=\'mp-item-seller\'></span>')
                                        .text(item.seller_name)
                                    )
                                )
                                .append(
                                    $('<button class=\'mp-item-buy\'><img src=\'assets/add-to-cart.png\'></button>')
                                    .prop('disabled',USER.funds < item.price)
                                    .on('click',function(){
                                        var dat = {
                                            name:$(this).parents('.mp-item').children('.mp-item-content').children('.mp-item-title').text(),
                                            price:Number($(this).parents('.mp-item').attr('data-price')),
                                            id:$(this).parents('.mp-item').attr('data-id'),
                                            uid:$(this).parents('.mp-item').attr('data-suid'),
                                            fingerprint:FINGERPRINT
                                        };
                                        console.log(dat);
                                        r(
                                            'post',
                                            '/user/items/purchase',
                                            dat,
                                            {},console.log
                                        );
                                    })
                                )
                                .appendTo($('#mp-content'));
                            }
                        }
                    }
                }
                $('.mp-item').each(function(){
                    if (!all_items.includes($(this).attr('data-id'))) {
                        $(this).remove();
                    }
                });
            }
        );
    }
}
function refresh_force(data) {
    refresh(data,true);
}

function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}
function radians_to_degrees(radians)
{
  var pi = Math.PI;
  return radians * (180/pi);
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

                if (eLeft + infoElement.width() > window.innerWidth) {
                    $(infoElement).css('width',window.innerWidth-eLeft-15);
                }
                if (eLeft < 0) {
                    $(infoElement).css('width',eLeft+infoElement.width());
                    eLeft = 0;
                }

                $(infoElement).css({
                    top:eTop+'px',
                    left:eLeft+'px',
                    height:'fit-content'
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

    $('#fibra-convert').on('keyup',function(event){
        if (Number($(event.delegateTarget).val()) > USER.funds-1) {
            $(event.delegateTarget).val(USER.funds-1);
        }
        if (Number($(event.delegateTarget).val()) < 0) {
            $(event.delegateTarget).val(0);
        }
        $(event.delegateTarget).val(Number($(event.delegateTarget).val()).toFixed(0));
        $('#dollar-convert').val(Number($(event.delegateTarget).val())*CONVERSION);
    });
    $('#dollar-convert').on('keyup',function(event){
        if (Number($(event.delegateTarget).val()) > USER.dollars-1) {
            $(event.delegateTarget).val(USER.dollars-1);
        }
        if (Number($(event.delegateTarget).val()) < 0) {
            $(event.delegateTarget).val(0);
        }
        $(event.delegateTarget).val(Number($(event.delegateTarget).val()).toFixed(0));
        $('#fibra-convert').val(Number($(event.delegateTarget).val())/CONVERSION);
    });
    $('#conv-ftd').on('click',function(){
        $('#dollar-convert').val(Number($('#dollar-convert').val()).toFixed(0));
        $('#fibra-convert').val(Number($('#fibra-convert').val()).toFixed(0));
        $('#dollar-convert').val(Number($('#fibra-convert').val())*CONVERSION);
        if (Number($('#fibra-convert').val()) > USER.funds) {
            $('#fibra-convert').val(USER.funds);
        }
        $('#fibra-convert').val(Number($('#fibra-convert').val()).toFixed(0));
        if (Number($('#fibra-convert').val()) == 0) {
            return;
        }
        r(
            'post',
            '/user/funds/edit/',
            {
                fingerprint: FINGERPRINT,
                fibra: Number(USER.funds) - Number($('#fibra-convert').val()),
                dollars: USER.dollars + Number($('#dollar-convert').val())
            },{},function(){}
        );
    });
    $('#conv-dtf').on('click',function(){
        $('#dollar-convert').val(Number($('#dollar-convert').val()).toFixed(0));
        $('#fibra-convert').val(Number($('#fibra-convert').val()).toFixed(0));
        $('#fibra-convert').val(Number($('#dollar-convert').val())/CONVERSION);
        $('#fibra-convert').val(Number($('#fibra-convert').val()).toFixed(0));
        if (Number($('#dollar-convert').val()) > USER.dollars) {
            $('#dollar-convert').val(USER.dollars);
        }
        if (Number($('#dollar-convert').val()) == 0) {
            return;
        }
        r(
            'post',
            '/user/funds/edit/',
            {
                fingerprint: FINGERPRINT,
                fibra: Number(USER.funds) + Number($('#fibra-convert').val()),
                dollars: USER.dollars - Number($('#dollar-convert').val())
            },{},function(){}
        );
    });
});
