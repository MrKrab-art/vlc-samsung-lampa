/* VLC Samsung 2022+ external player integration, v0.9.1. LGPL-2.1-or-later. */
(function(root){'use strict';
 var ID='VlcWasm001.Player',KEY='vlc_samsung',started=false,explicit=null,launchSerial=0,inFlight=false,wasHidden=false,returnUntil=0;
 function guardReturn(){if(inFlight){returnUntil=Date.now()+1000;inFlight=false;}}
 function notice(text){if(root.Lampa&&Lampa.Noty)Lampa.Noty.show(text);}
 function torrAuth(url){if(!Lampa.Storage.field('torrserver_auth')||!Lampa.Torserver||typeof Lampa.Torserver.url!=='function')return null;var media=new URL(url),server=new URL(Lampa.Torserver.url());if(media.origin!==server.origin)return null;var user=String(Lampa.Storage.get('torrserver_login')||''),pass=String(Lampa.Storage.value?Lampa.Storage.value('torrserver_password'):Lampa.Storage.get('torrserver_password')||'');if(user.length>1024||pass.length>1024)throw Error('Слишком длинные данные авторизации TorrServer');return {origin:media.origin,username:user,password:pass};}
 function init(){if(started||root.__vlcSamsungLampa||!root.Lampa||!Lampa.Player||!Lampa.Params)return;started=true;
  if(!root.tizen||!tizen.application||typeof tizen.application.launchAppControl!=='function'){notice('VLC Samsung: запуск доступен в установленном Tizen-приложении с Application API');return;}
  if(root.document&&document.addEventListener){document.addEventListener('visibilitychange',function(){if(document.hidden&&inFlight)wasHidden=true;else if(!document.hidden&&wasHidden){wasHidden=false;guardReturn();}});['keydown','keyup'].forEach(function(name){document.addEventListener(name,function(e){if((e.keyCode===10009||e.keyCode===27)&&Date.now()<returnUntil){e.preventDefault();e.stopImmediatePropagation();}},true);});}
  if(typeof Lampa.Player.runas==='function'){var runas=Lampa.Player.runas;Lampa.Player.runas=function(need){explicit=need||null;return runas.apply(this,arguments);};}
  root.__vlcSamsungLampa=true;root.__vlcSamsungLampaVersion='0.9.1';var values=Lampa.Params.values||{};['player','player_torrent'].forEach(function(name){var choices=values[name];if(!choices||typeof choices!=='object')return;choices[KEY]='VLC Samsung 2022+';});
  Lampa.Player.listener.follow('create',function(event){var data=event.data||{},setting=data.torrent_hash?'player_torrent':'player',selected=data.launch_player||explicit||Lampa.Storage.field(setting);if(selected!==KEY)return;event.abort();
   var url=data.url;if(data.quality&&Lampa.Player.getUrlQuality)url=Lampa.Player.getUrlQuality(data.quality,false)||url;
   try{if(Lampa.Torserver&&Lampa.Torserver.toPlayUrl)url=Lampa.Torserver.toPlayUrl(url);if(typeof url!=='string'||!/^https?:\/\/[^\s]+$/i.test(url)||url.length>16384)throw Error('Нужна прямая HTTP/HTTPS ссылка на видеофайл');
    if(/\.m3u8(?:[?#]|$)|\.mpd(?:[?#]|$)/i.test(url))throw Error('HLS/DASH в этой сборке VLC пока не поддерживаются');
    var payload={version:1,requestId:Date.now().toString(36)+'-'+(++launchSerial),url:url,title:String(data.title||data.path||'Видео').replace(/<[^>]*>/g,'').slice(0,256),position:Math.max(0,Math.min(9e12,(Number(data.timeline&&data.timeline.time)||0)*1000))};
    var auth=torrAuth(url);if(auth)payload.auth=auth;
    var control=new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/view',url,'video/*',null,[new tizen.ApplicationControlData('vlc.request',[JSON.stringify(payload)])]);
    inFlight=true;tizen.application.launchAppControl(control,ID,function(){if(Lampa.Player.listener)Lampa.Player.listener.send('external',data);},function(error){inFlight=false;notice('VLC Samsung: '+(error.name||'ошибка')+'. Установите WGT 0.8+; Lampa должна разрешать запуск приложений.');},{onsuccess:function(result){guardReturn();if(Lampa.Player.listener)Lampa.Player.listener.send('external_return',result);},onfailure:function(){guardReturn();notice('VLC Samsung: запрос воспроизведения отклонён');}});
   }catch(error){notice('VLC Samsung: '+(error.message||String(error)));}
  });
 }
 if(root.appready)init();else if(root.Lampa&&Lampa.Listener)Lampa.Listener.follow('app',function(e){if(e.type==='ready')init();});else root.addEventListener('load',init);
}(window));
