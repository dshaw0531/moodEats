import React, { Component } from 'react';
import Webcam from 'react-webcam';
import cuisine from "../cuisine.json";

class Main extends Component {
    constructor() {
        super();
        this.state = {
            weather: [],
            maxEmotion: '',
            food: '',
            emotionString: null,
            zipcode: '27519',
            restaurants: null
        };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({ zipcode: event.target.value });
    }

    setRef = webcam => {
        this.webcam = webcam;
    };

    capture = () => {
        // Take Picture and get mood
        const AzureFace_SUBSCRIPTION_KEY = 'b087994442994dbf92cc35088a0dd104';
        const weatherApiKey = '0a936f2103ce9629dc0c77c09e4a6114';
        const mapQuest_Api_KEY = 'IzG0KQI7Fh7Kex49ViWuhCpi7CG0CGh7';

        this.webcam.getCanvas().toBlob(blob => {
            fetch('https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=false&returnFaceLandmarks=false&returnFaceAttributes=emotion',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Ocp-Apim-Subscription-Key': AzureFace_SUBSCRIPTION_KEY
                    },
                    body: blob
                }).then(response => {
                    return response.json();
                }).then(data => {
                    if (data[0]) {
                        let emotions = data[0].faceAttributes.emotion;
                        var maxEmotionNum = null;

                        for (let emotion in emotions) {
                            if (emotions[emotion] > maxEmotionNum) {
                                maxEmotionNum = emotions[emotion];
                                this.setState({ maxEmotion: emotion });
                            }
                        }

                        this.setState({ emotionString: "The emotion is: " + this.state.maxEmotion });
                    } else {
                        this.setState({ emotionString: "Please try another picture" });
                    }
                    return this.state.maxEmotion;
                }
                ).then(maxEmotion => {
                    // Get the weather
                    let url = 'http://api.openweathermap.org/data/2.5/weather?zip=' + (this.state.zipcode || '27519') + ',us&appid=' + weatherApiKey;
                    fetch(url).then(results => {
                        return results.json();
                    }).then(data => {
                        var weather = data.weather[0];
                        this.setState({ weather: weather });
                        // Determine which type of cuisine
                        this.setState({ food: cuisine[maxEmotion][weather['id']] });
                        return data.coord;
                    }).then(coordinates => {
                        if (coordinates && this.state.food) {
                            // Find restaurants by cuisine
                            const url = 'https://www.mapquestapi.com/search/v4/place?location=' + coordinates.lon + ',' + coordinates.lat + '&q=' + this.state.food + '&sort=distance&feedback=false&key=' + mapQuest_Api_KEY;
                            fetch(url).then(results => {
                                return results.json();
                            }).then(data => {
                                var listItems = data.results.map(function(item) {
                                    return (
                                    <li key="{id}" >{item.displayString}</li>
                                    );
                                });

                                this.setState({ restaurants: listItems });
                            })
                        }
                    })
                })
        })
    };

    render() {
        const videoConstraints = {
            width: 1280,
            height: 720,
            facingMode: "user"
        };
        return (
            <div className="inFront">
                <div>
                    <p>
                        Please enter your zip code:
                    </p>
                    <input type="text" value={this.state.zipcode} onChange={this.handleChange} />
                    <div>
                        <Webcam
                            audio={false}
                            height={350}
                            ref={this.setRef}
                            screenshotFormat="image/jpeg"
                            width={350}
                            videoConstraints={videoConstraints}
                        />
                    </div>

                    <div>
                        <button onClick={this.capture}>
                            Capture photo
                        </button>
                    </div>

                    <div className="weatherContainer">
                        The weather is: {this.state.weather.description}
                    </div>

                    <div className="weatherContainer">
                        {this.state.emotionString}
                    </div>

                    <div className="weatherContainer">
                        The food is: {this.state.food}
                    </div>

                    <div>
                    <ul>
                        { this.state.restaurants}
                    </ul>
        </div>
                </div>
            </div>
        )
    }
}

export default Main;
