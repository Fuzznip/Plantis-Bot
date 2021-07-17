const mongo = require('../mongo');
const userDataSchema = require('../schemas/user-data');
const getUser = require('../utils/get-discord-from-mention');
const { osu } = require('../osu');

module.exports = {
  commands: ['set', 'setshard', 'setshards', 'ss', 's'],
  description: "Sets the amount of shards in a user's account",
  expectedArgs: '<username> <amount to set to>',
  permissionError: 'You need admin permissions to run this command',
  minArgs: 2,
  maxArgs: 2,
  callback: async (message, arguments, text, client) => {
    let id = getUser(arguments[0]);
    const value = parseInt(arguments[1], 10);

    if (value < 0) {
      message.channel.send('You cannot set someone\'s shard count to be less than 0!');
      return;
    }

    if (!id) { // Passed in osu name instead of mention
      try {
        // console.log(`osu username ${arguments[0]}`);
        let osuAccount = await osu.user(arguments[0]);
        await mongo().then(async mongoose => {
          try {
            const documents = await userDataSchema.find({ osuId: osuAccount.id }).exec();
  
            if (documents.length > 1) {
              message.channel.send('Multiple members have linked with that osu account. Please mention the user you wish to know the shard count of instead.')
              return;
            } else {
              let document = await userDataSchema.findOneAndUpdate({
                osuId: osuAccount.id
              }, {
                $set: {
                  'shards': value
                },
              }, {
                upsert: false
              })
  
              if (!document) {
                message.channel.send(`${osuAccount.username} is not linked to a discord account! They need to link their osu account with \`link\`!`);
              } else {
                message.channel.send(`Set the shard count of ${osuAccount.username} to ${value}.`);
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
      // console.log(`mentioned user ${id}`);
      await mongo().then(async mongoose => {
        try {
          await userDataSchema.findOneAndUpdate({
            _id: id
          }, {
            $set: {
              'shards': value
            },
          }, {
            upsert: true
          });

        
          message.guild.members.fetch(id).then(member => {
            message.channel.send(`Set the shard count of ${member.nickname ? member.nickname : member.user.username} to ${value}.`);
          }).catch(console.error);
        } catch(e) {
          console.error(e);
        } finally {
          mongoose.connection.close();
        }
      });
    }
  },
  permissions: 'ADMINISTRATOR',
}
