let recorder;
let mediaStream;
let videoElement = document.getElementById('video');
let startButton = document.getElementById('start');
let stopButton = $('#stop');
let questionArr = [];
let currentQuestionNumber = 0;
let nextQuestionButton = document.getElementById('nextQuestion');
let submitButton = document.getElementById('submit');
let questionId = 0;
let recordedFiles = [];
let pythonServer = 'http://127.0.0.1:5000/';
let pname = '';
let email = '';
let role = 'viasimple';
let fileName = '';
let questionToAsk = 3;
let uniquename = '';
let env = 'prod';
let video_id ='';
let videoArray = []
let preparationTime = 0;
let questions;

window.onload = onLoad;

$('#registrationForm').on('submit', function (event) {

    event.preventDefault();

    // Clear previous error messages
    $('.error-message').hide();

    let isValid = true;

    // Name validation
    const name = $('#name').val().trim();
    if (name === '') {
        $('#nameError').text('Name is required.').show();
        isValid = false;
    }

    // Email validation
    email = $('#email').val().trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        $('#emailError').text('Invalid email address.').show();
        isValid = false;
    }


    if (isValid) {
        $('.profile').hide();
        $('.experiment').show();
        $('.endcall').hide();
        $("#start").attr("disabled", true);

        pname = $('#name').val();
        email = $('#email').val();

        $('#stop').hide();
        $('#nextQuestion').hide();
        $('#submit').hide();
        startRecording().then(() => {
            if (env == 'prod') {
                //prepareVideo(-1, "Hello " + pname + ", welcome to your interview.").then(function (response) {
                //if (video_id) {
                setTimeout(function () {
                    let videoid = '77c3961b-84db-4ec5-91cc-a679bb6af7fe'
                    syncVideo(videoid);
                }, preparationTime);
                //}

                // else {
                //     textToSpeech("Hello " + pname + ", welcome to your interview.").then(function () {
                //         $("#start").removeAttr("disabled");
                //     });
                // }
                // });

            } else {
                textToSpeech("Hello " + pname + ", welcome to your interview.").then(function () {
                    $("#start").removeAttr("disabled");
                })
            }

        });
    }
})

function syncVideo(video_id, showSubmitButton = false) {
    console.log(new Date().toLocaleTimeString());
    getVideo(video_id).then(function (res1) {
        res = JSON.parse(res1);
        if (res) {
            if (res.status == "in_progress") {
                setTimeout(function () {
                    syncVideo(video_id);
                }, 10000);
            } else if (res.status == 'complete') {
                let video_url = res.download;
                let duration = res.duration;
                let delayTime = preparationTime;
                if (duration) {
                    var drr = duration.split(':')
                    if (drr && drr.length >= 3) {
                        delayTime = convertToMilliseconds(drr[0], drr[1], drr[2]);
                    }
                }
                $('#avatarVideo').attr('src', video_url);
                if (showSubmitButton == true) {
                    setTimeout(function () {
                        $('#submit').show();
                        $('#submit').removeAttr('disabled')
                        startRecording();
                    }, delayTime);
                } else {
                    // if (env == 'prod') {
                    //     $('#avatar').hide();
                    //     $('#avatarVideo').show();
                    // }
                    setTimeout(function () {
                        $("#start").removeAttr("disabled");
                    }, delayTime);
                }
            }
            else {
                console.log('getVideo error occured 1');
            }
        }
        else {
            console.log('getVideo error occured 2');
        }
    })
}

// Function to stop recording and save video
stopButton.click(() => {
    recorder.stopRecording(() => {
        $('.endCall').show();
        $('.experiment').hide();
        $('.profile').hide();

        videoElement.srcObject.getTracks().forEach(track => track.stop());
        mediaStream.getTracks().forEach(track => track.stop());

    });
});

function convertToMilliseconds(hours, minutes, seconds) {
    const hoursToMilliseconds = hours * 3600 * 1000;
    const minutesToMilliseconds = minutes * 60 * 1000;
    const secondsToMilliseconds = seconds * 1000;

    return hoursToMilliseconds + minutesToMilliseconds + secondsToMilliseconds;
}

// // Function to start recording
start.addEventListener('click', async () => {
    $('#start').hide();
    startInterview();
});

nextQuestionButton.addEventListener('click', () => {
    $('#nextQuestion').attr('disabled', true);
    nextQuestion();
});

submitButton.addEventListener('click', () => {
    $('#submit').attr('disabled', true);
    currentQuestionNumber++;
    stopRecording(true).then((resolve) => {
        $('#nextQuestion').show();
        $('#nextQuestion').removeAttr('disabled');
    });

});

function onLoad() {
    $('.profile').show();
    $('.experiment').hide();
    $('.endCall').hide();
    //$('#avatarVideo').hide();
    $('#startButton').attr('disabled', true)

    questionArr = [];
    videoArray = [];
    uniquename = getUniqueNameFromDate();
    currentQuestionNumber = 0;
    recordedFiles = [];

    getQuestions(role).then((response) => {
        if (response) {
            questions = response;
            if (env == 'prod') {
                if (questions) {
                    for (let m = 0; m < questions.length; m++) {
                        let item = questions[m];
                        questionId = item['id'];
                        questionName = item['question'];
                        if (!item['video_id']) {
                            prepareVideo(questionId, questionName);
                        } else {
                            let obj =
                            {
                                "questionId": questionId,
                                "video_id": item['video_id']
                            };
                            videoArray.push(obj);
                        }
                    }
                }
            }
        }
    });

}

function startInterview() {
    $('.endCall').hide();
    $('.experiment').show();
    $('#submit').hide();

    startRecording().then(() => {
        nextQuestion();
    });
}

function prepareVideo(questionId, text) {
    return new Promise((resolve, reject) => {
        let title = "Question_" + questionId
        return textToVideo(text, title).then(function (response) {
            if (response) {
                let res = JSON.parse(response);
                if (res) {
                    video_id = res.id;
                    let obj =
                    {
                        "questionId": questionId,
                        "video_id": video_id
                    };
                    videoArray.push(obj);
                    resolve(res);
                }
            }
        });
    });
}

function stopRecording(saveVideo = true) {
    return new Promise((resolve, reject) => {
        console.log(new Date().toLocaleTimeString());
        return recorder.stopRecording(() => {
            if (saveVideo === true) {
                uniquename = getUniqueNameFromDate();
                let blob = recorder.getBlob();
                let url = URL.createObjectURL(blob);
                console.log(new Date().toLocaleTimeString());
                return uploadFile(blob).then(() => {
                    console.log(new Date().toLocaleTimeString());
                    return convertBlobToText(recordedFiles[recordedFiles.length - 1]).then((response) => {
                        console.log(new Date().toLocaleTimeString());
                        var answer = '';
                        if (response && response.text) {
                            answer = response.text;
                        }

                        if (answer == '') {
                            answer = 'No answer given';
                        }
                        saveTextToFile(email, questionId, questionName, answer, uniquename + '.mp4').then(() => {
                            console.log(new Date().toLocaleTimeString());
                            console.log('Response saved');

                            if (currentQuestionNumber == questionToAsk) {
                                videoElement.srcObject.getTracks().forEach(track => track.stop());
                                mediaStream.getTracks().forEach(track => track.stop());
                                recorder.destroy()
                                recorder = null;


                                let mergeVideoArr = [];
                                for (let j = 0; j < questions.length; j++) {
                                    let title = 'Question_' + questions[j].id;
                                    mergeVideoArr.push(title + '.mp4')
                                    mergeVideoArr.push(recordedFiles[j]);
                                }

                                let outputVideo = 'merge_video_' + pname.replace(' ', '_') + '.mp4';
                                mergeVideo(mergeVideoArr, outputVideo).then((response) => {
                                    $('.endCall').show();
                                    $('.experiment').hide();
                                    $('.profile').hide();
                                });

                            }
                        });
                        resolve('Resolved!');
                    });
                });
            }
            // Stop the video stream
            //videoElement.srcObject.getTracks().forEach(track => track.stop());
            resolve('Resolved!');
        });
    });
}

function mergeVideo(mergeVideoArr, merge_video_name) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: pythonServer + 'api/combine-video',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 'video_arr': mergeVideoArr, 'merge_video_name': merge_video_name }),  // Send the string array as JSON
            success: function (response) {
                console.log('Response from server:', response);
                resolve(response);
            },
            error: function (xhr, status, error) {
                resolve(error);
                console.log('Error:', error);
            }
        });
    });
}

function getQuestions(role) {
    return new Promise((resolve, reject) => {
        var url = pythonServer + 'api/next-question';
        var data = {
            "role": role
        }

        $.ajax({
            url: url,
            data: JSON.stringify(data),
            headers: {
                'Accept': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            type: 'POST',
            success: function (response) {
                resolve(response);
            },
            error: function (xhr, status, error) {
                // Handle errors
                resolve(false);
                console.error('Error:', status, error);
            }
        });
    });

}

function nextQuestion() {
    if (currentQuestionNumber < questionToAsk) {

        let item = questions[currentQuestionNumber];
        questionId = item['id'];
        questionName = item['question'];
        if (env == 'prod') {
            let video = videoArray.filter(x => x.questionId == questionId);
            if (video && video[0]) {
                let video_id = video[0].video_id;
                setTimeout(function () {
                    syncVideo(video_id, true);
                }, preparationTime);
            }
        } else {
            textToSpeech(questionName, true).then(() => {
                startRecording();
            });
        }

    } else {
        $('.endCall').show();
        $('.experiment').hide();
    }
}

function convertBlobToText(fileName) {
    return new Promise((resolve, reject) => {
        let audio = fileName.indexOf('.mp4') > -1 ? fileName.replace('.mp4', '.wav') : fileName;
        let videoFileName = 'uploads/' + fileName;
        let audioFileName = 'uploads/' + audio;

        data = { "video_file": videoFileName, "audio_file": audioFileName };

        $.ajax({
            url: pythonServer + 'api/video-to-text',
            data: JSON.stringify(data),
            headers: {
                'Accept': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            type: 'POST',
            success: function (response) {
                return resolve(response);;
            },
            error: function (xhr, status, error) {
                resolve(false);
                // Handle errors
                console.error('Error:', status, error);
            }
        })
    });
}

function saveTextToFile(email, questionid, question, answer, fileName) {
    return new Promise((resolve, reject) => {
        data = { "email": email, 'questionid': questionid, 'question': question, 'answer': answer, 'videofile': fileName };

        $.ajax({
            url: pythonServer + '/api/save-response',
            data: JSON.stringify(data),
            headers: {
                'Accept': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            type: 'POST',
            success: function (response) {
                return resolve(response);;
            },
            error: function (xhr, status, error) {
                console.error('Error:', status, error);
            }
        })

    });
}

function textToSpeech(question, showSubmitButton = false) {
    return new Promise((resolve, reject) => {
        var url = pythonServer + 'api/text-to-speech';

        var data = {
            "item_text": question
        }

        $.ajax({
            url: url,
            data: JSON.stringify(data),
            headers: {
                'Accept': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            type: 'POST',
            success: function (response) {
                if (showSubmitButton == true) {
                    setTimeout(function () {
                        $('#submit').show();
                        $('#submit').removeAttr('disabled')
                    }, preparationTime);
                }
                resolve(true);
            },
            error: function (xhr, status, error) {
                resolve(false);
                // Handle errors
                console.error('Error:', status, error);
            }
        });

    });
}

function textToVideo(question, title) {
    return new Promise((resolve, reject) => {
        data = { "question_text": question, "question_title": title };

        $.ajax({
            url: pythonServer + '/api/question-to-video',
            data: JSON.stringify(data),
            headers: {
                'Accept': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            type: 'POST',
            success: function (response) {
                return resolve(response);;
            },
            error: function (xhr, status, error) {
                console.error('Error:', status, error);
            }
        })

    });
}

function getVideo(video_id) {
    return new Promise((resolve, reject) => {
        data = { "video_id": video_id };

        $.ajax({
            url: pythonServer + '/api/get_video',
            data: JSON.stringify(data),
            headers: {
                'Accept': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            type: 'POST',
            success: function (response) {
                return resolve(response);;
            },
            error: function (xhr, status, error) {
                console.error('Error:', status, error);
            }
        })
    });
}


function uploadFile(recordedBlob) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        // generating a random file name
        fileName = uniquename + '.webm';
        recordedFiles.push(uniquename + '.mp4');

        formData.append('file', recordedBlob, fileName);

        $.ajax({
            url: pythonServer + 'api/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                $('#response').text('File uploaded successfully: ' + response.filename);
                resolve(true);
            },
            error: function (xhr, status, error) {
                $('#response').text('Error uploading file: ' + error);
                resolve(false);
            }
        });
    });

}

function startRecording() {
    return new Promise((resolve, reject) => {
        return navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                videoElement.srcObject = stream;
                mediaStream = stream;
                videoElement.play();

                recorder = new RecordRTC(stream, {
                    type: 'video',
                    mimeType: 'video/webm',
                    bitsPerSecond: 128000,
                    frameInterval: 90,
                    disableLogs: true
                });

                recorder.startRecording();
                stopButton.disabled = false;
                resolve(true);
            })
            .catch((error) => {
                resolve(false);
                console.error('Error accessing media devices:', error);
            });

    });
}

function getUniqueNameFromDate() {
    // Get the current date and time
    const now = new Date();

    // Extract date and time components
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    // Create a unique name by combining the date and time components
    const uniqueName = `${year}${month}${day}_${hours}${minutes}${seconds}_${milliseconds}`;

    return uniqueName;
}


