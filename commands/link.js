const mongo = require('../mongo');
const userDataSchema = require('../schemas/user-data');
const getUser = require('../utils/get-discord-from-mention');
const { osu } = require('../osu');
const { prefix } = require('../config.json');

module.exports = {
  commands: ['link', 'osuset', 'setuser', 'l'],
  description: "Links the user to an osu account",
  expectedArgs: '<username>',
  minArgs: 1,
  maxArgs: 1,
  callback: async (message, arguments, text, client) => {
    const id = getUser(message.author.toString());
    // console.log(`Linking ${id} to osu username ${arguments[0]}`);
    let osuAccount;
    try {
      osuAccount = await osu.user(arguments[0]);
      if (!osuAccount) {
        message.channel.send(`${arguments[0]} is not a valid osu username! If you have spaces in your name, surround your name with quotation marks.`);
        return;
      }
    } catch(e) {
      if(e && e.response && e.response.status && e.response.status === 404) {
        message.channel.send(`${arguments[0]} was not found! If you have spaces in your name, surround your name with quotation marks.`);
      } else {
        message.channel.send(`Error with fetching osu account data. Ping Blue-Fox cuz he probably fucked something up.`);
      }
      return;
    }

    await mongo().then(async mongoose => {
      try {
        await userDataSchema.findOneAndUpdate({
          _id: id
        }, {
          $set: {
            'osu': osuAccount.username,
            'osuId': osuAccount.id
          },
        }, {
          upsert: true
        });

        message.guild.members.fetch(id).then(member => {
          message.channel.send(`${member.nickname ? member.nickname : member.user.username}, your account has been linked to ${osuAccount.username}. If you have shards on the spreadsheet and none when you type ${prefix}shards, please make a ticket in <#839359200144261140> requesting that your shard count gets updated to the spreadsheet value.`);
        }).catch(console.error);
      } catch(e) {
        console.error(e);
      } finally {
        mongoose.connection.close();
      }
    });
  },
}
