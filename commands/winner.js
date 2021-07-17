const mongo = require('../mongo');
const userDataSchema = require('../schemas/user-data');
const getUser = require('../utils/get-discord-from-mention');
const { osu } = require('../osu');
const { prefix } = require('../config.json');

module.exports = {
  commands: ['winner', 'winners', 'w' ],
  description: "Adds 1 shard to a winner of a 1v1 or 2v2. Adds 2 shards if they are a twitch sub.",
  expectedArgs: '<username> [optional list of usernames...]',
  minArgs: 1,
  callback: async (message, arguments, text, client) => {
    let successes = [];
    let failures = [];

    for (const member of arguments) {
      try {
        let id = getUser(member);

        if(!id) { // osu username
          try {
            let osuAccount = await osu.user(member);

            await mongo().then(async mongoose => {
              try {
                let documents = await userDataSchema.find({ osuId: osuAccount.id }).exec();
      
                if (documents.length > 1) {
                  failures.push({ name: member, reason: `Multiple members have linked with this osu account.` });
                } else {
                  if (!documents[0]) {
                    failures.push({ name: member, reason: `${osuAccount.username} is not linked to a discord account!` });
                  } else {
                    let value = 1, isSub = false, discordId = documents[0]._id;
                    let guildMember = message.guild.members.cache.find(m => m.id === discordId) || await message.guild.members.fetch(discordId);
                    if (guildMember._roles.find(e => e === process.env.DISCORD_TWITCH_SUB_ROLE_ID)) {
                      value = 2;
                      isSub = true;
                    }

                    const document = await userDataSchema.findOneAndUpdate({
                      osuId: osuAccount.id
                    }, {
                      $inc: {
                        'shards': value
                      },
                    }, {
                      upsert: false
                    });
                    let previousVal = document.shards ? document.shards : 0;
                    successes.push({ name: member, is_subbed: isSub, prevVal: previousVal, newVal: previousVal + value });
                  }
                }
              } catch(e) {
                console.error(e);
                failures.push({ name: member, reason: e });
              } finally {
                mongoose.connection.close();
              }
            });
          } catch(e) {
            if(e && e.response && e.response.status && e.response.status === 404) {
              failures.push({ name: member, reason: `${member} was not found! Surround names with spaces with quotation marks.` });
            } else {
              failures.push({ name: member, reason: 'Error with fetching osu account data.' });
            }
          }
        } else {
          try {
            await mongo().then(async mongoose => {
              try {
                let value = 1, isSub = false;
                let guildMember = message.guild.members.cache.find(m => m.id === id) || await message.guild.members.fetch(id);
                if (guildMember._roles.find(e => e === process.env.DISCORD_TWITCH_SUB_ROLE_ID)) {
                  value = 2;
                  isSub = true;
                }

                const document = await userDataSchema.findOneAndUpdate({
                  _id: id
                }, {
                  $inc: {
                    'shards': value
                  },
                }, {
                  upsert: true
                });
      
                if (document) {
                  const previous = document.toObject().shards ? document.toObject().shards : 0;
                  successes.push({ name: guildMember.displayName, is_subbed: isSub, prevVal: previous, newVal: previous + value });
                } else {
                  successes.push({ name: guildMember.displayName, is_subbed: isSub, prevVal: 0, newVal: value });
                }
              } catch(e) {
                console.error(e);
                failures.push({ name: member, reason: e });
              } finally {
                mongoose.connection.close();
              }
            });
          } catch(e) {
            console.error(e);
            failures.push({ name: member, reason: e });
          }
        }
      } catch(e) {
        console.error(e);
      }
    }

    let msg = "Successfully Added:";
    for (const success of successes) {
      msg += '\n';
      if (success.is_subbed) {
        msg += `${success.name} is a Twitch Sub and has gained ${success.newVal - success.prevVal} shards. They now have ${success.newVal} shards.`;
      } else {
        msg += `${success.name} has gained ${success.newVal - success.prevVal} shards. They now have ${success.newVal} shards.`;
      }
    }

    if (failures.length) {
      msg +='\nFailed to Add:'
      for (const failure of failures) {
        msg += '\n';
        msg += `${failure.name}: ${failure.reason}`;
      }
    }

    message.channel.send(msg);
  },
  permissions: 'ADMINISTRATOR',
}
