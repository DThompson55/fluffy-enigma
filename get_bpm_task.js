'use strict';
//
// get_bpm_task logs into BPM in a non-optimal way, gets all the tasks, 
// and then filters for one that has a matching user id, again, not optimally
// error checking? why would I do that?
//

require('dotenv').config();
var request = require('request');
//console.log(process.env);


function login(callback){
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

};

//console.log(options)

request(options, function (error, response) {
  if (error) throw new Error(error);
  callback(JSON.parse(response.body).csrf_token)
});
}

function getClients(token, callback){
var options = {
  'method': 'GET',
  'strictSSL': false,
  'url': 'https://'+process.env.BPM_SERVER+':'+process.env.BPM_PORT+'/bpm/user-tasks?states=claimed,ready&optional_parts=data',
  'headers': {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'BPMCSRFToken': token,
    'Authorization': process.env.BPM_SERVER_AUTH,
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  callback(JSON.parse(response.body));
});
}

function get_user_task(id_of, tasks){
  for (const element of tasks.user_task_instances) {
    //console.log(element.input[1].data.ID, id_of)
    if (element.input[1].data.ID == id_of){
     return(element);
    }
  }
}

function getTaskByUserID(id_of, callback){
      login(function(token){
      getClients(token,function(res){
       if (!res.error_number){
        callback(get_user_task(id_of, res))
        }
       if (res.error_number){
        console.log(res)
        }
      })
     })
    }

//getClient("002")
//console.log(AuthToken)

module.exports = {
    getTaskByUserID: getTaskByUserID
}



