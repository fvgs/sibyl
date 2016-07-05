/**
 * Class responsible for serving an individual team.
 */

import { WebClient, RtmClient, RTM_EVENTS } from '@slack/client';

import Sibyl from './Sibyl';

export default class TeamServer {
  constructor(token) {
    this.web = new WebClient(token);
    this.rtm = new RtmClient(token, { logLevel: 'warn' });

    this.bindEventHandlers();

    Sibyl.createSibyl(token).then((sibyl) => {
      this.sibyl = sibyl;
      this.rtm.start();
      console.log('Connected to RTM server');
    }).catch((err) => {
      console.error(err);
      process.exit(1);
    });
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

    const response = this.sibyl.newMessage(user, text, channel, ts);

    if (response) {
      this.sendMessage(response, channel);
    }
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
