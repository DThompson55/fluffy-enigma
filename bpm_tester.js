//
// bpm_test tests the get_bpm_task project, and retrieves user OO1 if they exist in BPM
//
var bpm_tester = require('./get_bpm_task');

//console.log(bpm_tester.options);

//bpm_tester.login(console.log);

//bpm_tester.callBPMAPI(bpm_tester.options, console.log)

//bpm_tester.getAllTasks(console.log);

//bpm_tester.test(console.log)


bpm_tester.getTaskByUserID("001", console.log);

// try{
// setTimeout(() => {  bpm_tester.getTaskByUserID("002", console.log ); }, 4000); // test token timeout
// }catch (e) {console.log("DTT",e);}

