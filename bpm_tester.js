//
// bpm_test tests the get_bpm_task project, and retrieves user OO1 if they exist in BPM
//

var bpm_tester = require('./get_bpm_task');

var x = bpm_tester.getTaskByUserID("001", console.log);

console.log(x)

