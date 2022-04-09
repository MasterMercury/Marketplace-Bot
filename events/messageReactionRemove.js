const axios = require("axios");
const admin = require("firebase-admin");
const Discord = require("discord.js");
const Color = require("../colors.json");

module.exports = async (Client, Reaction, User) => {

    var config = require("../settings/config.json");
    var db = admin.database();

    if (Reaction.partial) {
        try {
            await Reaction.fetch();
        } catch (Error) {
            return console.error(`Something went wrong when fetching the message: ${Error}`);
        }
    }

    const Message = Reaction.message;
    var Points = 0;

    if (User.bot || User == Message.author) {
        return;
    }

    if (Reaction.emoji.name == `👍`) {
        await axios.get(`${config.firebase_url}/showcase-leaderboard/${Message.author.id}/${Message.id}.json`)
        .then(async function (response) {
            if (response.data !== null) {
                Points = response.data.points;
            }
        })
        db.ref(`showcase-leaderboard/${Message.author.id}/${Message.id}`).set({
            points: Points - 1
        })
    } else if (Reaction.emoji.name == `💛`) {
        await axios.get(`${config.firebase_url}/showcase-leaderboard/${Message.author.id}/${Message.id}.json`)
        .then(async function (response) {
            if (response.data !== null) {
                Points = response.data.points;
            }
        })
        db.ref(`showcase-leaderboard/${Message.author.id}/${Message.id}`).set({
            points: Points - 3
        })
    } else if (Reaction.emoji.name == `🤩`) {
        await axios.get(`${config.firebase_url}/showcase-leaderboard/${Message.author.id}/${Message.id}.json`)
        .then(async function (response) {
            if (response.data !== null) {
                Points = response.data.points;
            }
        })
        db.ref(`showcase-leaderboard/${Message.author.id}/${Message.id}`).set({
            points: Points - 5
        })
    }
}
