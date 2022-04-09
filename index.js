const { Client, Intents } = require("discord.js");
const Enmap = require("enmap");
const admin = require("firebase-admin");
const fs = require("fs");
const Color = require("./colors.json");
var serviceAccount = require("./settings/serviceAccountKey.json");
const config = require("./settings/config.json");
const NewClient = new Client({ shards: 'auto', partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

NewClient.config = config;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `${config.firebase_url}`
});

fs.readdir(`./events/`, (Error, Files) => {
    Files.forEach(File => {
        const Event = require(`./events/${File}`);
        let EventName = File.split(".")[0];
        NewClient.on(EventName, Event.bind(null, NewClient));
    });
});

NewClient.commands = new Enmap();

fs.readdir(`./commands/`, (Error, Files) => {
  Files.forEach(File => {
      if (!File.endsWith(`.js`)) return;
      let Props = require(`./commands/${File}`);
      for (var i = 0; i < Props.info.names.length; i++) {
        NewClient.commands.set(Props.info.names[i], Props);
      }
      let CommandName = File.split(".")[0];
      console.log(`Command Started-Up: ${CommandName}`)
  });
});

NewClient.login(config.bot_token);
