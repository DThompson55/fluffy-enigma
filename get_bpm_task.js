'use strict';
//
// get_bpm_task logs into BPM in a non-optimal way, gets all the tasks, 
// and then filters for one that has a matching user id, again, not optimally
// error checking? why would I do that?
//

require('dotenv').config();
var request = require('request');

// The held token - is it secure to do it this way? IDK
var csrf_token = ""

//
//
//
function login2(callback){
  var options = {
    'method': 'POST',
    'strictSSL': false,
    'url': 'https://'+process.env.BPM_SERVER+':'+process.env.BPM_PORT+'/bpm/system/login?refresh_groups=true&requested_lifetime=7200',
    'headers': {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': process.env.BPM_SERVER_AUTH,
    },
    body: JSON.stringify({
      "refresh_groups": true,
      "requested_lifetime": 7200
    })
  }
    request(options, function (error, response, body) { // get a csrf token
      var jbod = JSON.parse(body)
      if (jbod.error_number) throw new Error(body);
      csrf_token = jbod.csrf_token
      callback()
  })
}

function login1( callback ){
    callback() // see if existing csrf token is still good
}

//
//
//
function callBPMAPI(options, callback){  
  login1(function(){
    request(options, function (error, response, body) {
      var jbod = JSON.parse(body)
      if (!jbod.error_number) 
       callback(jbod);
      else {
        login2(function(){ 
          options.headers.BPMCSRFToken = csrf_token;           
          request(options, function (error, response, body) {
            var jbod = JSON.parse(body)
               if (jbod.error_number) {throw new Error(body);}
               callback(jbod);
            });
          });
         }
      });
    })
  }

//
//
//
function getAllTasks(callback){
var options = {
  'method': 'GET',
  'strictSSL': false,
  'url': 'https://'+process.env.BPM_SERVER+':'+process.env.BPM_PORT+'/bpm/user-tasks?states=claimed,ready&optional_parts=data&model=Eligibilty Review Process',
  'headers': {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'BPMCSRFToken': csrf_token,
    'Authorization': process.env.BPM_SERVER_AUTH,
  }
};
  callBPMAPI(options, function(body){
    callback(body)
  });
}


//
//
//
function getTaskByUserID(id_of, callback){ // there must be a more efficient way to get this, and it is specific to this datamodel for this task
  getAllTasks(function(tasks){
  for (const element of tasks.user_task_instances) {
    if (element.model == 'Eligibilty Review Process' ) {
      try {
        if (element.input[1].data.ID == id_of){
         callback(element);
        }
      } catch (e) {}
    }
  }
})
}

module.exports = {
    getTaskByUserID: getTaskByUserID,
 }
