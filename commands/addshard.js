const mongo = require('../mongo');
const userDataSchema = require('../schemas/user-data');
const getUser = require('../utils/get-discord-from-mention');
const { osu } = require('../osu');

module.exports = {
  commands: ['add', 'addshard', 'addshards', 'as'],
  description: "Adds shards to a user's account",
  expectedArgs: '<username> <optional:amount to add>',
  permissionError: 'You need admin permissions to run this command',
  minArgs: 1,
  maxArgs: 2,
  callback: async (message, arguments, text, client) => {
    const id = getUser(arguments[0]);
    const increment = arguments.length == 2 ? parseInt(arguments[1], 10) : 1;

    if (!id) { // Passed in osu name instead of mention
      try {

        // console.log(`osu username ${arguments[0]}`);
        let osuAccount = await osu.user(arguments[0]);
        try {
          await mongo().then(async mongoose => {
            try {
              const documents = await userDataSchema.find({ osuId: osuAccount.id }).exec();
    
              if (documents.length > 1) {
                message.channel.send('Multiple members have linked with that osu account. Please mention the user you wish to know the shard count of instead.')
                return;
              } else {
                if(documents[0]) {
                  const value = documents[0].toObject().shards ? documents[0].toObject().shards : 0;
                  if(value + increment < 0) {
                    message.channel.send('You cannot set someone\'s shard count to be less than 0!');
                    return;
                  }
                }
    
                const document = await userDataSchema.findOneAndUpdate({
                  osuId: osuAccount.id
                }, {
                  $inc: {
                    'shards': increment
                  },
                }, {
                  upsert: false
                });
      
                if (!document) {
                  message.channel.send(`${osuAccount.username} is not linked to a discord account! They need to link their osu account with \`link\`!`);
                } else {
                  const previous = document.toObject().shards ? document.toObject().shards : 0;
                  message.channel.send(`Added ${increment} shards to ${osuAccount.username}. They now have ${previous + increment} shards.`);
                }
              }
            } catch(e) {
              console.error(e);
            } finally {
              mongoose.connection.close();
            }
          });
        } catch(e) {
          console.error(e);
        }
      } catch(e) {
        if(e && e.response && e.response.status && e.response.status === 404) {
          message.channel.send(`${arguments[0]} was not found! If you have spaces in your name, surround your name with quotation marks.`);
        } else {
          message.channel.send(`Error with fetching osu account data. Ping Blue-Fox cuz he probably fucked something up.`);
        }
        return;
      }
    } else { // mentioned someone
      // console.log(`mentioned user ${id}`);
      try {

        await mongo().then(async mongoose => {
          const documents = await userDataSchema.find({ _id: id }).exec();
          if(documents[0]) {
            const value = documents[0].toObject().shards ? documents[0].toObject().shards : 0;
            if(value + increment < 0) {
              message.channel.send('You cannot set someone\'s shard count to be less than 0!');
              return;
            }
          } else {
            if(increment < 0) {
              message.channel.send('You cannot set someone\'s shard count to be less than 0!');
              return;
            }
          }
  
          try {
            const document = await userDataSchema.findOneAndUpdate({
              _id: id
            }, {
              $inc: {
                'shards': increment
              },
            }, {
              upsert: true
            });
  
            if (document) {
              const previous = document.toObject().shards ? document.toObject().shards : 0;
              message.guild.members.fetch(id).then(member => {
                message.channel.send(`Added ${increment} shards to ${member.nickname ? member.nickname : member.user.username}. They now have ${previous + increment} shards.`);
              }).catch(console.error);
            } else {
              message.guild.members.fetch(id).then(member => {
                message.channel.send(`Added ${increment} shards to ${member.nickname ? member.nickname : member.user.username}. They now have ${increment} shards.`);
              }).catch(console.error);
            }
          } catch(e) {
            console.error(e);
          } finally {
            mongoose.connection.close();
          }
        });
      } catch(e) {
        console.error(e);
      }
    }
  },
  permissions: 'ADMINISTRATOR',
}
