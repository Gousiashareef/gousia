(function() {
    var app = angular.module('projectRtc', [],
        function($locationProvider) {
            $locationProvider.html5Mode(true);
        }
    );
    var client = new PeerManager();
    var mediaConfig = {
        audio: true,
        video: {
            mandatory: {},
            optional: []
        }
    };

    app.factory('camera', ['$rootScope', '$window', function($rootScope, $window) {
        var camera = {};
        camera.preview = $window.document.getElementById('localVideo');
        //camera.preview = $window.document.getElementById('remoteVideo');

        camera.start = function() {

            return requestUserMedia(mediaConfig)
                .then(function(stream) {
                    attachMediaStream(camera.preview, stream);
                    client.setLocalStream(stream);
                    //client.setRemoteStream(stream);
                    camera.stream = stream;
                    $rootScope.$broadcast('cameraIsOn', true);
                    camera.hide = true;
                    console.log('Failed to get access to local media.');

                })
                .catch(Error('Failed to get access to local media.'));
        };
        camera.stop = function() {
            return new Promise(function(resolve, reject) {
                    try {
                        //camera.stream.stop() no longer works
                        /*for( var track in camera.stream.getTracks() ){
                          track.stop();
                        }*/

                        if (camera.stream.getVideoTracks().length && camera.stream.getVideoTracks()[0].stop) {
                            camera.stream.getVideoTracks().forEach(function(track) {
                                track.stop();
                            });
                        }
                        if (camera.stream.getAudioTracks().length && camera.stream.getAudioTracks()[0].stop) {
                            camera.stream.getAudioTracks().forEach(function(track) {
                                track.stop();
                            });
                        }
                        camera.preview.src = '';
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                })
                .then(function(result) {
                    $rootScope.$broadcast('cameraIsOn', false);
                });
        };
        return camera;
    }]);

    app.controller('RemoteStreamsController', ['camera', '$location', '$scope', '$location', '$http', function(camera, $location, $scope, $location, $http) {
        //var rtc = this;
        $scope.remoteStreams = [];

        function getStreamById(id) {
            for (var i = 0; i < $scope.remoteStreams.length; i++) {
                if ($scope.remoteStreams[i].id === id) {
                    return $scope.remoteStreams[i];
                }
            }
        }

        if ($location.url() != '/') {
            $scope.val = false;
            $scope.val1 = true;
        } else {
            $scope.val = true;
            $scope.val1 = false;
        }

        $scope.view = function(stream) {
            client.peerInit(stream.id);
            console.log("stream " + stream.id);
            //stream.isPlaying = !stream.isPlaying;
        };
        $scope.call = function(stream) {
            /* If json isn't loaded yet, construct a new stream 
             * This happens when you load <serverUrl>/<socketId> : 
             * it calls socketId immediatly.
             **/
            if (!stream.id) {
                stream = {
                    id: stream,
                    isPlaying: false
                };
                $scope.remoteStreams.push(stream);
            }
            if (camera.isOn) {
                client.toggleLocalStream(stream.id);
                if (stream.isPlaying) {
                    client.peerRenegociate(stream.id);
                } else {
                    client.peerInit(stream.id);
                }
                stream.isPlaying = !stream.isPlaying;
            } else {
                camera.start()
                    .then(function(result) {
                        client.toggleLocalStream(stream.id);
                        if (stream.isPlaying) {
                            client.peerRenegociate(stream.id);
                        } else {
                            client.peerInit(stream.id);
                        }
                        stream.isPlaying = !stream.isPlaying;
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            }
        };

        //initial load
        //$scope.loadData();
        if ($location.url() != '/') {
            $scope.call($location.url().slice(1));
        };
    }]);

    app.controller('LocalStreamController', ['camera', '$scope', '$location', '$window', '$http', function(camera, $scope, $location, $window, $http) {
        //var localStream = this;

        $scope.name = 'Guest';
        //$scope.link = '';
        $scope.cameraIsOn = false;
        $scope.remoteStreams = [];
        if ($location.url() != '/') {
            $scope.val = false;
            $scope.val1 = true;
        } else {
            $scope.val = true;
            $scope.val1 = false;
        }

        $scope.$on('cameraIsOn', function(event, data) {
            $scope.$apply(function() {
                $scope.cameraIsOn = data;
            });
        });

        $scope.toggleCam = function() {
            if ($scope.cameraIsOn) {
                camera.stop()
                    .then(function(result) {

                        client.send('leave');
                        client.setLocalStream(null);
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            } else {

                /*		if(client.getId()=='undefined' || client.getId()== undefined || client.getId()=='null' ||client.getId()==null)
                						{
                						
                							//var sleep=require('sleep');
                							location.reload();
                							
                							//client.setLocalStream(null);
                						//	sleep.sleep(2);
                }*/


                camera.start()

                    .then(function(result) {

                        $scope.link = 'https://' + $window.location.host + '/' + client.getId();
                        client.send('readyToStream', {
                            name: $scope.name
                        });
                        $scope.loadData();
                        console.log("li " + $scope.link);

                    })
                    .catch(function(err) {
                        console.log(err);
                    });

            }

        };
        $scope.loadData = function() {
            // get list of streams from the server
            $http.get('/streams.json').success(function(data) {
                // filter own stream
                var streams = data.filter(function(stream) {
                    return stream.id != client.getId();
                });
                // get former state
                for (var i = 0; i < streams.length; i++) {
                    var stream = getStreamById(streams[i].id);
                    streams[i].isPlaying = (!!stream) ? stream.isPLaying : false;
                }
                // save new streams
                $scope.remoteStreams = streams;
            });
        };

    }]);
})();