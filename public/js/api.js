// The Api module is designed to handle all interactions with the server

var Api = (function() {
  var requestPayload;
  var responsePayload;
  var context;

  var messageEndpoint = '/api/message';

  var sessionEndpoint = '/api/session';

  var sessionId = null;

  // Publicly accessible methods defined
  return {
    sendRequest: sendRequest,
    getSessionId: getSessionId,

    // The request/response getters/setters are defined here to prevent internal methods
    // from calling the methods without any of the callbacks that are added elsewhere.
    getRequestPayload: function() {
      return requestPayload;
    },
    setRequestPayload: function(newPayloadStr) {
      requestPayload = JSON.parse(newPayloadStr);
      if ( context ) {
        requestPayload.context = context;
        console.log("CONTEXT IS SET TO ",requestPayload.context.skills['main skill'])
      }
      console.log("RQ "+JSON.stringify(requestPayload))
    },
    getResponsePayload: function() {
      return responsePayload;
    },
    setResponsePayload: function(newPayloadStr) {
      responsePayload = JSON.parse(newPayloadStr).result;
      console.log("RESP Context "+JSON.stringify(responsePayload.context)) 
      console.log("RESP X "+JSON.stringify(responsePayload)) 
      context = responsePayload.context 
    
    },
    setErrorPayload: function() {
    }
  };

  function getSessionId(callback) {
    var http = new XMLHttpRequest();
    http.open('GET', sessionEndpoint, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function () {
      if (http.readyState === XMLHttpRequest.DONE) {
        let res = JSON.parse(http.response);
        sessionId = res.result.session_id;
        callback();
      }
    };
    http.send();
  }


  // Send a message request to the server
  function sendRequest(text) {
    // Build request payload
    var payloadToWatson = {
      session_id: sessionId
    };

    payloadToWatson.input = {
      message_type: 'text',
      text: text
    };


    // Built http request
    var http = new XMLHttpRequest();
    http.open('POST', messageEndpoint, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function() {
      if (http.readyState === XMLHttpRequest.DONE && http.status === 200 && http.responseText) {
        Api.setResponsePayload(http.responseText);
      } else if (http.readyState === XMLHttpRequest.DONE && http.status !== 200) {
        Api.setErrorPayload({
          'output': {
            'generic': [
              {
                'response_type': 'text',
                'text': 'I\'m having trouble connecting to the server, please refresh the page'
              }
            ],
          }
        });
      }
    };

    var params = JSON.stringify(payloadToWatson);
    // Stored in variable (publicly visible through Api.getRequestPayload)
    // to be used throughout the application
    if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
      Api.setRequestPayload(params);
      params = JSON.stringify(Api.getRequestPayload())
    }
  
    // Send request
    console.log("Just before the send ",params)
    http.send(params);
  }
}());
