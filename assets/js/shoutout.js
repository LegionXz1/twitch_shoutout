$(document).ready(function () {
    // Get values from URL string
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    localStorage.clear();

    function setRandomServer() {
        const servers = ["https://twitchapi.teklynk.com","https://twitchapi.teklynk.dev","https://twitchapi2.teklynk.dev"];
        const randomIndex = Math.floor(Math.random() * servers.length);
        return servers[randomIndex];
    }

    const apiServer = setRandomServer();
    let getChannel;
    let titleText;
    let clipDetailsText;
    let indexClip = 0;
    let client = '';
    let channelName = getUrlParameter('channel').toLowerCase().trim();
    let showClip = getUrlParameter('showClip');
    let showRecentClip = getUrlParameter('showRecentClip');
    let showMsg = getUrlParameter('showMsg');
    let showText = getUrlParameter('showText');
    let showDetails = getUrlParameter('showDetails').trim();
    let detailsText = getUrlParameter('detailsText').trim(); 
    let showImage = getUrlParameter('showImage');
    let ref = getUrlParameter('ref');
    let modsOnly = getUrlParameter('modsOnly');
    let timeOut = getUrlParameter('timeOut') || 10;
    let command = getUrlParameter('command').trim() || 'so';
    let customMsg = getUrlParameter('customMsg').trim();
    let customTitle = getUrlParameter('customTitle').trim();
    let dateRange = getUrlParameter('dateRange').trim();
    let raided = getUrlParameter('raided').trim() || "false";
    let raidCount = getUrlParameter('raidCount').trim() || "3";
    let delay = getUrlParameter('delay').trim() || "10";
    let themeOption = getUrlParameter('themeOption').trim();
    let userIsVip = false;

    if (channelName === '') alert('channel is not set in the URL');

    if (!dateRange || dateRange === "0") {
        dateRange = "";
    } else {
        let todayDate = new Date();
        let startDate = new Date(new Date().setDate(todayDate.getDate() - parseInt(dateRange)));
        startDate = startDate.toISOString().slice(0, 10);
        todayDate = todayDate.toISOString().slice(0, 10);
        dateRange = "&start_date=" + startDate + "T00:00:00Z&end_date=" + todayDate + "T00:00:00Z";
    }

    let replay = false;
    let watch = false;
    let clip_url = '';

    if (parseInt(themeOption) > 0) {
        $('head').append('<link rel="stylesheet" type="text/css" href="assets/css/theme' + themeOption + '.css">');
    }

    function game_title(game_id) {
        let $jsonParse = JSON.parse($.getJSON({
            'url': apiServer + "/getgame.php?id=" + game_id,
            'async': false
        }).responseText);
        return $jsonParse;
    }

    let getInfo = function (SOChannel, callback) {
        let urlU = apiServer + "/getuserinfo.php?channel=" + SOChannel;
        let xhrU = new XMLHttpRequest();
        xhrU.open("GET", urlU);
        xhrU.onreadystatechange = function () {
            if (xhrU.readyState === 4) callback(JSON.parse(xhrU.responseText));
        };
        xhrU.send();
    };

    let getStatus = function (SOChannel, callback) {
        let urlG = apiServer + "/getuserstatus.php?channel=" + SOChannel;
        let xhrG = new XMLHttpRequest();
        xhrG.open("GET", urlG);
        xhrG.onreadystatechange = function () {
            if (xhrG.readyState === 4) callback(JSON.parse(xhrG.responseText));
        };
        xhrG.send();
    };

    let getClips = function (SOChannel, callback) {
        let urlC = apiServer + "/getuserclips.php?channel=" + SOChannel + "" + dateRange + "&random=true";
        let xhrC = new XMLHttpRequest();
        xhrC.open("GET", urlC);
        xhrC.onreadystatechange = function () {
            if (xhrC.readyState === 4) callback(JSON.parse(xhrC.responseText));
        };
        xhrC.send();
    };

    let getClipUrl = function (id, callback) {
        let urlV = apiServer + "/getuserclips.php?id=" + id;
        let xhrV = new XMLHttpRequest();
        xhrV.open("GET", urlV);
        xhrV.onreadystatechange = function () {
            if (xhrV.readyState === 4) callback(JSON.parse(xhrV.responseText));
        };
        xhrV.send();
    };

    function detectURLs(chatmsg) {
        let urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
        return chatmsg.match(urlRegex)
    }

    if (ref) {
        client = new tmi.Client({
            connection: {reconnect: true},
            identity: { username: channelName, password: 'oauth:' + atob(ref) },
            channels: [channelName]
        });
    } else {
        client = new tmi.Client({
            connection: {reconnect: true},
            channels: [channelName]
        });
    }

    client.connect().catch(console.error);

    client.on('chat', (channel, userstate, message, self) => {
        if (self) return;
        userIsVip = (userstate && userstate.badges && userstate.badges.vip);
    });

    client.on('chat', (channel, user, message, self) => {
        if (self) return;

        if (message.includes('https://clips.twitch.tv/') || message.includes('/clip/')) {
            let chatClipUrl = detectURLs(message.trim());
            let urlArr = chatClipUrl[0].split('/');
            let clip_Id = message.includes('https://clips.twitch.tv/') ? urlArr[3].split('?')[0] : urlArr[5];
            getClipUrl(clip_Id, function (info) {
                if (info.data && info.data[0].clip_url) {
                    localStorage.setItem('twitchSOWatchClip', info.data[0].clip_url);
                }
            });
        }

        if (user['message-type'] === 'chat' && message.startsWith('!') && (user.mod || userIsVip || user.username === channelName)) {
            if (["!sostop", "!stopso", "!stopclip", "!clipstop", "!clipreload"].includes(message)) {
                window.location.reload();
            } else if (["!clipreplay", "!replayclip", "!soreplay", "!replayso"].includes(message)) {
                watch = false; replay = true;
                if (localStorage.getItem('twitchSOChannel')) doShoutOut(localStorage.getItem('twitchSOChannel'), true, false);
            } else if (message === "!watchclip") {
                watch = true; replay = false;
                if (localStorage.getItem('twitchSOWatchClip')) doShoutOut(channelName, false, true);
            } else if (message.startsWith('!' + command + ' ')) {
                if (document.getElementById("clip")) return;
                getChannel = message.substr(command.length + 1).replace('@', '').trim().toLowerCase();
                doShoutOut(getChannel);
            }
        }
    });

    function doShoutOut(getChannel, replayClip = false, watchClip = false) {
        if (document.getElementById("clip")) return;

        if (watchClip || replayClip) {
            clip_url = watchClip ? localStorage.getItem('twitchSOWatchClip') : localStorage.getItem('twitchSOClipUrl');
            if (document.getElementById("text-container")) $("#text-container").remove();
            if (document.getElementById("details-container")) $("#details-container").remove();
            
            $("<video id='clip' class='video fade' width='100%' height='100%' autoplay><source src='" + clip_url + "' type='video/mp4'></video>").appendTo("#container");
            document.getElementById("clip").onended = function() { $("#clip, #text-container, #details-container").remove(); };
            return;
        }

        getStatus(getChannel, function (info) {
            if (!info.data || info.data.length === 0) return;

            if (showMsg === 'true' && !replay && !watch) {
                let statusData = info.data[0];
                if (statusData['game_name']) {
                    let msg = customMsg ? customMsg.replace("{channel}", statusData['broadcaster_name']).replace("{game}", statusData['game_name']).replace("{title}", statusData['title']).replace("{url}", "https://twitch.tv/" + statusData['broadcaster_login']) : 
                              "Go check out " + statusData['broadcaster_name'] + "! They were playing: " + statusData['game_name'] + " - " + statusData['title'] + " - https://twitch.tv/" + statusData['broadcaster_login'];
                    client.say(channelName, decodeURIComponent(msg));
                } else {
                    client.say(channelName, "Go check out " + statusData['broadcaster_name'] + "! https://twitch.tv/" + statusData['broadcaster_login']);
                }
            }

            if (showClip === 'true' || showRecentClip === 'true') {
                getClips(getChannel, function (clipsInfo) {
                    if (clipsInfo.data && clipsInfo.data.length > 0) {
                        // RANDOM LOGIC
                        indexClip = Math.floor(Math.random() * clipsInfo.data.length);
                        let selectedClip = clipsInfo.data[indexClip];
                        let clip_url = selectedClip.clip_url;

                        $("#clip, #text-container, #details-container").remove();

                        if (showText === 'true') {
                            let title = customTitle ? customTitle.replace("{channel}", selectedClip['broadcaster_name']).replace("{url}", "twitch.tv/" + selectedClip['broadcaster_name'].toLowerCase()) : 
                                         "Go check out " + selectedClip['broadcaster_name'];
                            $("<div id='text-container' class='hide'><span class='title-text'>" + decodeURIComponent(title) + "</span></div>").appendTo("#container");
                        }

                        $("<video id='clip' class='video fade' width='100%' height='100%' autoplay><source src='" + clip_url + "' type='video/mp4'></video>").appendTo("#container");

                        if (showDetails === 'true') {
                            let dTxt = detailsText || "{title}\n{game}";
                            dTxt = dTxt.replace("{title}", selectedClip['title'] || "?")
                                       .replace("{channel}", selectedClip['broadcaster_name'])
                                       .replace("{creator_name}", selectedClip['creator_name'])
                                       .replace("{created_at}", moment(selectedClip['created_at']).format("MMMM D, YYYY"));
                            
                            if (selectedClip['game_id']) {
                                let g = game_title(selectedClip['game_id']);
                                dTxt = dTxt.replace("{game}", g.data[0]['name']);
                            }

                            let finalHtml = "";
                            dTxt.split(/\r?\n/).forEach((line, i) => { finalHtml += "<div class='details-text item-" + i + "'>" + line + "</div>"; });
                            $("<div id='details-container' class='hide'>" + finalHtml + "</div>").appendTo('#container');
                        }

                        setTimeout(() => { $("#text-container, #details-container").removeClass("hide"); }, 500);

                        let timer = 0;
                        let startTimer = setInterval(() => {
                            timer++;
                            if (timer >= parseInt(timeOut)) {
                                $("#clip, #text-container, #details-container").remove();
                                clearInterval(startTimer);
                            }
                        }, 1000);

                        document.getElementById("clip").onended = function() {
                            $("#clip, #text-container, #details-container").remove();
                            clearInterval(startTimer);
                        };

                        localStorage.setItem('twitchSOClipUrl', clip_url);
                        localStorage.setItem('twitchSOChannel', getChannel);

                    } else if (showImage === 'true') {
                        getInfo(getChannel, function (uInfo) {
                            let userImage = uInfo.data[0]['profile_image_url'];
                            if (showText === 'true') $("<div id='text-container'><span class='title-text'>Go check out " + uInfo.data[0]['display_name'] + "</span></div>").appendTo("#container");
                            $("<img id='profile' class='fade img-fluid' src='" + userImage + "'>").appendTo("#container");
                            setTimeout(() => { $("#profile, #text-container, #details-container").remove(); }, 5000);
                        });
                    }
                });
            }
        });
    }

    if (raided === "true") {
        client.on("raided", (channel, username, viewers) => {
            if (viewers >= parseInt(raidCount)) {
                setTimeout(() => { doShoutOut(username); }, parseInt(delay) * 1000);
            }
        });
    }
});
