const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const Cast = require('../../util/cast');
const Timer = require('../../util/timer');
const request = require('request');
const RenderedTarget = require('../../sprites/rendered-target');
//const response = require('response');

const iconURI = require('./assets/watson_icon');

//camera
let videoElement = undefined;
let hidden_canvas = undefined;
let imageDataURL = undefined;
let image = undefined;
let stream = undefined;

//models and their classifier_ids
const modelDictionary = {
    'RockPaperScissors': 'RockPaperScissors_371532596'
}

//var fs = require('fs-extra');
// watson
var watson = require('watson-developer-cloud');
var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var visual_recognition = new VisualRecognitionV3({
  url: "https://gateway-a.watsonplatform.net/visual-recognition/api/",
  api_key: '13d2bfc00cfe4046d3fb850533db03e939576af3',
  version_date: '2016-05-20'
});

let parameters = {
    classifier_ids: [],
    url: null,
    threshold: 0.6
  };
  
var params = {
    //images_file: null,
    parameters: parameters
};

//for parsing response
let watson_response; 
let image_class;

class Scratch3Watson {
    constructor (runtime) {
        this.runtime = runtime;
  
    }

    getInfo () {
        return {
            id: 'watson',
            name: 'Watson',
            blockIconURI: iconURI,
            blocks: [
                {
                    opcode: 'initializeCamera',
                    blockType: BlockType.COMMAND,
                    text: 'Start your webcam'
                },
                {
                    opcode: 'takePhoto',
                    blockType: BlockType.COMMAND,
                    text: 'Take photo as [TITLE]',
                    arguments: {
                        TITLE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'title'
                        }
                    }
                },
                {
                    opcode: 'getModelFromList',
                    blockType: BlockType.COMMAND,
                    text: 'Choose model from list: [MODELNAME]',
                    arguments: {
                        MODELNAME: {
                            type: ArgumentType.STRING,
                            menu: 'models',
                            defaultValue: 'RockPaperScissors'
                        }
                    }
                },
                {
                    opcode: 'getModelfromString',
                    blockType: BlockType.COMMAND,
                    text: 'Choose model using id: [IDSTRING]',
                    //[THIS] needs to be equal to THIS in arguments
                    arguments: {
                        IDSTRING: {
                            type: ArgumentType.STRING,
                            defaultValue: 'classifier id'
                        }
                    }
                },
                {
                    opcode: 'recognizeObject',
                    blockType: BlockType.REPORTER,
                    text: 'recognise objects in photo [URL]',
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'add photo link here'
                        }
                    }
                },
                {
                    opcode: 'getImageClass',
                    blockType: BlockType.REPORTER,
                    text:'recognize image [IMAGE]',
                    arguments: {
                        IMAGE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Image name'
                        }
                    }                
                }
                
            ],
            menus: {
                models: ['RockPaperScissors']
            }
        };
    }

    initializeCamera () {
        console.log('Initializing camera');
        videoElement = document.createElement('video');
        videoElement.id = 'camera-stream';
        hidden_canvas = document.createElement('canvas');
        hidden_canvas.id = 'imageCanvas';

        navigator.getUserMedia(
            // Options
            {
                video: true
            },
            // Success Callback
            stream => {
            // Create an object URL for the video stream and
            // set it as src of our HTLM video element.
                videoElement.src = window.URL.createObjectURL(stream);
                // Play the video element to show the stream to the user.
                videoElement.play();
            },
            // Error Callback
            err => {
                // Most common errors are PermissionDenied and DevicesNotFound.
                console.error(err);
            }
        );
    }

    takePhoto (args, util) {
        // Get the exact size of the video element.
       const width = videoElement.videoWidth;
       const height = videoElement.videoHeight;
    
        // Context object for working with the canvas.
        const context = hidden_canvas.getContext('2d');
    
        // Set the canvas to the same dimensions as the video.
        hidden_canvas.width = width;
        hidden_canvas.height = height;
    
        // Draw a copy of the current frame from the video on the canvas.
        context.drawImage(videoElement, 0, 0, width, height);
    
        // Get an image dataURL from the canvas.
        imageDataURL = hidden_canvas.toDataURL(args.TITLE + '/png');
        console.log(imageDataURL);
        return imageDataURL;
    }

    getModelFromList(args, util){
        parameters.classifier_ids[0] = modelDictionary[args.MODELNAME];
    }

    getModelfromString(args, util){
        parameters.classifier_ids[0] = args.IDSTRING;
    }
    
    recognizeObject (args, util){
        var urlToRecognise = args.URL;
        parameters.url = args.URL;
        console.log(parameters.classifier_ids[0]);
        request.get('https://gateway-a.watsonplatform.net/visual-recognition/api/v3/classify',
                    { qs : {  url: urlToRecognise,
                            classifier_ids : parameters.classifier_ids[0],
                            api_key : "13d2bfc00cfe4046d3fb850533db03e939576af3", 
                            version: '2018-03-19'} 
                    },
                    function (err, response) {
                        if (err){
                            console.log(err);
                        }
                        else{
                          console.log(JSON.stringify(response, null, 2));
                          watson_response = JSON.parse(JSON.stringify(response, null, 2));
                          watson_response = JSON.parse(watson_response.body);
                        }
                    });
        //need to delay call to this function so the request has time to get through
        setTimeout(function(){image_class = watson_response.images[0].classifiers[0].classes[0].class;
            console.log(image_class);}, 2500);
            return String(image_class);
    }

    getImageClass(args, util) {
        //call visual_recognition to classify the image
        visual_recognition.classify(params, function(err, response) {
            if (err)
              console.log(err);
            else
              image_class = JSON.stringify(response, null, 2);
              console.log(JSON.stringify(response, null, 2));
        });
        console.log(image_class);
        return image_class
    }
    
}

module.exports = Scratch3Watson;