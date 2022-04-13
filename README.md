# Marketplace Bot
### Open-Source program written in discord.js by myself mostly (with the help of another open-source project as the base)

---

### Setup

* There are comments on lines in the following files which you have to pre-define some type of Id, should be self explanatory:
  * [approve.js](https://github.com/MasterMercury/Marketplace-Bot/blob/main/commands/approve.js)
  * [collect.js](https://github.com/MasterMercury/Marketplace-Bot/blob/main/commands/collect.js)
  * [decline.js](https://github.com/MasterMercury/Marketplace-Bot/blob/main/commands/decline.js)
  * [pending.js](https://github.com/MasterMercury/Marketplace-Bot/blob/main/commands/pending.js)
  * [remove.js](https://github.com/MasterMercury/Marketplace-Bot/blob/main/commands/remove.js)
  * [submit.js](https://github.com/MasterMercury/Marketplace-Bot/blob/main/commands/submit.js)
  * [messageCreate.js](https://github.com/MasterMercury/Marketplace-Bot/blob/main/events/messageCreate.js)
  * [messageReactionAdd.js](https://github.com/MasterMercury/Marketplace-Bot/blob/main/events/messageReactionAdd.js)
  * [config.js](https://github.com/MasterMercury/Marketplace-Bot/blob/main/settings/config.json) (in this one, the fields have been left blank for you to fill in)

* You must also add a serviceAccountKey file to the [settings folder](https://github.com/MasterMercury/Marketplace-Bot/blob/main/settings):
  * Head to [Firebase by Google](https://firebase.google.com) and get started.
  * Add a new project, follow the instructions, and set it up.
  * Make sure you're on the project's main page, click the menu icon, click the settings icon, and head to Project settings.
  * Click Service accounts, make sure you're on Firebase Admin SDK, and create a new service account.
  * Once done, make sure the Admin SDK configuration snippet is set to Node.js, and generate a new private key.
  * Put this key into the [settings folder](https://github.com/MasterMercury/Marketplace-Bot/blob/main/settings), and make sure the file name is "serviceAccountKey.json".
* The final thing you need to do is to find a place to host, and you'll be set to go!
