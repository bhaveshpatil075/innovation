let recorder;
let videoElement = document.getElementById('video');
let startButton = document.getElementById('start');
let stopButton = $('#stop');
let downloadLink = document.getElementById('download');
let questionNumbers = [];
let currentQuestionNumber = 0;
let nextQuestionButton = document.getElementById('nextQuestion');
// let skipQuestionButton = document.getElementById('skipQuestion');
let questionId = 0;
let downloadAudioLink = document.getElementById('download-audio');
let recordedFiles = [];
let pythonServer = 'http://127.0.0.1:5000/';
let pname = '';
let email = '';
let role = 'admin';
let fileName = '';
let questionToAsk = 3;
let uniquename = getUniqueNameFromDate();
let env = 'local'
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

    // Role validation
    //role = $('#role').val();
    // if (role === '') {
    //     $('#roleError').text('Please select a role.').show();
    //     isValid = false;
    // }

    if (isValid) {
        $('.profile').hide();
        $('.experiment').show();
        $('.endcall').hide();

        pname = $('#name').val();
        email = $('#email').val();
        // role = $('#role').val();

        $('#stop').hide();
        //$('#skipQuestion').hide();
        $('#nextQuestion').hide();
        startRecording().then(() => {
            if (env === 'prod') {
                textToVideo("Hello " + pname + ", welcome to your interview.").then(function (response) {
                    if (response) {
                        let res = JSON.parse(response);
                        if (res['data']) {
                            let video_id = res['data'].video_id;
                            console.log(new Date().toLocaleTimeString());
                            setTimeout(function () {
                                syncVideo(video_id);
                            }, 15000);
                        } else {
                            textToSpeech("Hello " + pname + ", welcome to your interview.");
                        }
                    }
                });
            } else {
                textToSpeech("Hello " + pname + ", welcome to your interview.");
            }

        });
    }
})

function syncVideo(video_id) {
    console.log(new Date().toLocaleTimeString());
    getVideo(video_id).then(function (res1) {
        res = JSON.parse(res1);
        if (res['data']) {
            if (res['data'].status == "processing") {
                setTimeout(function () {
                    syncVideo(video_id);
                }, 5000);
            } else if (res['data'].status == 'completed') {
                let video_url = res['data'].video_url;
                $('#avatarVideo').attr('src', video_url);
                $('#avatarVideo').show();
                $('#avatar').hide();
            } else {
                textToSpeech("Hello " + pname + ", welcome to your interview.");
            }
        } else {
            textToSpeech("Hello " + pname + ", welcome to your interview.");
        }
    })
}

// Function to stop recording and save video
stopButton.click(() => {
    stopRecording(true).then(() => {
        $('.endCall').show();
        $('.experiment').hide();
        $('.profile').hide();
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        console.log('Recording stopped');
    });
});

// // Function to start recording
start.addEventListener('click', async () => {
    startInterview();
});

nextQuestionButton.addEventListener('click', () => {
    if (currentQuestionNumber >= (questionToAsk - 1)) {
        $('.endCall').show();
        $('.experiment').hide();
        stopRecording(true).then(() => {
        });
    } else {
        if (currentQuestionNumber == 0)
            currentQuestionNumber++;
        stopRecording(true).then((resolve) => {
            nextQuestion();
        });
    }
});

// skipQuestionButton.addEventListener('click', () => {
//     if (currentQuestionNumber >= questions.length) {
//         $('.endCall').show();
//         $('.experiment').hide();
//         stopRecording(false).then(() => {
//             return;
//         });
//     } else {
//         if (currentQuestionNumber == 0)
//             currentQuestionNumber++;
//         stopRecording(false).then(() => {
//             nextQuestion();
//         });
//     }
// });


function onLoad() {
    $('.experiment').hide();
    $('.endCall').hide();
    $('#avatarVideo').hide();
}

function startInterview() {
    $('.endCall').hide();
    $('.experiment').show();
    $("#start").attr("disabled", true);
    // $("#start").removeAttr("disabled");

    getQuestions(role).then((response) => {
        if (response) {
            questions = response;
            let qArray = getRandomNumbers(1, response.length - 1);
            questionNumbers = qArray.slice(0, questionToAsk);

            startRecording().then(() => {
                nextQuestion();
                setTimeout(function () {
                    // $('#skipQuestion').show();
                    $('#nextQuestion').show();
                }, 5000);

            });
        }
    });


}

function stopRecording(saveVideo = true) {
    return new Promise((resolve, reject) => {
        return recorder.stopRecording(() => {
            if (saveVideo === true) {
                let blob = recorder.getBlob();
                let url = URL.createObjectURL(blob);
                return uploadFile(blob).then(() => {
                    return convertBlobToText(recordedFiles[recordedFiles.length - 1]).then((response) => {
                        var answer = response.text;
                        if (answer == '') {
                            answer = 'No answer given';
                        }
                        return saveTextToFile(email, role, questionId, questionName, answer, fileName).then(() => {
                            console.log('Response saved');
                            resolve('Resolved!');
                        });
                    });
                });
            }
            // Stop the video stream
            //videoElement.srcObject.getTracks().forEach(track => track.stop());
            resolve('Resolved!');
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
        let number = questionNumbers[currentQuestionNumber]
        if (currentQuestionNumber != 0)
            currentQuestionNumber++;

        if (currentQuestionNumber == questionToAsk) {
            //$('#skipQuestion').attr('disabled', true);
            $('#nextQuestion').attr('disabled', true);
            setTimeout(function () {
                $('#stop').show()
            }, 5000);
        }

        if (number) {
            let item = questions.filter(x => x.id == number);
            if (item && item.length > 0) {
                item = item[0];
                questionId = item['id'];
                questionName = item['question'];
                textToSpeech(questionName).then(() => {
                    startRecording();
                });
            }
        }
    } else {
        $('.endCall').show();
        $('.experiment').hide();
    }
}

function convertBlobToText(fileName) {
    return new Promise((resolve, reject) => {
        let audio = fileName.indexOf('.webm') > -1 ? fileName.replace('.webm', '.wav') : fileName;
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

function saveTextToFile(email, role, questionid, question, answer, fileName) {
    return new Promise((resolve, reject) => {
        // data = { "name": 'bhavesh patil',  "email": 'bhavesh.patil@bts.com', role: 'admin', 'questionid': 3, question: 'what is your age ?', answer: 'My age is 34' };
        data = { "email": email, 'role': role, 'questionid': questionid, 'question': question, 'answer': answer, 'videofile': fileName };

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



function textToSpeech(question) {
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

function textToVideo(question) {
    return new Promise((resolve, reject) => {
        data = { "question_text": question };

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
        fileName = pname.replace(' ', '_') + '_' + uniquename + '.webm';
        recordedFiles.push(fileName);

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
                videoElement.play();

                recorder = new RecordRTC(stream, {
                    type: 'video',
                    mimeType: 'video/webm',
                    bitsPerSecond: 128000,
                    frameInterval: 90,
                    disableLogs: true
                });

                recorder.startRecording();
                // startButton.disabled = true;
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

function getRandomNumbers(low, high) {
    // Ensure low and high are integers
    low = Math.floor(low);
    high = Math.floor(high);

    if (low > high) {
        throw new Error("Low number must be less than or equal to high number.");
    }

    // Generate an array of numbers from low to high
    const numbers = [];
    for (let i = low; i <= high; i++) {
        //if (numbers.indexOf(i) > -1) {
        numbers.push(i);
        //}
    }

    // Shuffle the array using the Fisher-Yates algorithm
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]]; // Swap elements
    }

    return numbers;
}

