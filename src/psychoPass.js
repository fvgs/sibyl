/**
 * Functions for computing a Psycho-Pass.
 */

import sentiment from 'sentiment';

const NUM_USER_MESSAGES = 10;

/**
 * Compute a user's Psycho-Pass.
 *
 * @public
 * @param {string[]} messages An array containing zero to {NUM_USER_MESSAGES}
 * messages beginning with the most recent and ending with the oldest.
 * @return {number} The user's Psycho-Pass.
 */
function computeUserPsychoPass(messages) {
  const weightedRatingSum = messages.reduce(helper, 0);
  const base = 70;
  let psychoPass = Math.floor(base + weightedRatingSum);

  if (psychoPass < 0) {
    psychoPass = 0;
  }

  return psychoPass;
}

/**
 * Compute the weighted rating of a message and return the accumulated sum.
 *
 * @private
 * @param {number} The accumulated sum.
 * @param {string} The current message.
 * @param {number} The index of the current message.
 * @return {number} The new sum.
 */
function helper(prev, current, index) {
  const weights = [5, 5, 5, 4, 4, 3, 3, 2, 2, 2];
  const messagePsychoPass = computeMessagePsychoPass(current);
  const weightedMessagePyschoPass = weights[index] * messagePsychoPass;
  const sum = prev + weightedMessagePyschoPass;

  return sum;
}

/**
 * Compute a channel's Psycho-Pass.
 */
function computeChannelPsychoPass() {

}

/**
 * Compute the Psycho-Pass rating of a single message.
 *
 * @private
 * @param {string} message
 * @return {number} The Psycho-Pass rating.
 */
function computeMessagePsychoPass(message) {
  const { score, comparative } = sentiment(message);
  let psychoPass;

  if (score >= 0) {
    psychoPass = score * comparative * -1;
  } else {
    let multiplier = -1;
    if (comparative < -1) {
      multiplier = Math.sqrt(Math.abs(comparative)) * -1;
    }
    psychoPass = score * multiplier;
  }

  return psychoPass;
}

export { computeUserPsychoPass, computeChannelPsychoPass, NUM_USER_MESSAGES };
