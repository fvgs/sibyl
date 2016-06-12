import { NUM_USER_MESSAGES } from './psychoPass';

/**
 * Class responsible for processing input and maintaing the application state.
 * Produces a response to be sent to the client when appropriate.
 */
export default class {
  /**
   * Initialize data store.
   */
  constructor() {
    this.store = {};
  }

  /**
   * Process a new message.
   *
   * @public
   * @param {string} user The user id of the sender.
   * @param {string} message The body of the message.
   * @param {string} setting The id of the channel, group, or dm to which the
   * message was posted.
   * @param {string} timestamp
   * @return {string|null} The response to be sent to the client or null if
   * there is no response.
   */
  newMessage(user, message, setting, timestamp) {
    const commandInfo = this.parseCommand(message);

    if (!commandInfo) {
      this.updateUser(user, message, setting, timestamp);
    } else if ('text' in commandInfo) {
      this.updateUser(user, commandInfo.text, setting, timestamp);
    }
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
      return { command: 'same setting' };
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
          info.command = 'setting';
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
   * @param {string} user The id of the user.
   * @param {string} message
   * @param {string} setting The id of the channel, group, or dm.
   * @param {string} timestamp
   */
  updateUser(user, message, setting, timestamp) {
    const userData = { message, setting, timestamp };

    if (user in this.store) {
      const len = this.store[user].unshift(userData);
      if (len > NUM_USER_MESSAGES) {
        this.store[user].pop();
      }
    } else {
      this.store[user] = [userData];
    }
  }
};
