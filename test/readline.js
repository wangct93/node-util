

const readline = require('readline');


const rl = readline.createInterface({
  input:process.stdin,
  output:process.stdout,
});

rl.question('你最喜欢的食物是什么？', (answer) => {
  console.log(`你最喜欢的食物是 ${answer}`);
});

// rl.write('ddd')

// rl.on('line',(...args) => {
//   console.log(args);
//   rl.prompt('wda');
// });
