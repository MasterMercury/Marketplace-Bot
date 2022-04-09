const Discord = require("discord.js");
const axios = require("axios");
const admin = require("firebase-admin");
const Color = require("../colors.json");

exports.run = async (Client, Message, Args) => {

    var db = admin.database();
    const CollectChannel = await Client.channels.cache.find(channel => channel.id == (``)); // 1 here
    const SpotlightChannel = await Client.channels.cache.find(channel => channel.id == (``)); // 1 here
    const ReactionFilter = async (Reaction, User) => {
        var GuildMember = await Message.guild.members.fetch(User.id);
        return ([`1️⃣`, `2️⃣`, `3️⃣`, `4️⃣`, `5️⃣`, `6️⃣`, `7️⃣`, `8️⃣`, `9️⃣`, `🔟`].includes(Reaction.emoji.name) && GuildMember.roles.cache.some(role => role.id === (``)) || [`❌`].includes(Reaction.emoji.name) && GuildMember.roles.cache.some(role => role.id === (``))) // 2 here
    }
    let Counter = 0
    var CollectedContent = {};

    function GetKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }

    if (!Message.member.roles.cache.some(Role => Role.id == (``))) { // 1 here
        return;
    }

    await axios.get(`${Client.config.firebase_url}/showcase-leaderboard.json`)
    .then(async function (response) {
        if (response.data !== null) {
            var ObjectKeys = Object.keys(response.data);
            for (User = 0; User < ObjectKeys.length; User++) {
                var UserId = ObjectKeys[User];
                var StoredMessages = Object.keys(response.data[UserId]);
                for (UserMessage = 0; UserMessage < StoredMessages.length; UserMessage++) {
                    Counter += 1;
                    var MessageId = StoredMessages[UserMessage];
                    CollectedContent[Counter] = {
                        User: UserId,
                        Message: MessageId,
                        Points: response.data[UserId][MessageId].points
                    }
                }
            }
        }
    })

    var CollectedDescription = `This month's GCC Spotlight poll is now available!`;
    var SortedContent = [];
    for (var Content in CollectedContent) {
        SortedContent.push(CollectedContent[Content]);
    }

    SortedContent.sort(function(a, b) {
        return b.Points - a.Points;
    });

    for (var SomeObject in SortedContent) {
        if (SomeObject > 9) {
            continue;
        }
        var TheObject = SortedContent[SomeObject];
        var UserObject = await Client.users.fetch(`${TheObject.User}`) || {
            name: `Undefined`,
            tag: `Undefined`,
            id: `Undefined`,
            displayAvatarURL: function() {
                return `https://tickettool.xyz/assets/images/noLogo.png`
            }
        };
        CollectedDescription += `\n${Number(SomeObject) + 1}. **${UserObject}** | Rating: ${TheObject.Points} | [Link](https://discord.com/channels/ServerId/ChannelId/${TheObject.Message})` // 2 here
    }

    var CollectedEmbed = new Discord.MessageEmbed()
        .setColor(Color.general)
        .setTitle(`Collected Messages for Spotlight`)
        .setDescription(CollectedDescription);
    await Message.channel.send({ embeds: [CollectedEmbed] }).then(async (Msg) => {
        var NumberObject = {
            1: `one`,
            2: `two`,
            3: `three`,
            4: `four`,
            5: `five`,
            6: `six`,
            7: `seven`,
            8: `eight`,
            9: `nine`,
            10: `ten`
        }
        var EmojiObject = {
            one: `1️⃣`,
            two: `2️⃣`,
            three: `3️⃣`,
            four: `4️⃣`,
            five: `5️⃣`,
            six: `6️⃣`,
            seven: `7️⃣`,
            eight: `8️⃣`,
            nine: `9️⃣`,
            ten: `🔟`
        };
        Msg.react(`1️⃣`)
        .then(() => Msg.react(`2️⃣`))
        .then(() => Msg.react(`3️⃣`))
        .then(() => Msg.react(`4️⃣`))
        .then(() => Msg.react(`5️⃣`))
        .then(() => Msg.react(`6️⃣`))
        .then(() => Msg.react(`7️⃣`))
        .then(() => Msg.react(`8️⃣`))
        .then(() => Msg.react(`9️⃣`))
        .then(() => Msg.react(`🔟`))
        .then(() => Msg.react(`❌`))
        .catch(Err => console.error(Err));

        var TimeDelayed = 10;
        const ReactionCollector = await Msg.createReactionCollector({ filter: ReactionFilter, dispose: true, time: 7 * 86400000 })
        ReactionCollector.on(`collect`, async (Collected, User) => {
            while (TimeDelayed < 10) {
                DelayTask(TimeDelayed)
                TimeDelayed++
            }
            function DelayTask(i) {
                if (i < 10) {
                    setTimeout(function() {
                    }, 500 * i);
                } else {
                    i = 0;
                }
            }

            TimeDelayed = 0;
            var UserReacted = 0;
            var Points = 0;
            var OriginalPoints = 0;
            var Reaction = null;
            var Author = 0;
            var MessageId = 0;

            if (Collected.emoji.name == `❌`) {
                return ReactionCollector.stop()
            }

            for (var Count in EmojiObject) {
                Reaction = EmojiObject[Count];
                if (Reaction == Collected.emoji.name) {
                    break;
                }
            }

            for (var Count in NumberObject) {
                var Number = NumberObject[Count];
                if (Number == GetKeyByValue(EmojiObject, Reaction)) {
                    var TheObject = SortedContent[Count - 1];
                    var UserObject = await Client.users.fetch(`${TheObject.User}`) || {
                        name: `Undefined`,
                        tag: `Undefined`,
                        id: `Undefined`,
                        displayAvatarURL: function() {
                            return `https://tickettool.xyz/assets/images/noLogo.png`
                        }
                    };
                    OriginalPoints = TheObject.Points;
                    Author = UserObject.id;
                    MessageId = TheObject.Message;
                    break;
                }
            }

            await axios.get(`${Client.config.firebase_url}/spotlight/staff/${User.id}.json`)
            .then(function (response) {
                if (response.data !== null) {
                    UserReacted = response.data.react_count;
                }
            })
            await axios.get(`${Client.config.firebase_url}/spotlight/${GetKeyByValue(EmojiObject, Reaction)}.json`)
            .then(function (response) {
                if (response.data !== null) {
                    Author = response.data.author;
                    MessageId = response.data.message;
                    Points = response.data.points;
                }
            })

            UserReacted += 1;
            Points += 1;

            if (UserReacted > 3 && User.id !== Client.user.id) {
                Collected.users.remove(User.id);
            }

            db.ref(`spotlight/staff/${Message.author.id}`).set({
                react_count: UserReacted
            })
            db.ref(`spotlight/${GetKeyByValue(EmojiObject, Reaction)}`).set({
                author: Author,
                message: MessageId,
                points: Points
            })
            TimeDelayed = 10;
        })

        ReactionCollector.on(`remove`, async (Removed, User) => {
            while (TimeDelayed < 10) {
                DelayTask(TimeDelayed)
                TimeDelayed++
            }
            function DelayTask(i) {
                if (i < 10) {
                    setTimeout(function() {
                    }, 500 * i);
                } else {
                    i = 0;
                }
            }

            TimeDelayed = 0;
            var UserReacted = 0;
            var Points = 0;
            var OriginalPoints = 0;
            var Reaction = null;
            var Author = 0;
            var MessageId = 0;

            for (var Count in EmojiObject) {
                Reaction = EmojiObject[Count];
                if (Reaction == Removed.emoji.name) {
                    break;
                }
            }

            for (var Count in NumberObject) {
                var Number = NumberObject[Count];
                if (Number == GetKeyByValue(EmojiObject, Reaction)) {
                    var TheObject = SortedContent[Count - 1];
                    var UserObject = await Client.users.fetch(`${TheObject.User}`) || {
                        name: `Undefined`,
                        tag: `Undefined`,
                        id: `Undefined`,
                        displayAvatarURL: function() {
                            return `https://tickettool.xyz/assets/images/noLogo.png`
                        }
                    };
                    OriginalPoints = TheObject.Points;
                    Author = UserObject.id;
                    MessageId = TheObject.Message;
                    break;
                }
            }

            await axios.get(`${Client.config.firebase_url}/spotlight/staff/${User.id}.json`)
            .then(async function (response) {
                if (response.data !== null) {
                    UserReacted = response.data.react_count;
                }
            })
            await axios.get(`${Client.config.firebase_url}/spotlight/${GetKeyByValue(EmojiObject, Reaction)}.json`)
            .then(async function (response) {
                if (response.data !== null) {
                    Author = response.data.author;
                    MessageId = response.data.message;
                    Points = response.data.points;
                }
            })

            UserReacted -= 1;
            Points -= 1;

            db.ref(`spotlight/staff/${Message.author.id}`).set({
                react_count: UserReacted
            })
            db.ref(`spotlight/${GetKeyByValue(EmojiObject, Reaction)}`).set({
                author: Author,
                message: MessageId,
                points: Points
            })
            TimeDelayed = 10;
        })

        ReactionCollector.on(`end`, async (Collected) => {
            var Leaderboard = [];
            var SpotlightEmbedDescription = ``;
            var OriginalPoints = 0;
        
            await axios.get(`${Client.config.firebase_url}/spotlight.json`)
            .then(async function (response) {
                if (response.data !== null) {
                    var Counter = 0
                    for (var Key in response.data) {
                        Counter += 1;
                        if (Key !== `staff`) {
                            Leaderboard[Counter] = response.data[Key];
                            Leaderboard[Counter].key = Key;
                        }
                    }
                }
            })
        
            var SortedLeaderboard = Leaderboard.sort(function(a, b) {
                return b.points - a.points;
            });
        
            var FilteredLeaderboard = SortedLeaderboard.filter(function (Element) {
                return Element !== null;
            })
        
            for (Placing = 0; Placing < 3; Placing++) {
                var UserObject = await Client.users.fetch(`${FilteredLeaderboard[Placing].author}`) || {
                    name: `Undefined`,
                    tag: `Undefined`,
                    id: `Undefined`,
                    displayAvatarURL: function() {
                        return `https://tickettool.xyz/assets/images/noLogo.png`
                    }
                };
                await axios.get(`${Client.config.firebase_url}/showcase-leaderboard/${UserObject.id}/${FilteredLeaderboard[Placing].message}.json`)
                .then(async function (response) {
                    if (response.data !== null) {
                        OriginalPoints = response.data.points;
                    }
                })
                SpotlightEmbedDescription += `\n${Number(Placing) + 1}. **${UserObject}** | Overall Rating: ${OriginalPoints} | [Link](https://discord.com/channels/ServerId/ChannelId/${FilteredLeaderboard[Placing].message})` // 2 here
            }
            var SpotlightEmbed = new Discord.MessageEmbed()
                .setColor(Color.general)
                .setTitle(`Spotlight Results`)
                .setDescription(SpotlightEmbedDescription);
            return Message.channel.send({ embeds: [SpotlightEmbed] });
        })
    });
};

exports.info = {
    names: ["collect"],
    groups: ["s", "spotlight"],
    usage: 'collect',
    description: 'WIP'
};