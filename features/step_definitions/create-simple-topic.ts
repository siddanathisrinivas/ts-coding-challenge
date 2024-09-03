import { Given, Then, When, setDefaultTimeout } from "@cucumber/cucumber";
import {
  Client,
  KeyList,
  RequestType,
} from "@hashgraph/sdk";
import { accounts } from "../../src/config";
import assert from "node:assert";
import ConsensusSubmitMessage = RequestType.ConsensusSubmitMessage;

import {
  createTopic,
  getAccountBalance,
  getAccountDetails,
  getTopicInfo,
  getTopicMessage,
  submitMsgToTopic
} from "../../src/create-simple-topic"

setDefaultTimeout(60000);
const client = Client.forTestnet()


Given(/^a first account with more than (\d+) hbars$/, async function (expectedBalance: number) {
  const accountInfo = await getAccountDetails(accounts[0]);
  this.accountId = accountInfo.accountId
  this.myPrivateKey = accountInfo.privateKey
  client.setOperator(this.accountId, this.myPrivateKey);

  const balance = await getAccountBalance(this.accountId, client, null);
  console.log(`Balance of the account: ${balance}`);

  assert.ok(balance > expectedBalance);
});

When(/^A topic is created with the memo "([^"]*)" with the first account as the submit key$/, async function (memo: string) {
  this.topicId = await createTopic(this.myPrivateKey.publicKey, client, memo);
  const topicInfo = await getTopicInfo(this.topicId, client);
  assert.equal(topicInfo.topicMemo, memo);
  assert.equal(String(topicInfo.submitKey), this.myPrivateKey.publicKey.toString());
});

When(/^The message "([^"]*)" is published to the topic$/, async function (message: string) {
  const transactionStatus = await submitMsgToTopic(this.topicId, client, this.myPrivateKey, message)
  assert.equal(transactionStatus, "SUCCESS");
});

Then(/^The message "([^"]*)" is received by the topic and can be printed to the console$/, async function (message: string) {
  const recivedMsg = await getTopicMessage(this.topicId, client)
  console.log(`Received message from the topic: ${recivedMsg}`);
  assert.equal(recivedMsg, message);

});

Given(/^A second account with more than (\d+) hbars$/, async function (expectedBalance: number) {
  const accountDetails = await getAccountDetails(accounts[1]);
  this.secondAccountId = accountDetails.accountId;
  this.secondPrivateKey = accountDetails.privateKey;
  client.setOperator(this.secondAccountId, this.secondPrivateKey);
  const balance = await getAccountBalance(this.secondAccountId, client, null);
  assert.ok(balance > expectedBalance)
});

Given(/^A (\d+) of (\d+) threshold key with the first and second account$/, async function (threshold: number, size: number) {
  const publicKeyList = [this.myPrivateKey.publicKey, this.secondPrivateKey.publicKey];
  const thresholdKey =  new KeyList(publicKeyList, threshold);
  this.thresholdKey = thresholdKey;
  assert.ok(size > threshold);
  assert.equal(thresholdKey.threshold, threshold);
});

When(/^A topic is created with the memo "([^"]*)" with the threshold key as the submit key$/, async function (memo: string) {
  this.topicId = await createTopic(this.thresholdKey, client, memo)
  const topicInfo = await getTopicInfo(this.topicId, client);
  assert.equal(topicInfo.topicMemo, memo);
  assert.equal(String(topicInfo.submitKey), this.thresholdKey.toString());
});
