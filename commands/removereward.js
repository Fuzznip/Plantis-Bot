const mongo = require('../mongo');
const rewardDataSchema = require('../schemas/reward-data');
const { prefix, mentionOwner } = require('../config.json');

module.exports = {
  commands: ['removereward', 'rr'],
  description: `Removes a reward. Check the available rewards with ${prefix}rewards`,
  expectedArgs: '<reward name>',
  minArgs: 1,
  maxArgs: 1,
  callback: async (message, arguments, text, client) => {
    let rewardName = arguments[0].toLowerCase();

    try {
      await mongo().then(async mongoose => {
        try {
          await rewardDataSchema.findOneAndDelete({ name: rewardName });

          message.channel.send(`Successfully removed ${rewardName}.`);
        } catch(e) {
          console.error(e);
          message.channel.send(`Failed to remove ${rewardName}.`);
        } finally {
          mongoose.connection.close();
        }
      });
    } catch(e) {
      message.channel.send(`Failed to connect to reward database. ${mentionOwner} FYI.`);
      console.error(e);
    }
  },
  permissions: 'ADMINISTRATOR',
}
