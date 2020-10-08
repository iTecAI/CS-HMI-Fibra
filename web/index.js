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

function refresh(data,force) {
    if (data.connection.update || force == true) {
        console.log(data);
        CONNECTION = data.connection;
        USER = data.user;
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
});
