/**
 * Functions for computing a Psycho-Pass.
 */

import sentiment from 'sentiment';

/**
 * Compute a user's Psycho-Pass.
 *
 * @public
 * @param {string[]} messages The user's ten most recent messages beginning with
 * the latest and ending with the oldest.
 * @returns {Number} The user's Psycho-Pass.
 */
function computeUserPsychoPass(messages) {
  const weights = [5, 5, 5, 4, 4, 3, 3, 2, 2, 2];
  const psychoPass = messages.reduce(helper, 0);
  return psychoPass;

  function helper(prev, current, index) {
    const messagePsychoPass = computeMessagePsychoPass(current);
    const weightedMessagePyschoPass = weights[index] * messagePsychoPass;
    const sum = prev + weightedMessagePyschoPass;

    return sum;
  }
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
 * @returns {Number} The Psycho-Pass rating
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

export { computeUserPsychoPass, computeChannelPsychoPass };
