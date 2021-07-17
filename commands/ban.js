module.exports = {
  commands: ['ban'],
  description: "Bans a user",
  expectedArgs: '<username>',
  permissionError: 'nice try idiot',
  minArgs: 1,
  maxArgs: 1,
  callback: async (message) => {
    message.reply('stfu im not banning them you idiot');
  },
  permissions: 'ADMINISTRATOR',
}
