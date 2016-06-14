import { WebClient } from '@slack/client';

import { computeUserPsychoPass, NUM_USER_MESSAGES } from './psychoPass';

/**
 * Class responsible for processing input and maintaing the application state.
 * Produces a response to be sent to the client when appropriate.
 */
export default class {
  /**
   * Initialize data store and Slack web client.
   *
   * @param {string} token The Slack API token.
   */
  constructor(token) {
    this.store = { userInfo: {}, users: {}, channels: {} };
    this.web = new WebClient(token);
  }

  /**
   * Process a new message.
   *
   * @public
   * @param {string} user The user id of the sender.
   * @param {string} message The body of the message.
   * @param {string} channel The id of the channel, group, or dm to which the
   * message was posted.
   * @param {string} timestamp
   * @return {Promise<string|null>} The response to be sent to the client or
   * null if there is no response.
   */
  newMessage(user, message, channel, timestamp) {
    const commandInfo = this.parseCommand(message);

    if (commandInfo) {
      if ('text' in commandInfo) {
        this.updateUser(user, commandInfo.text, channel, timestamp);
      }

      switch (commandInfo.command) {
        case 'user':
          return this.psychoPassUser(commandInfo.id);
      }
    } else {
      this.updateUser(user, message, channel, timestamp);
    }

    return Promise.resolve(null);
  }

  /**
   * Parse a command from a message.
   *
   * @private
   * @param {string} message
   * @return {object|null} An object containing information about the parsed
   * command if one is found and any text after the command if present. If no
   * command is found returns null.
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

        const text = fragment.substr(result[0].length + 1);
        if (text.length > 0) {
          info.text = text;
        }

        return info;
      }

      subCommand = /^help(?:\s|$)/;
      if (subCommand.test(fragment)) {
        const info = { command: 'help' };
        const text = fragment.substr('help'.length + 1);

        if (text.length > 0) {
          info.text = text;
        }

        return info;
      }

      subCommand = 'leaderboard ';
      if (fragment.startsWith(subCommand)) {
        const subFragment = fragment.substr(subCommand.length);

        let command = /^users(?:\s|$)/;
        if (command.test(subFragment)) {
          const info = { command: 'users' };
          const text = subFragment.substr('users'.length + 1);

          if (text.length > 0) {
            info.text = text;
          }

          return info;
        }

        command = /^channels(?:\s|$)/;
        if (command.test(subFragment)) {
          const info = { command: 'channels' };
          const text = subFragment.substr('channels'.length + 1);

          if (text.length > 0) {
            info.text = text;
          }

          return info;
        }
      }
    }

    return null;
  }

  /**
   * Store message data for a given user.
   *
   * @private
   * @param {string} id The user id.
   * @param {string} message
   * @param {string} channel The id of the channel, group, or dm.
   * @param {string} timestamp
   */
  updateUser(id, message, channel, timestamp) {
    const userData = { message, channel, timestamp };

    if (id in this.store.users) {
      const len = this.store.users[id].unshift(userData);
      if (len > NUM_USER_MESSAGES) {
        this.store.users[id].pop();
      }
    } else {
      this.store.users[id] = [userData];
    }
  }

  /**
   * Handle a request for the Psycho-Pass of a user and produce a response.
   *
   * @private
   * @param {string} id The user id.
   * @return {Promise<string>} Response to the request.
   */
  psychoPassUser(id) {
    return this.getUserPsychoPass(id).then((psychoPass) => {
      if (psychoPass === null) {
        return 'The person whose Psycho-Pass was requested does not exist.';
      } else {
        return `The user's Psycho-Pass is ${psychoPass}.`;
      }
    }).catch((err) => {
      return `Sibyl has encountered an error communicating with Slack's ` +
        'servers.\nPlease try again later.';
    });
  }

  /**
   * Compute a user's Psycho-Pass.
   *
   * @private
   * @param {string} id The user id.
   * @return {Promise<number|null>} The user's Psycho-Pass or null if the id is
   * invalid.
   */
  getUserPsychoPass(id) {
    return this.isValidUserId(id).then((isValid) => {
      if (!isValid) {
        return null;
      }

      if (this.insufficientMessages(id)) {
        return this.fetchMessages(id).then(() => {
          if (!(id in this.store.users)) {
            this.store.users[id] = [];
          }

          return this.getUserPsychoPassHelper(id);
        });
      }

      return this.getUserPsychoPassHelper(id);
    });
  }

  /**
   * Compute a user's Psycho-Pass.
   *
   * @private
   * @param {string} id The user id.
   * @return {number} The user's Psycho-Pass.
   */
  getUserPsychoPassHelper(id) {
    const messageData = this.store.users[id];
    const messages = messageData.map(data => data.message);
    const psychoPass = computeUserPsychoPass(messages);

    return psychoPass;
  }

  /**
   * Determine if a user id is valid. Calling this function will store user data
   * for the given user in the data store.
   *
   * @private
   * @param {string} id The user id.
   * @return {Promise<boolean>} True if the id is valid, false otherwise.
   */
  isValidUserId(id) {
    if (id in this.store.userInfo) {
      return Promise.resolve(true);
    }

    return this.web.users.info(id).then((userInfo) => {
      const { name, real_name } = userInfo.user;
      this.store.userInfo[id] = { username: name, name: real_name };
      return true;
    }).catch((err) => {
      switch (err.message) {
        case 'user_not_found':
        case 'user_not_visible':
        case 'invalid_arg_name':
        case 'invalid_array_arg':
          return false;
        default:
          throw err;
      }
    });
  }

  /**
   * Check if the data store contains insufficient messages to compute a user's
   * Psycho-Pass.
   *
   * @private
   * @param {string} id The user id.
   * @return {boolean} True if there are insufficient messages, false otherwise.
   */
  insufficientMessages(id) {
    return !(id in this.store.users) ||
      this.store.users[id].length < NUM_USER_MESSAGES;
  }

  /**
   * Fetch and store the {NUM_USER_MESSAGES} most recent messages for a user.
   *
   * @private
   * @param {string} id The user id.
   * @return {Promise}
   */
  fetchMessages(id) {
    const username = this.getUsernameById(id);
    const query = `from:${username}`;
    const options = { sort: 'timestamp', count: 10 };

    return this.web.search.messages(query, options).then((res) => {
      const messages = res.messages.matches.map(messageData => ({
        message: messageData.text,
        channel: messageData.channel.id,
        timestamp: messageData.ts,
      }));

      this.store.users[id] = messages;
    }).catch(() => {});
  }

  /**
   * Translate a user id to a username.
   *
   * @private
   * @param {string} id The user id.
   * @return {string|null} The username or null if no matching user found.
   */
  getUsernameById(id) {
    if (!(id in this.store.userInfo)) {
      return null;
    } else {
      return this.store.userInfo[id].username;
    }
  }
};
