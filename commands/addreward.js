const mongo = require('../mongo');
const rewardDataSchema = require('../schemas/reward-data');
const { prefix, mentionOwner } = require('../config.json');

module.exports = {
  commands: ['addreward', 'ar'],
  description: `Adds a reward. Check the available rewards with ${prefix}rewards`,
  expectedArgs: '<reward name> <reward price> <human readable reward description> [is extra text required? (0 = no, 1 = yes)] [is osu account required? (0 = no, 1 = yes)]',
  minArgs: 1,
  maxArgs: 5,
  callback: async (message, arguments, text, client) => {
    let rewardName = arguments[0].toLowerCase(), rewardPrice = parseInt(arguments[1]), rewardDescription = arguments[2], rewardTextRequired = false, rewardOsuRequired = false;
    if (arguments.length > 4) {
      rewardOsuRequired = !!parseInt(arguments[4]); // !! converts to boolean
    }
    
    if (arguments.length > 3) {
      rewardTextRequired = !!parseInt(arguments[3]); // !! converts to boolean
    }

    try {
      await mongo().then(async mongoose => {
        try {
          await rewardDataSchema.findOneAndUpdate({
            name: rewardName
          }, {
            $set: {
              'name': rewardName,
              'price': rewardPrice,
              'description': rewardDescription,
              'textRequired': rewardTextRequired,
              'osuRequired': rewardOsuRequired
            },
          }, {
            upsert: true
          });

          message.channel.send(`Successfully added ${rewardName} (${rewardDescription}) worth ${rewardPrice} shards to rewards.`);
        } catch(e) {
          console.error(e);
          message.channel.send(`Failed to add ${rewardName} (${rewardPrice}) to rewards.`);
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
