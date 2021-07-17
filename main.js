require('dotenv').config();
const Discord = require('discord.js');
const fetch = require('node-fetch');
const { osu } = require('./osu');
const mongo = require('./mongo');
const userDataSchema = require('./schemas/user-data');
const client = new Discord.Client();
const tmi = require('tmi.js');

const loadCommands = require('./commands/load-commands');

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  loadCommands(client);
});

client.login(process.env.TOKEN);

// Define configuration options
const opts = {
  identity: {
    username: process.env.TWITCH_BOT_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN
  },
  channels: [
    process.env.TWITCH_CHANNEL_NAME
  ]
};

// Create a client with our options
const tclient = new tmi.client(opts);

// Register our event handlers (defined below)
tclient.on('message', onMessageHandler);
tclient.on('connected', onConnectedHandler);

// Connect to Twitch:
tclient.connect();

// Called every time a message comes in
async function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  if (context['custom-reward-id'] === process.env.TWITCH_SHARD_REWARD_ID) {
    let osuAccount, success = false, content = `An Unknown Error Occurred, Please Confirm the Shard Total of this User!`;
    try {
      osuAccount = await osu.user(msg);
      if (osuAccount) {
        await mongo().then(async mongoose => {
          try {
            const documents = await userDataSchema.find({ osuId: osuAccount.id }).exec();
  
            if (documents.length > 1) {
              success = false;
              content = 'Multiple members have linked with this osu account. An Admin must manually add a shard to the correct discord username of the owner of this account.';
            } else if (documents.length === 1) {
              const document = await userDataSchema.findOneAndUpdate({
                osuId: osuAccount.id
              }, {
                $inc: {
                  'shards': 1
                },
              }, {
                upsert: false
              });
  
              const previous = document.toObject().shards ? document.toObject().shards : 0;
              success = true;
              content = `Added 1 shard to ${osuAccount.username}. They now have ${previous + 1} shards.`;
            } else {
              success = false;
              content = `${osuAccount.username} is not linked to a discord account! They need to link their osu account with \`link\` before shards can be added to their account!`;
            }
          } catch(e) {
            console.error(e);
          } finally {
            mongoose.connection.close();
          }
        });
      }
    } catch(e) {
      success = false;
      if(e && e.response && e.response.status && e.response.status === 404) {
        content = `Could not find osu! name: \`${msg}\``;
      } else {
        console.log(e);
        content = 'Error processing request. Not sure of the cause, but Bancho is probably down.';
      }
    }

    let embed;
    if (success) {
      embed = [
        {
          "title": `${context.username} has redeemed a shard!`,
          "description": content,
          "color": 4193862,
          "fields": [
            {
              "name": context.username,
              "value": msg
            }
          ],
          "thumbnail": {
            "url": "https://cdn0.iconfinder.com/data/icons/shift-free/32/Complete_Symbol-512.png"
          },
        }
      ]
    } else {
      embed = [
        {
          "title": `${context.username} failed to redeem a shard.`,
          "description": content,
          "color": 12845056,
          "fields": [
            {
              "name": context.username,
              "value": msg
            }
          ],
          "thumbnail": {
            "url": "https://cdn0.iconfinder.com/data/icons/shift-free/32/Error-512.png"
          },
        }
      ]
    }

    var params = {
      embeds: embed
    };
  
    fetch(process.env.DISCORD_WEBHOOK_LINK, {
      method: "POST",
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(params)
    }).then(res => {
      if (res.status !== 204) {
        throw 'Looks like there was a problem. Status Code: ' + response.status;
      }
    }
    ).catch(function(err) {
      console.log('Fetch Error :-S', err);
    });
  }

  if(context['custom-reward-id'] === process.env.TWITCH_FIVE_SHARD_REWARD_ID) {
    let osuAccount, success = false, content = `An Unknown Error Occurred, Please Confirm the Shard Total of this User!`;
    try {
      osuAccount = await osu.user(msg);
      if (osuAccount) {
        await mongo().then(async mongoose => {
          try {
            const documents = await userDataSchema.find({ osuId: osuAccount.id }).exec();
  
            if (documents.length > 1) {
              success = false;
              content = 'Multiple members have linked with this osu account. An Admin must manually add a shard to the correct discord username of the owner of this account.';
            } else if (documents.length === 1) {
              const document = await userDataSchema.findOneAndUpdate({
                osuId: osuAccount.id
              }, {
                $inc: {
                  'shards': 5
                },
              }, {
                upsert: false
              });
  
              const previous = document.toObject().shards ? document.toObject().shards : 0;
              success = true;
              content = `Added 5 shards to ${osuAccount.username}. They now have ${previous + 5} shards.`;
            } else {
              success = false;
              content = `${osuAccount.username} is not linked to a discord account! They need to link their osu account with \`link\` before shards can be added to their account!`;
            }
          } catch(e) {
            console.error(e);
          } finally {
            mongoose.connection.close();
          }
        });
      }
    } catch(e) {
      success = false;
      if(e && e.response && e.response.status && e.response.status === 404) {
        content = `Could not find osu! name: \`${msg}\``;
      } else {
        console.log(e);
        content = 'Error processing request. Not sure of the cause, but Bancho is probably down.';
      }
    }

    let embed;
    if (success) {
      embed = [
        {
          "title": `${context.username} has redeemed 5 shards!`,
          "description": content,
          "color": 4193862,
          "fields": [
            {
              "name": context.username,
              "value": msg
            }
          ],
          "thumbnail": {
            "url": "https://cdn0.iconfinder.com/data/icons/shift-free/32/Complete_Symbol-512.png"
          },
        }
      ]
    } else {
      embed = [
        {
          "title": `${context.username} failed to redeem 5 shards.`,
          "description": content,
          "color": 12845056,
          "fields": [
            {
              "name": context.username,
              "value": msg
            }
          ],
          "thumbnail": {
            "url": "https://cdn0.iconfinder.com/data/icons/shift-free/32/Error-512.png"
          },
        }
      ]
    }

    var params = {
      embeds: embed
    };
  
    fetch(process.env.DISCORD_WEBHOOK_LINK, {
      method: "POST",
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(params)
    }).then(res => {
      if (res.status !== 204) {
        throw 'Looks like there was a problem. Status Code: ' + response.status;
      }
    }
    ).catch(function(err) {
      console.log('Fetch Error :-S', err);
    });
  }

  if (context['custom-reward-id'] === process.env.TWITCH_SUPPORTER_REWARD_ID) {
    console.log('supporter redeemed')
    fetch(process.env.DISCORD_WEBHOOK_TWITCH_SUB_REDEEM, {
      method: "POST",
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [
          {
            "title": `${context.username} has redeemed 1 month of osu! supporter!`,
            "description": `${context.username} has successfully redeemed 1 month of osu! supporter!`,
            "color": 4193862,
            "fields": [
              {
                "name": context.username,
                "value": msg
              }
            ],
            "thumbnail": {
              "url": "https://cdn0.iconfinder.com/data/icons/shift-free/32/Complete_Symbol-512.png"
            },
          }
        ]
      })
    }).then(res => {
      if (res.status !== 204) {
        throw 'Looks like there was a problem. Status Code: ' + response.status;
      }
    }).catch(function(err) {
      console.log('Fetch Error :-S', err);
    });
    
    console.log('supporter done redeemed')
  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
