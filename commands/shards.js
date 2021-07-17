const mongo = require('../mongo');
const userDataSchema = require('../schemas/user-data');
const getUser = require('../utils/get-discord-from-mention');
const { osu } = require('../osu');
const { prefix } = require('../config.json');

module.exports = {
  commands: ['shards', 's', 'getshards'],
  description: "Displays the number of shards in a user's account",
  expectedArgs: '<optional:username>',
  minArgs: 0,
  maxArgs: 1,
  callback: async (message, arguments, text, client) => {
    if(arguments.length !== 0) {
      let id = getUser(arguments[0]);
  
      if (!id) { // Passed in osu name instead of mention
        try {
          let osuAccount = await osu.user(arguments[0]);
  
          await mongo().then(async mongoose => {
            try {
              let documents = await userDataSchema.find({ osuId: osuAccount.id }).exec();
    
              if (documents.length > 1) {
                message.channel.send('Multiple members have linked with that osu account. Please mention the user you wish to know the shard count of instead.')
              } else {
                if (!documents[0]) {
                  message.channel.send(`${osuAccount.username} is not linked to a discord account!`);
                } else {
                  const { shards: count = 0 } = documents[0].toObject();
                  message.channel.send(`${osuAccount.username} has ${count} shards.`);
                }
              }
            } catch(e) {
              console.error(e);
            } finally {
              mongoose.connection.close();
            }
          });
        } catch(e) {
          if(e && e.response && e.response.status && e.response.status === 404) {
            message.channel.send(`${arguments[0]} was not found! If you have spaces in your name, surround your name with quotation marks.`);
          } else {
            message.channel.send(`Error with fetching osu account data. Ping Blue-Fox cuz he probably fucked something up.`);
          }
          return;
        }
      } else { // mentioned someone
        await mongo().then(async mongoose => {
          try {
            let documents = await userDataSchema.find({ _id: id }).exec();

            const count = documents[0].toObject().shards ? documents[0].toObject().shards : 0;
        
            message.guild.members.fetch(id).then(member => {
              message.channel.send(`${member.nickname ? member.nickname : member.user.username} has ${count} shards.`);
            }).catch(console.error);
          } catch(e) {
            console.error(e);
          } finally {
            mongoose.connection.close();
          }
        });
      }
    } else {
      let id = getUser(message.author.toString());
      await mongo().then(async mongoose => {
        try {
          let documents = await userDataSchema.find({ _id: id }).exec();

          let count = 0, osuFound = false;
          if (documents && documents[0]) {
            if ('osu' in documents[0].toObject()) {
              osuFound = true;
            }
            count = documents[0].toObject().shards ? documents[0].toObject().shards : 0;
          }
        
          if (osuFound) {
            message.guild.members.fetch(id).then(member => {
              message.channel.send(`${member.nickname ? member.nickname : member.user.username}, you have ${count} shards.`);
            }).catch(console.error);
          } else {
            message.guild.members.fetch(id).then(member => {
              message.channel.send(`${member.nickname ? member.nickname : member.user.username}, you have ${count} shards. You have not linked your osu account with \`${prefix}link\`. Please do so and if you have existing shards on the spreadsheet, then create a ticket asking for your shards to be updated to those values.`);
            }).catch(console.error);
          }
        } catch(e) {
          console.error(e);
        } finally {
          mongoose.connection.close();
        }
      });
    }
  },
}
