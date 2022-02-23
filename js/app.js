"use strict";
var AudioPlayer, currentPlay = 0;

function Log(txt, status = false) {
    $('#app .main .selFile .inputAera .textAera h4').html(txt);
    if (status == false) {
        $('#app .main .selFile .inputAera .textAera h4').removeClass();
    } else if (status == 1) {
        $('#app .main .selFile .inputAera .textAera h4').addClass('success');
    } else if (status == 2) {
        $('#app .main .selFile .inputAera .textAera h4').addClass('error');
    }
}

function toBinary(string) {
    const codeUnits = new Uint16Array(string.length);
    for (let i = 0; i < codeUnits.length; i++) {
        codeUnits[i] = string.charCodeAt(i);
    }
    return btoa(String.fromCharCode(...new Uint8Array(codeUnits.buffer)));
}

function Reset() {
    if (AudioPlayer !== undefined) {
        AudioPlayer.pause();
        AudioPlayer = undefined;
        $('.tmp-' + currentPlay).removeClass('active');
        currentPlay = 0;
        $('#app').css('background-image', '');
    }
}

function readData(fn, num) {
    Reset();
    var File = $('#inputFile')[0].files[0];
    $('#app .main .content .loading').css('display', 'flex');
    JSZip.loadAsync(File)
        .then(function(zip) {
            zip.file(Base64.decode(fn)).async("text").then(function(data) {
                if (data !== '') {
                    var AFN_N = data.indexOf("AudioFilename");
                    var BG_N = data.indexOf("//Background and Video events");
                    var AudioFileName = String(data.substr(AFN_N + 15, 1000).split("\n")[0].slice(0, -1));
                    var BG_FileName = data.substr(BG_N + 29, 1000).split("\n")[1].split(',')[2].substring(1).slice(0, -1);
                    zip.file(BG_FileName).async("Uint8Array").then(function(data) {
                        var BG_BLOB = new Blob([data]);
                        var BG_DATA = URL.createObjectURL(BG_BLOB);
                        $('#app').css('background-image', 'linear-gradient(rgba(0,0,0,.7), rgba(0,0,0,.7)), url(' + BG_DATA + ')');
                    });
                    zip.file(AudioFileName).async("Uint8Array").then(function(data) {
                        $('#app .main .content .loading').hide();
                        var Audio_BLOB = new Blob([data]);
                        var Audio_DATA = URL.createObjectURL(Audio_BLOB);
                        AudioPlayer = new Howl({
                            src: Audio_DATA,
                            html5: true,
                            preload: true,
                            onstop: function() {
                                Reset();
                            }
                        });
                        AudioPlayer.play();
                        currentPlay = num;
                        $('.tmp-' + num).addClass('active');
                        $('.tmp-' + num + ' .pauseBtn').click(function() {
                            AudioPlayer.pause();
                            $('.tmp-' + num + ' .playTmpBtn').show();
                            $(this).hide();
                        });
                        $('.tmp-' + num + ' .playTmpBtn').click(function() {
                            AudioPlayer.play();
                            $('.tmp-' + num + ' .pauseBtn').show();
                            $(this).hide();
                        });
                    });
                } else {
                    mdui.snackbar({
                        message: 'Error: Cannot read file! (FILE_EMPTY)',
                    });
                }
            });
        }, function(e) {
            $('.nobmLoad').show();
            $('#app .main .content .loading').hide();
            mdui.snackbar({
                message: "Error reading " + File.name + ": " + e.message
            });
            throw ("Error reading " + File.name + ": " + e.message);
        });

}

$('.resetBtn').click(function() {
    var Input = $('#inputFile');
    Input.val('');
    mdui.snackbar({
        message: 'Resetted! Please choose again.',
    });
    $('.nobmLoad').show();
    $('.fileList #fileLoadded').empty();
    Log('drag file here or click to select file!');
    Reset();
});


$('#inputFile').on('change', function(evt) {
    if (evt.target.files.length > 0) {
        var filename = $(this).val().split('\\').pop();
        var mimetype = $(this).val().split('\\').pop().split('.').pop();
        if (mimetype !== 'osz') {
            mdui.snackbar({
                message: 'Invalid file format. Only .osz file is supported!',
            });
            $('#inputFile').val('');
            var tmp = $('#app .main .selFile .inputAera .textAera h4').text();
            Log('invalid file format!', 2);
            setTimeout(function() {
                Log(tmp);
            }, 4000);
        } else {
            $('.fileList #fileLoadded').empty();
            Reset();
            Log(filename);
            var f = evt.target.files[0];
            $('#app .main .selFile .inputAera .loading').css('display', 'flex');
            JSZip.loadAsync(f)
                .then(function(zip) {
                    Log(filename, 1);
                    $('#app .main .selFile .inputAera .loading').hide();
                    $('.nobmLoad').hide();
                    zip.forEach(function(relativePath, zipEntry, filename) { // 2) print entries
                        var EntryName = zipEntry.name.toString();
                        let randomNum = Math.floor(Math.random() * 1000000);
                        if (EntryName.split('.').pop() === 'osu') {
                            $('.fileList #fileLoadded').append(`
                    <div  class="mdui-list-item mdui-ripple Pl-list tmp-` + randomNum + `">
                        <div class="control">
                            <button onclick='readData("` + Base64.encode(zipEntry.name) + `", "` + randomNum + `")' class="playBtn mdui-btn mdui-btn-icon mdui-ripple">
                                <i class="mdui-icon material-icons">play_arrow</i>
                            </button>
                            <button class="pauseBtn mdui-btn mdui-btn-icon mdui-ripple">
                                <i class="mdui-icon material-icons">pause</i>
                            </button>
                            <button class="playTmpBtn mdui-btn mdui-btn-icon mdui-ripple">
                                <i class="mdui-icon material-icons">play_arrow</i>
                            </button>
                        </div>
                        <div class="mdui-list-item-content">` + zipEntry.name + `</div>
                        <i class="isPlay mdui-list-item-icon mdui-icon material-icons">chevron_left</i>
                    </div>
                    `);
                        }
                    });
                }, function(e) {
                    $('.nobmLoad').show();
                    mdui.snackbar({
                        message: "Error reading " + f.name + ": " + e.message
                    });
                    throw ("Error reading " + f.name + ": " + e.message);
                });
        }
    }
});