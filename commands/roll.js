module.exports = {
  commands: ['roll'],
  description: "Rolls a random number",
  expectedArgs: '[maximum roll value]',
  minArgs: 0,
  maxArgs: 1,
  callback: (message, arguments) => {
    let val = Math.round(Math.random() * (arguments[0] ? arguments[0] : 100));
    message.channel.send(`You rolled ${val}!`);
  },
}
