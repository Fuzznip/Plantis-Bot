const fetch = require('node-fetch');
const mongo = require('../mongo');
const userDataSchema = require('../schemas/user-data');
const rewardDataSchema = require('../schemas/reward-data');
const getUser = require('../utils/get-discord-from-mention');
const { osu } = require('../osu');
const { prefix } = require('../config.json');

module.exports = {
  commands: ['redeem', 'r', 'buy'],
  description: `Redeems a reward. Check the available rewards with ${prefix}rewards`,
  expectedArgs: '<reward> [amount to redeem] [optional text]',
  minArgs: 1,
  callback: async (message, arguments, text, client) => {
    console.log('REWARD REDEMPTION STARTED')
    let amount = 1;

    console.log('checking argument length to see if any extra information added')
    if (arguments.length > 1) {
      amount = parseInt(arguments[1]);
      if (isNaN(amount)) {
        amount = 1;
      }
    }

    console.log('checking to make sure not redeeming 0 of a reward')
    if (amount <= 0) {
      message.channel.send("You cannot redeem less than 1 of a reward!");
      console.log('REWARD REDEMPTION ENDED')
      return;
    }

    let rewardName = arguments[0].toLowerCase(), rewardPrice, rewardDescription, rewardOsuRequired = false, rewardExists = false, rewardTextRequired = false;

    try {
      console.log('connecting to reward db')
      await mongo().then(async mongoose => {
        try {
          console.log('connected to reward db')
          console.log('finding reward type from name')
          let document = await rewardDataSchema.findOne({ name: rewardName }).exec();
          
          console.log('checking if document exists')
          if (document) {
            console.log('document exists')
            console.log('checking for reward requirements')
            let docObj = document.toObject();
            rewardName = docObj.name;
            rewardPrice = docObj.price;
            rewardDescription = docObj.description;
            if ('osuRequired' in docObj) {
              console.log('osu is required')
              rewardOsuRequired = docObj.osuRequired;
            }
            if('textRequired' in docObj) {
              console.log('extra info is required')
              rewardTextRequired = docObj.textRequired;
            }
            rewardExists = true;
          }
        } catch(e) {
          console.log(e)
          console.error(e);
          message.channel.send(e);
        } finally {
          console.log('closing mongo connection')
          mongoose.connection.close();
        }
      });
    } catch(e) {
      console.log('Failed to connect to reward database.')
      console.log(e)
      message.channel.send(`Failed to connect to reward database.`);
      console.error(e);
      console.log('REWARD REDEMPTION ENDED')
      return;
    }

    console.log('checking if reward exists in database')
    if (rewardExists) {
      
      console.log('reward exists')
      let id = getUser(message.author.toString());

      try {
        console.log('connecting to user database')
        await mongo().then(async mongoose => {
          try {
            console.log('connected to user database.')
            console.log('finding user by discord id')
            let document = await userDataSchema.findOne({ _id: id }).exec();
    
            let shardCount = 0, osuFound = false, osuId;
            if (document) {
              console.log('user is found')
              let documentObject = document.toObject();
  
              if ('osu' in documentObject) {
                osuFound = true;
                osuId = documentObject.osuId;
              }
              shardCount = 'shards' in documentObject ? documentObject.shards : 0;
            }
            
            if (!rewardOsuRequired || osuFound) {
              console.log('osu requirements met')
              if (!rewardTextRequired || ((arguments.length > 1 && amount === 1) || (arguments.length > 2 && amount !== 1))) {
                console.log('extra information requirements met')
                if (shardCount >= rewardPrice * amount) {
                  console.log('updating document')
                  shardCount -= rewardPrice * amount;
                  document.shards = shardCount;
                  console.log('saving document');
                  await document.save();
                  console.log('saving document ended');
  
                  console.log('constructing reward message')
                  let embed = [
                    {
                      title: `${message.member.displayName} has redeemed ${amount > 1 ? amount + "x " : ""}${rewardDescription}!`,
                      color: 4193862,
                      fields: [
                        {
                          name: message.member.displayName,
                          value: message.content
                        }
                      ],
                      thumbnail: {
                        "url": "https://cdn0.iconfinder.com/data/icons/shift-free/32/Complete_Symbol-512.png"
                      },
                    }
                  ];
                  
                  let content = `An Unknown Error Occurred!`;
  
                  if (rewardOsuRequired) {
                    console.log('finding osu account')
                    let osuAccount;
                    try {
                      osuAccount = await osu.user(osuId);
                      if (osuAccount) {
                        console.log('osu account found')
                        content = `${osuAccount.username} has redeemed ${amount > 1 ? amount + "x " : ""}${rewardDescription}.`;
                        embed[0]['fields'].push({ name: `osu! ID: ${osuId}`, value: osuAccount.username });
                      }
                    } catch(e) {
                      if(e && e.response && e.response.status && e.response.status === 404) {
                        console.log('osu account not found')
                        content = `Could not find osu! name: \`${msg}\``;
                      } else {
                        console.error(e);
                        console.log('bancho down')
                        content = 'Error processing request. Not sure of the cause, but Bancho is probably down.';
                      }
                    }
                  } else {
                    content = `${message.member.displayName} has redeemed ${amount > 1 ? amount + "x " : ""}${rewardDescription}.`
                  }
  
                  embed[0]['description'] = content;
  
                  var params = {
                    embeds: embed
                  };
                  
                  
                  console.log('sending discord webhook message')
                  fetch(process.env.DISCORD_WEBHOOK_REWARD_REDEMPTION_LINK, {
                    method: "POST",
                    headers: {
                      'Content-type': 'application/json'
                    },
                    body: JSON.stringify(params)
                  }).then(res => {
                    if (res.status !== 204) {
                      throw 'Looks like there was a problem. Status Code: ' + response.status;
                    }
                  }).catch(function(err) {
                    console.error('Fetch Error :-S', err);
                  });
                  console.log('discord webhook message sent')
  
                  message.reply(`you have successfully redeemed ${amount > 1 ? amount + "x " : ""}${rewardDescription} for ${rewardPrice * amount} shards! The admins have been notified about your purchase and you will receive your rewards when Grant gets around to it! (You now have ${shardCount} shards remaining.)`);
                } else {
                  
                  console.log('not enough shards')
                  message.reply(`you do not have enough shards to buy ${amount > 1 ? amount + "x " : ""}${rewardDescription}! (${amount > 0 ? amount + "x " : ""}${rewardDescription} costs ${rewardPrice * amount} shards but you only have ${shardCount} shards!)`);
                }
              } else {
                
                console.log('extra information failure')
                message.reply(`you must provide additional information in order to redeem this reward! Add more information to the end of the redeem command (ex. ${prefix}redeem ${text} <Additional Text Here>)`);
              }
            } else {
              
              console.log('no osu account linked failure')
              message.reply(`you must have an osu account linked with \`${prefix}link\` before you can redeem this reward!`);
            }
          } catch(e) {
            console.log('post-database connection failure')
            console.log(e);
            console.error(e);
            message.channel.send(e);
          } finally {
            console.log('user database connection closed')
            mongoose.connection.close();
          }
        });
      } catch(e) {
        console.log('failed to connect to user database')
        message.channel.send(`Failed to connect to shard database.`);
        console.error(e);
      }
    } else {
      console.log('not a real reward error')
      message.channel.send(`${rewardName} is not a real reward! (Check your spelling).`);
    }

    console.log('REWARD REDEMPTION ENDED')
  },
}
