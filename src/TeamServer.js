/**
 * Class responsible for serving an individual team.
 */

import { WebClient, RtmClient, RTM_EVENTS } from '@slack/client';

import DataStore from './DataStore';
import Sibyl from './Sibyl';

export default class {
  constructor(token) {
    this.web = new WebClient(token);
    this.rtm = new RtmClient(token, { logLevel: 'warn' });
    this.store = new DataStore();
    this.sibyl = new Sibyl(this.store);

    this.initializeDataStore().then(() => {
      this.bindEventHandlers();
      this.rtm.start();
      console.log('Connected to RTM server');
    }).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }

  /**
   * Initialize the data store with user and channel data.
   *
   * @private
   * @return {Promise}
   */
  initializeDataStore() {
    return Promise.all([
      this.initializeUserData(),
      this.initializeChannelData(),
    ]);
  }

  /**
   * Fetch and store initial user data.
   *
   * @private
   * @return {Promise}
   */
  initializeUserData() {
    return web.users.list().then(({ members }) => {
      const promises = [];

      members.forEach(({ id, name: username, real_name: realName }) => {
        const promise = this.compileUserData(username).then(
          ({ psychoPass, messageInfo }) => {
            this.store.addUser(id, username, realName, psychoPass, messageInfo);
          }
        );

        promises.push(promise);
      });

      return Promise.all(promises);
    });
  }

  /**
   * Compile data for the given user.
   *
   * @private
   * @param {string} username The username by which to identify the user.
   * @return {Promise<object>} Data related to the user.
   */
  compileUserData(username) {
    return this.fetchUserMessages(username).then((userMessageInfo) => {
      const messages = userMessageInfo.map(({ message }) => message);
      const {
        psychoPass,
        messageRatings,
      } = Sibyl.processUserMessages(messages);
      const messageInfo = userMessageInfo.map(
        ({ channel, timestamp }, index) => {
          const rating = messageRatings[index];
          return { rating, channel, timestamp };
        }
      );

      return { psychoPass, messageInfo };
    });
  }

  /**
   * Fetch the {Sibyl.NUM_USER_MESSAGES} most recent messages for a user.
   *
   * @private
   * @param {string} username
   * @return {Promise<object[]>} The message objects.
   */
  fetchUserMessages(username) {
    const query = `from:${username}`;
    const options = { sort: 'timestamp', count: Sibyl.NUM_USER_MESSAGES };

    return web.search.messages(query, options).then(
      ({ messages: { matches: userMessages } }) => {
        const messageInfo = userMessages.map(({
          text: message,
          ts: timestamp,
          channel: { id: channel },
        }) => ({ message, channel, timestamp }));

        return messageInfo;
      }
    );
  }

  /**
   * Fetch and store initial channel data.
   *
   * @private
   * @return {Promise}
   */
  initializeChannelData() {
    return web.channels.list({ exclude_archived: 1 }).then(({ channels }) => {
      const promises = [];

      channels.forEach(({ id, name }) => {
        const promise = this.compileChannelData(id).then(
          ({ psychoPass, messageInfo }) => {
            this.store.addChannel(id, name, psychoPass, messageInfo);
          }
        );

        promises.push(promise);
      });

      return Promise.all(promises);
    });
  }

  /**
   * Compile data for the given channel.
   *
   * @private
   * @param {string} id The channel id.
   * @return {Promise<object>} Data related to the channel.
   */
  compileChannelData(id) {
    return web.channels.history(id, { count: Sibyl.NUM_CHANNEL_MESSAGES }).then(
      ({ messages }) => {
        const messageText = messages.map(({ text }) => text);
        const {
          psychoPass,
          messageRatings,
        } = Sibyl.processChannelMessages(messageText);
        const messageInfo = messages.map(({ ts: timestamp }, index) => {
          const rating = messageRatings[index];
          return { rating, timestamp };
        });

        return { psychoPass, messageInfo };
      }
    );
  }

  bindEventHandlers() {
    this.rtm.on(RTM_EVENTS.MESSAGE, this.handleMessage.bind(this));
    // this.rtm.on(
    //   RTM_EVENTS.CHANNEL_CREATED,
    //   this.handleChannelCreated.bind(this)
    // );
    // this.rtm.on(
    //   RTM_EVENTS.CHANNEL_DELETED,
    //   this.handleChannelDeleted.bind(this)
    // );
    // this.rtm.on(RTM_EVENTS.CHANNEL_RENAME, this.handleChannelRename.bind(this));
    // this.rtm.on(
    //   RTM_EVENTS.CHANNEL_ARCHIVE,
    //   this.handleChannelArchive.bind(this)
    // );
    // this.rtm.on(
    //   RTM_EVENTS.CHANNEL_UNARCHIVE,
    //   this.handleChannelUnarchive.bind(this)
    // );
    // this.rtm.on(
    //   RTM_EVENTS.CHANNEL_HISTORY_CHANGED,
    //   this.handleChannelHistoryChanged.bind(this)
    // );
  }

  handleMessage({ subtype, user, text, channel, ts }) {
    // TODO: Address these message subtypes
    // me_message
    // message_changed
    // message_deleted
    // file_comment
    if (subtype === 'bot_message') {
      return;
    }

    const responses = this.sibyl.newMessage(user, text, channel, ts);

    responses.forEach((res) => {
      this.sendMessage(res, channel);
    });
  }

  /**
   * Send a message to a channel.
   *
   * @private
   * @param {string} text The message body.
   * @param {string} channel The channel id.
   */
  sendMessage(text, channel) {
    const opts = {
      as_user: false,
      username: 'Sibyl',
      icon_url: 'https://vignette2.wikia.nocookie.net/psychopass/images/9/91/' +
        'Bureau_logo.png/revision/latest?cb=20141029201419',
    };

    this.web.chat.postMessage(channel, text, opts);
  }
};
