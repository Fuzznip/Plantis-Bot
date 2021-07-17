const mongo = require('../mongo');
const rewardDataSchema = require('../schemas/reward-data');
const getUser = require('../utils/get-discord-from-mention');
const { osu } = require('../osu');
const { prefix, mentionOwner } = require('../config.json');

module.exports = {
  commands: ['rewards', 'shop', 'listrewards'],
  description: `Lists the available rewards`,
  minArgs: 0,
  maxArgs: 0,
  callback: async (message, arguments, text, client) => {
    try {
      await mongo().then(async mongoose => {
        try {
          let rewardCount = 0;
          let messages = [];
          for await (const doc of rewardDataSchema.find()) {
            messages.push(`${doc.name} (${doc.price} Shards): ${doc.description}`);
          }

          messages.sort();
          
          let msg = "";
          for (const m of messages) {
            msg += m;
            msg += '\n';
            
            rewardCount += 1;

            if (rewardCount >= 10) {
              message.channel.send(msg);
              rewardCount = 0;
              msg = "";
            }
          }

          if (rewardCount !== 0) {
            message.channel.send(msg);
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
  },
}
