module.exports = {
  commands: ['roll'],
  description: "Rolls a random number",
  expectedArgs: '[maximum roll value]',
  minArgs: 0,
  maxArgs: 1,
  callback: (message, arguments) => {
    if (message.author.id === process.env.OWNER_ID) {
      const val = (arguments[0] ? arguments[0] : 100);
      if(Math.round(Math.random() * 100) === 100 && val >= 727) {
        message.channel.send('You rolled 727!');
      } else {
        const v = Math.round(Math.random() * val);
        message.channel.send(`You rolled ${v}!`);
      }
    } else if (message.author.id === process.env.GRANT_ID) {
      const val = (arguments[0] ? arguments[0] : 100);
      if(val >= 727) {
        message.channel.send('You rolled 727!');
      } else {
        const v = Math.round(Math.random() * val);
        message.channel.send(`You rolled ${v}!`);
      }
    } else {
      let val = Math.round(Math.random() * (arguments[0] ? arguments[0] : 100));
      message.channel.send(`You rolled ${val}!`);
    }
  },
}
