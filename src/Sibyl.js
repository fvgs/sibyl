import { WebClient } from '@slack/client';

import {
  computeMessageRating,
  computeUserPsychoPass,
  computeChannelPsychoPass,
  NUM_USER_MESSAGES,
  NUM_CHANNEL_MESSAGES,
} from './psychoPass';
import Leaderboard from './leaderboard/Leaderboard';

/**
 * Class responsible for processing input messages. Produces a response to be
 * sent to the client when appropriate.
 */
export default class {
  /**
   * Initialize user and channel leaderboards.
   *
   * @param {DataStore} store
   */
  constructor(store) {
    this.store = store;
    this.userLeaderboard = new Leaderboard();
    this.channelLeaderboard = new Leaderboard();

    this.initializeUserLeaderboard();
    this.initializeChannelLeaderboard();
  }

  static get NUM_USER_MESSAGES() {
   return  NUM_USER_MESSAGES;
  }

  static get NUM_CHANNEL_MESSAGES() {
    return NUM_CHANNEL_MESSAGES;
  }

  /**
   * Compute message ratings and a user's Psycho-Pass given an array of
   * messages.
   *
   * @public
   * @param {string[]} messages
   * @return {object} The Psycho-Pass and message ratings computed from the
   * messages.
   */
  static processUserMessages(messages) {
    const messageRatings = messages.map(computeMessageRating);
    const psychoPass = computeUserPsychoPass(messageRatings);

    return { psychoPass, messageRatings };
  }

  /**
   * Compute message ratings and a channel's Psycho-Pass given an array of
   * messages.
   *
   * @public
   * @param {string[]} messages
   * @return {object} The Psycho-Pass and message ratings computed from the
   * messages.
   */
  static processChannelMessages(messages) {
    const messageRatings = messages.map(computeMessageRating);
    const psychoPass = computeChannelPsychoPass(messageRatings);

    return { psychoPass, messageRatings };
  }

  /**
   * Initialize the user leaderboard.
   *
   * @private
   */
  initializeUserLeaderboard() {
    this.store.users.forEach(({ psychoPass }, id) => {
      this.store.leaderboards.users.update(id, psychoPass);
    });
  }

  /**
   * Initialize the channel leaderboard.
   *
   * @private
   */
  initializeChannelLeaderboard() {
    this.store.channels.forEach(({ psychoPass }, id) => {
      this.store.leaderboards.channels.update(id, psychoPass);
    });
  }

  /**
   * Process a new message.
   *
   * @public
   * @param {string} id The user id of the sender.
   * @param {string} message The body of the message.
   * @param {string} channel The id of the channel to which the message was
   * posted.
   * @param {string} timestamp
   * @return {string[]} The responses to be sent to the client. The array is
   * empty if there is no response.
   */
  newMessage(id, message, channel, timestamp) {
    const isChannelPublic = this.store.channels.has(channel);
    const responses = [];

    if (isChannelPublic) {
      this.updateChannel(channel, message, timestamp);
      this.updateUser(id, message, channel, timestamp);

      const response = this.checkChannelPsychoPass(channel);
      if (response) {
        responses.push(warning);
      }
    }

    const commandInfo = this.parseCommand(message);
    if (commandInfo) {
      switch (commandInfo.command) {
        case 'user':
          responses.unshift(this.psychoPassUser(commandInfo.id));
          break;
        case 'channel':
          responses.unshift(this.psychoPassChannel(commandInfo.id));
          break;
        case 'same channel':
          (() => {
            if (isChannelPublic) {
              responses.unshift(this.psychoPassChannel(channel));
            }
          })();
          break;
        case 'help':
          responses.unshift(this.help());
          break;
        case 'users':
          responses.unshift(this.leaderboardUsers());
          break;
        case 'channels':
          responses.unshift(this.leaderboardChannels());
      }
    }

    return responses;
  }

  /**
   * Parse a command from a message.
   *
   * @private
   * @param {string} message
   * @return {object|null} An object containing information about the parsed
   * command if one is found. If no command is found return null.
   */
  parseCommand(message) {
    if (message === 'psychopass') {
      return { command: 'same channel' };
    }

    const command = 'psychopass ';
    if (message.startsWith(command)) {
      const fragment = message.substr(command.length);

      let subCommand = /^<([@#])(.{2,})>/;
      const result = subCommand.exec(fragment);
      if (result) {
        const id = result[2];
        const command = result[1] === '@' ? 'user' : 'channel';

        return { id, command };
      }

      subCommand = /^help(?:\s|$)/;
      if (subCommand.test(fragment)) {
        return { command: 'help' };
      }

      subCommand = 'leaderboard ';
      if (fragment.startsWith(subCommand)) {
        const subFragment = fragment.substr(subCommand.length);

        let command = /^users(?:\s|$)/;
        if (command.test(subFragment)) {
          return { command: 'users' };
        }

        command = /^channels(?:\s|$)/;
        if (command.test(subFragment)) {
          return { command: 'channels' };
        }
      }
    }

    return null;
  }

  /**
   * Produce help message.
   *
   * @private
   * @return {string} The help message.
   */
  help() {
    return 'The following commands are available:\n' +
      'psychopass @<username>  -  See the Psycho-Pass of a user\n' +
      'psychopass [#<channel>]  -  See the Psycho-Pass of the current channel' +
      ' or of the channel specified by the optional parameter\n' +
      'psychopass leaderboard users  -  See the lowest and highest user' +
      ' Psycho-Passes\n' +
      'psychopass leaderboard channels  -  See the lowest and highest channel' +
      ' Psycho-Passes\n' +
      'psychopass help  -  See this help message';
  }

  /**
   * Produce response for user leaderboard.
   *
   * @private
   * @return {string} The user leaderboard response.
   */
  leaderboardUsers() {
    const highest = this.store.leaderboards.users.getHighest();
    const lowest = this.store.leaderboards.users.getLowest();

    let s = 'Lowest:\n';
    lowest.forEach(({ id, value: psychoPass }, index) => {
      const name = this.getUserName(id);
      s += `${psychoPass}    ${name}\n`;
    });

    s += '\nHighest:\n';
    highest.forEach(({ id, value: psychoPass }, index) => {
      const name = this.getUserName(id);
      s += `${psychoPass}    ${name}\n`;
    });

    return s;
  }

  /**
   * Produce response for channel leaderboard.
   *
   * @private
   * @return {string} The channel leaderboard response.
   */
  leaderboardChannels() {
    const highest = this.store.leaderboards.channels.getHighest();
    const lowest = this.store.leaderboards.channels.getLowest();

    let s = 'Lowest:\n';
    lowest.forEach(({ id, value: psychoPass }, index) => {
      s += `${psychoPass}    <#${id}>\n`;
    });

    s += '\nHighest:\n';
    highest.forEach(({ id, value: psychoPass }, index) => {
      s += `${psychoPass}    <#${id}>\n`;
    });

    return s;
  }

  /**
   * Update stored data and Psycho-Pass of a user based on a new message.
   *
   * @private
   * @param {string} id The user id.
   * @param {string} message
   * @param {string} channel The id of the channel.
   * @param {string} timestamp
   */
  updateUser(id, message, channel, timestamp) {
    const rating = computeMessageRating(message);
    const info = { rating, channel, timestamp };
    const { messageInfo, psychoPass: oldPsychoPass } = this.store.users.get(id);
    const len = messageInfo.unshift(info);

    if (len > NUM_USER_MESSAGES) {
      messageInfo.pop();
    }

    const ratings = messageInfo.map(({ rating }) => rating);
    const newPsychoPass = computeUserPsychoPass(ratings);

    this.store.leaderboards.users.update(id, newPsychoPass, oldPsychoPass);
    this.store.users.get(id).psychoPass = newPsychoPass;
  }

  /**
   * Update channel data based on a new message.
   *
   * @private
   * @param {string} id The channel id.
   * @param {string} message
   * @param {string} timestamp
   */
  updateChannel(id, message, timestamp) {
    const rating = computeMessageRating(message);
    const info = { rating, timestamp };
    const {
      messageInfo,
      psychoPass: oldPsychoPass,
    } = this.store.channels.get(id);
    const len = messageInfo.unshift(info);

    if (len > NUM_CHANNEL_MESSAGES) {
      messageInfo.pop();
    }

    const ratings = messageInfo.map(({ rating }) => rating);
    const newPsychoPass = computeChannelPsychoPass(ratings);

    this.store.leaderboards.channels.update(id, newPsychoPass, oldPsychoPass);
    this.store.channels.get(id).psychoPass = newPsychoPass;
  }

  /**
   * Check if a channel's Psycho-Pass exceeds the acceptable threshold. If so,
   * produce a response.
   *
   * @private
   * @param {string} channel The channel id.
   * @return {string|null} The response if there is one, otherwise null.
   */
  checkChannelPsychoPass(channel) {
    return null;
  }

  /**
   * Handle a request for the Psycho-Pass of a user and produce a response.
   *
   * @private
   * @param {string} id The user id.
   * @return {string} Response to the request.
   */
  psychoPassUser(id) {
    const name = this.getUserName(id);
    const psychoPass = this.getUserPsychoPass(id);

    return `${name} has a Psycho-Pass of ${psychoPass}`;
  }

  /**
   * Handle a request for the Psycho-Pass of a channel and produce a response.
   *
   * @private
   * @param {string} id The channel id.
   * @return {string} Response to the request.
   */
  psychoPassChannel(id) {
    const psychoPass = this.getChannelPsychoPass(id);

    return `<#${id}> has a Psycho-Pass of ${psychoPass}`;
  }

  /**
   * Get a user's username.
   *
   * @private
   * @param {string} id The user id.
   * @return {string} The user's username. 
   */
  getUserUsername(id) {
    return this.store.users.get(id).username;
  }

  /**
   * Get a user's name. If the user does not have a registered name, the
   * username is returned.
   *
   * @private
   * @param {string} id The user id.
   * @return {string} The user's name, or username if no registered name is
   * found.
   */
  getUserName(id) {
    let user = this.store.users.get(id).name;

    if (!user) {
      user = this.getUserUsername(id);
    }

    return user;
  }

  /**
   * Get a user's Psycho-Pass.
   *
   * @private
   * @param {string} id The user id.
   * @return {number} The user's Psycho-Pass.
   */
  getUserPsychoPass(id) {
    return this.store.users.get(id).psychoPass;
  }

  /**
   * Get the name of a channel.
   *
   * @private
   * @param {string} id The channel id.
   * @return {string} The channel name.
   */
  getChannelName(id) {
    return this.store.channels.get(id).name;
  }

  /**
   * Get a channel's Psycho-Pass.
   *
   * @private
   * @param {string} id The channel id.
   * @return {number} The channel's Psycho-Pass.
   */
  getChannelPsychoPass(id) {
    return this.store.channels.get(id).psychoPass;
  }
};
