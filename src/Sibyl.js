import { WebClient } from '@slack/client';

import {
  computeMessageRating,
  computeUserPsychoPass,
  NUM_USER_MESSAGES,
} from './psychoPass';

/**
 * Class responsible for processing input and maintaing the application state.
 * Produces a response to be sent to the client when appropriate.
 */
export default class {
  /**
   * Initialize data store and Slack web client.
   *
   * @param {WebClient} web A WebClient instance.
   * @param {Map<string, object>} userData Map from user id to an object
   * containing user data.
   * @param {Map<string, object>} channelData Map from channel id to an object
   * containing channel data.
   */
  constructor(web, userData, channelData) {
    this.store = { users: userData, channels: channelData };
    this.web = web;
  }

  /**
   * Create an instance of the Sibyl class.
   *
   * @public
   * @param {string} token The Slack API token.
   * @return {Promise<Sibyl>} Instance of Sibyl class.
   */
  static createSibyl(token) {
    const web = new WebClient(token);
    const userData = this.getInitialUserData(web);
    const channelData = this.getInitialChannelData(web);
    const sibyl = Promise.all([userData, channelData]).then(
      ([userData, channelData]) => {
        return new this(web, userData, channelData);
      }
    );

    return sibyl;
  }

  /**
   * Fetch initial user data.
   *
   * @private
   * @param {WebClient} web A WebClient instance.
   * @return {Promise<Map<string, object>>} Map from user id to user data
   * object.
   */
  static getInitialUserData(web) {
    return web.users.list().then((res) => {
      const map = new Map();
      const promises = [];

      for (const user of res.members) {
        const { id, name, real_name } = user;
        const promise = this.compileUserData(web, name, real_name).then(
          (userData) => {
            map.set(id, userData);
          }
        );

        promises.push(promise);
      }

      return Promise.all(promises).then(() => map);
    });
  }

  /**
   * Compile data for the given user.
   *
   * @param {WebClient} web A WebClient instance.
   * @param {string} username The username by which to identify the user.
   * @param {string} name The name of the user.
   * @return {Promise<object>} Data related to the user.
   */
  static compileUserData(web, username, name) {
    return this.fetchUserMessages(web, username).then((messages) => {
      const messageInfo = messages.map(({ message, channel, timestamp }) => {
          const rating = computeMessageRating(message);
          return { rating, channel, timestamp };
        }
      );
      const ratings = messageInfo.map(info => info.rating);
      const psychoPass = computeUserPsychoPass(ratings);

      return { username, name, psychoPass, messageInfo };
    });
  }

  /**
   * Fetch initial channel data.
   *
   * @private
   * @param {WebClient} web A WebClient instance.
   * @return {Promise<Map<string, object>>} Map from channel id to channel data
   * object.
   */
  static getInitialChannelData(web) {
    return Promise.resolve(new Map());
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
   * @return {string|null} The response to be sent to the client or
   * null if there is no response.
   */
  newMessage(id, message, channel, timestamp) {
    this.updateUser(id, message, channel, timestamp);

    const commandInfo = this.parseCommand(message);
    if (commandInfo) {
      switch (commandInfo.command) {
        case 'user':
          return this.psychoPassUser(commandInfo.id);
        case 'help':
          return this.help();
      }
    }

    return null;
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

      let subCommand = /^<([@#].{2,})>/;
      const result = subCommand.exec(fragment);
      if (result) {
        const info = { id: result[1].substr(1) };

        if (result[1].charAt(0) == '@') {
          info.command = 'user';
        } else {
          info.command = 'channel';
        }

        return info;
      }

      subCommand = /^help(?:\s|$)/;
      if (subCommand.test(fragment)) {
        const info = { command: 'help' };
        return info;
      }

      subCommand = 'leaderboard ';
      if (fragment.startsWith(subCommand)) {
        const subFragment = fragment.substr(subCommand.length);

        let command = /^users(?:\s|$)/;
        if (command.test(subFragment)) {
          const info = { command: 'users' };
          return info;
        }

        command = /^channels(?:\s|$)/;
        if (command.test(subFragment)) {
          const info = { command: 'channels' };
          return info;
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
    return 'The following commands are available:\n\n' +
      'psychopass @username\n' +
      'psychopass help';
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
    const messageInfo = this.store.users.get(id).messageInfo;
    const len = messageInfo.unshift(info);

    if (len > NUM_USER_MESSAGES) {
      messageInfo.pop();
    }

    const ratings = messageInfo.map(info => info.rating);
    const psychoPass = computeUserPsychoPass(ratings);

    this.store.users.get(id).psychoPass = psychoPass;
  }

  /**
   * Handle a request for the Psycho-Pass of a user and produce a response.
   *
   * @private
   * @param {string} id The user id.
   * @return {string} Response to the request.
   */
  psychoPassUser(id) {
    const name = this.getNameById(id);
    const psychoPass = this.getUserPsychoPass(id);

    return `${name} has a Psycho-Pass of ${psychoPass}`;
  }

  /**
   * Fetch the {NUM_USER_MESSAGES} most recent messages for a user.
   *
   * @private
   * @param {WebClient} web A WebClient instance.
   * @param {string} username
   * @return {Promise<object[]>} The message objects.
   */
  static fetchUserMessages(web, username) {
    const query = `from:${username}`;
    const options = { sort: 'timestamp', count: 10 };

    return web.search.messages(query, options).then((res) => {
      const messages = res.messages.matches.map(messageData => ({
        message: messageData.text,
        channel: messageData.channel.id,
        timestamp: messageData.ts,
      }));

      return messages;
    });
  }

  /**
   * Translate a user id to a username.
   *
   * @private
   * @param {string} id The user id.
   * @return {string} The username. 
   */
  getUsernameById(id) {
    return this.store.users.get(id).username;
  }

  /**
   * Translate a user id to a name.
   *
   * @private
   * @param {string} id The user id.
   * @return {string} The name.
   */
  getNameById(id) {
    return this.store.users.get(id).name;
  }

  /**
   * Get a user's Psycho-Pass.
   *
   * @param {string} id The user id.
   * @return {number} The user's Psycho-Pass.
   */
  getUserPsychoPass(id) {
    return this.store.users.get(id).psychoPass;
  }
};
