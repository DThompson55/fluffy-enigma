/**
 *
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var bpm_util = require('./get_bpm_task.js');
var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var AssistantV2 = require('ibm-watson/assistant/v2'); // watson sdk
const { IamAuthenticator, BearerTokenAuthenticator } = require('ibm-watson/auth');
var Sync = require('sync');
require('dotenv').config();


var app = express();
require('./health/health')(app);

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// Create the service wrapper

let authenticator;
if (process.env.ASSISTANT_IAM_APIKEY) {
  authenticator = new IamAuthenticator({
    apikey: process.env.ASSISTANT_IAM_APIKEY
  });
} else if (process.env.BEARER_TOKEN) {
  authenticator = new BearerTokenAuthenticator({
    bearerToken: process.env.BEARER_TOKEN
  });
}

var assistant = new AssistantV2({
  version: '2019-02-28',
  authenticator: authenticator,
  url: process.env.ASSISTANT_URL,
  disableSslVerification: process.env.DISABLE_SSL_VERIFICATION === 'true' ? true : false
});

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
  let assistantId = process.env.ASSISTANT_ID || '<assistant-id>';
  if (!assistantId || assistantId === '<assistant-id>') {
    return res.json({
      output: {
        text:
          'The app has not been configured with a <b>ASSISTANT_ID</b> environment variable. Please refer to the ' +
          '<a href="https://github.com/watson-developer-cloud/assistant-simple">README</a> documentation on how to set this variable. <br>' +
          'Once a workspace has been defined the intents may be imported from ' +
          '<a href="https://github.com/watson-developer-cloud/assistant-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.',
      },
    });
  }

  var textIn = '';

  if (req.body.input) {
    textIn = req.body.input.text;
  }

  var payload = {
    assistantId: assistantId,
    sessionId: req.body.session_id,
    input: {
      message_type: 'text',
      text: textIn,
      options: {
        'return_context': true,
      }
    },
    context: {
      skills: {'main skill': {
        user_defined: {
        }
      }
     }
    },
  };


  if (req.body.context){
    payload.context = req.body.context
  }

  assistant.message(payload, function(err, data) {
    if (err) {
      const status = err.code !== undefined && err.code > 0 ? err.code : 500;
      return res.status(status).json(err);
    }
      var wa_context_vbls = data.result.context.skills['main skill'].user_defined

      //
      // Need a better state indicator for when to call BPM API
      //
      if (!(wa_context_vbls && wa_context_vbls['process_id'])){ // this says we've looked up a BPM record already
      if ( data.result.output && data.result.output.entities && 
           data.result.output.entities[0] && 
           data.result.output.entities[0].entity == 'PinNumber' ) {
        bpm_util.getTaskByUserID(wa_context_vbls.Pin, function(bpm_data){
          //
          // flatten the results from BPM to something simple for WA and the web page to deal with
          //
          Object.assign(wa_context_vbls, bpm_data) // flatten the response
          Object.assign(wa_context_vbls, bpm_data.input[1].data) // flatten the response
          delete wa_context_vbls.assignments;// = "set to none"
          delete wa_context_vbls.input;// = "set to none"
          delete wa_context_vbls.output;// = "set to none"
          delete wa_context_vbls.internal;// = "set to none"
          delete wa_context_vbls['@metadata'];// = "set to none"
          //console.log("wa_context_vbls SKILLS from WA ",data.result.context.skills['main skill'].user_defined)  
          //console.log("returned data is ",data)

          payload.context.skills['main skill'].user_defined = wa_context_vbls;

          payload.input.text = "BPM" // a secret conversation intent - does it need to be obfuscated?
//
// call WA a 2nd time to advance the conversation state if BPM is involved
//
          assistant.message(payload, function(err, data) {
            if (err) {
              const status = err.code !== undefined && err.code > 0 ? err.code : 500;
              return res.status(status).json(err);
            }
            return res.json(data)
          })
        })
      } else {
        return res.json(data);
      }
      } else {
        return res.json(data);
      }
  });
});

app.get('/api/session', function(req, res) {
  assistant.createSession(
    {
      assistantId: process.env.ASSISTANT_ID || '{assistant_id}',
    },
    function(error, response) {
      if (error) {
        return res.send(error);
      } else {
        return res.send(response);
      }
    }
  );
});


module.exports = app;
