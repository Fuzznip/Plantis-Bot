require('dotenv').config();
const { V1, V2, mods, tools } = require('osu-api-extended');
const v1 = new V1(process.env.OSU_API);
const v2 = new V2(process.env.OSU_CLIENT_ID, process.env.OSU_CLIENT_SECRET);

(async () => {
  try {
    await v2.login();
    // const user = await v2.user(15910288);
    // console.log(user);
  }
  catch (err) {
    console.error(err);
  }
})();

module.exports = {
  osu: v2,
  api_v1: v1,
  osu_mods: mods,
  osu_tools: tools,
};
